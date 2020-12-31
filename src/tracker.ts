import express from 'express';
import http from 'http';
import ws from 'ws';
import morgan from 'morgan';
import cors from 'cors';
import path from 'path';
import zlib from 'zlib';
import fs from 'fs';
import rl from 'express-rate-limit';
import { Client } from 'discord.js';
import compression from 'compression';
import lowdb from 'lowdb';
import fastStringify from 'fast-stringify';
import * as weeknumber from 'weeknumber';
import FileSync from 'lowdb/adapters/FileSync';
import { getWidget } from './utils/WidgetUtil';
import Logger, { LogType } from './utils/logger';
import Roblox, { User, Roleset } from './utils/Roblox';
import discordLinks from './discordLinks';
import {
	GROUP_ID,
	MIN_WATCHING_RANK,
	MAX_WATCHING_RANK,
	COOKIE,
	POLL_INTERVAL_SECONDS,
	GAME_ID,
	CLIENT_CACHE_EXPIRE_MS,
	IGNORED_USERS,
	PORT,
	CACHE_EXPIRE_SECONDS,
	TOKEN,
	OWNER_GUILD,
	SOROS_GUILD,
	OWNER,
	RL_WINDOW_MS,
	RL_MAX_REQS,
	AUTO_SAVE_INTERVAL_SECONDS,
	BACKUP_INTERVAL_SECONDS,
	BACKUP_DIR,
	WACHING_ROLES,
	EXCLUDED_HEADSHOT_URLS,
	DISCORD_ROLE_UPDATE_INTERVAL_SECONDS,
	BACKUP_RETAIN_AMOUNT
} from './config';
import { version } from '../package.json';

interface Role {
	name: string;
	color: string;
}

interface ActivityLog {
	weekId: string;
	userId: number;
	seconds: number;
}

interface RankChange {
	oldRole: string;
	newRole: string;
	oldRank: number;
	newRank: number;
	userId: number;
	at: string;
}

interface StaffMember {
	role: string;
	rank: number;
	userId: number;
	username: string;
}

interface Database {
	activity: ActivityLog[];
	staff: StaffMember[];
	rankChanges: RankChange[];
}

interface ResolvedUser extends ActivityLog {
	username: string;
	role: string;
	rank: number;
	inGame: boolean;
	roles: Role[];
}

interface ResolvedRankHolder extends User {
	role: string;
	rank: number;
}

interface ResolvedHolder extends ResolvedRankHolder {
	headshot: string;
}

const roblox = new Roblox(COOKIE, CACHE_EXPIRE_SECONDS);

const discord = new Client({
	disabledEvents: ['TYPING_START']
});

const logger = new Logger(
	process.env.NODE_ENV === 'development' ? LogType.Console : LogType.File,
	'logs',
	'SorosTracker'
);

const adapter = new FileSync<Database>('tracker.db', {
	deserialize: (data: string) =>
		JSON.parse(
			zlib.brotliDecompressSync(Buffer.from(data, 'base64')).toString('utf-8')
		),
	serialize: (data: object) =>
		zlib.brotliCompressSync(fastStringify(data)).toString('base64')
});

const db = lowdb(adapter);
db.defaults({ activity: [], staff: [], rankChanges: [] }).write();

const app = express();

const server = http.createServer(app);
const socket = new ws.Server({
	server,
	path: '/realtime',
});

app.use(express.json());
app.use(cors());
app.use(compression());
app.set('trust proxy', 'loopback');
app.use(
	rl({
		windowMs: RL_WINDOW_MS,
		max: RL_MAX_REQS
	})
);
app.use(
	morgan(
		'IP: :remote-addr - :method :url Response Time: :response-time Status: :status UserAgent: :user-agent',
		{ stream: logger.stream }
	)
);

const trackingUsers = new Map<number, number>();
const discordRoles = new Map<number, Role[]>();

(async () => {
	const poll = async () => {
		logger.debug('Polling...');

		let rolesets;

		try {
			rolesets = await roblox.getRolesets(GROUP_ID);
		} catch (err) {
			logger.error('Failed to get rolesets');
			logger.error(err);
			return setTimeout(poll, POLL_INTERVAL_SECONDS * 1000);
		}

		const rolesetsInRange = rolesets.filter(
			(roleset) =>
				roleset.rank >= MIN_WATCHING_RANK && roleset.rank <= MAX_WATCHING_RANK
		);

		let holders;

		try {
			holders = (
				await Promise.all(
					rolesetsInRange.map((roleset) => resolveRankHolders(roleset))
				)
			)
				.flat()
				.filter((holder) => !IGNORED_USERS.includes(holder.userId));
		} catch (err) {
			logger.error('Failed to get holders');
			logger.error(err);
			return setTimeout(poll, POLL_INTERVAL_SECONDS * 1000);
		}

		for (const holder of holders) {
			if (
				!db
					.get('activity')
					.find(
						(activity) =>
							activity.userId === holder.userId &&
							activity.weekId === formatWeekID()
					)
					.value()
			) {
				db.get('activity')
					.push({
						userId: holder.userId,
						seconds: 0,
						weekId: formatWeekID()
					})
					.write();
			}
		}

		let usersInGameHeadshots: string[];

		try {
			usersInGameHeadshots = (await roblox.getUsersInGame(GAME_ID)).map(
				(user) => user.Thumbnail.Url
			);
		} catch (err) {
			logger.error('Failed to get headshots of users in game');
			logger.error(err);
			return setTimeout(poll, POLL_INTERVAL_SECONDS * 1000);
		}

		const holdersInGame = holders.filter(
			(holder) =>
				usersInGameHeadshots.includes(holder.headshot) &&
				!EXCLUDED_HEADSHOT_URLS.includes(holder.headshot)
		);

		for (const [userId, joined] of trackingUsers) {
			let leaves: Array<{ userId: number; seconds: number }> = [];

			if (!holdersInGame.find((holder) => holder.userId === userId)) {
				logger.debug(`Ending session for ${userId}, joined at ${joined}`);
				let seconds = endSession(userId, joined);
				leaves.push({ userId, seconds });
			}

			leaves.length && broadcastWSMessage({ name: 'userleavegame', data: leaves })
		}

		for (const holder of holdersInGame) {
			let joined: number[] = [];

			if (!trackingUsers.has(holder.userId)) {
				logger.debug(`${holder.username} has joined the game`);
				trackingUsers.set(holder.userId, new Date().getTime());
				joined.push(holder.userId);
			}

			joined.length &&
				broadcastWSMessage({
					name: 'userjoingame',
					data: joined
				});
		}

		let lastCheck = db.get('staff').value();
		let rankChanges: RankChange[] = [];

		if (lastCheck.length) {
			for (const holder of holders) {
				if (!lastCheck.find((staff) => staff.userId === holder.userId)) {
					logger.debug(`${holder.username} is a new user!`);

					rankChanges.push({
						userId: holder.userId,
						at: new Date().toISOString(),
						oldRank: 0,
						oldRole: 'Unknown Rank',
						newRank: holder.rank,
						newRole: holder.role
					});
				}
			}
		}

		for (const staffMember of lastCheck) {
			let currentCheck = holders.find(
				(holder) => holder.userId === staffMember.userId
			);

			if (!currentCheck || currentCheck.rank !== staffMember.rank) {
				let newGroupStatus = await roblox.getGroupStatus(
					staffMember.userId,
					GROUP_ID,
					true
				);

				rankChanges.push({
					userId: staffMember.userId,
					oldRank: staffMember.rank,
					oldRole: staffMember.role,
					newRole: newGroupStatus.role,
					newRank: newGroupStatus.rank,
					at: new Date().toISOString()
				});

				logger.debug(
					`${staffMember.username}'s rank has changed from ${staffMember.role} to ${newGroupStatus.role}`
				);
			}
		}

		if (rankChanges.length) {
			broadcastWSMessage({ name: 'rankchange', data: rankChanges });
	
			db.get('rankChanges')
				.push(...rankChanges)
				.write();
		}

		db.get('staff').remove().write();

		db.get('staff')
			.push(
				...holders.map((holder) => ({
					username: holder.username,
					rank: holder.rank,
					role: holder.role,
					userId: holder.userId
				}))
			)
			.write();

		logger.debug('Successfully polled...');

		setTimeout(poll, POLL_INTERVAL_SECONDS * 1000);
	};

	poll();
})();

discord.once('ready', () => {
	discord.user.setStatus('dnd');

	const guild = discord.guilds.get(SOROS_GUILD)!;
	if (!guild)
		return logger.warn(
			'Soros guild not found, skipping inactivity notice detection'
		);

	let robloxIds = Object.keys(discordLinks);

	function updateRoles() {
		logger.debug('Updating Discord roles');

		Promise.allSettles(
			robloxIds.map((link) =>
				guild.fetchMember(discordLinks[parseInt(link)], false)
			)
		)
			.then((members) => {
				let updatedUsers: Array<{ userId: number; roles: Role[]; }> = [];

				for (const member of members) {
					const robloxId = parseInt(robloxIds.find(
						(id) => discordLinks[parseInt(id)] === member.id
					)!);

					if (!robloxId) continue;

					const watchingRoles = member.roles
						.filter((role) =>
							WACHING_ROLES.includes(role.id)
						).map((role) => ({
							color: role.hexColor === '#000000' ? '#99aab5' : role.hexColor,
							name: role.name.replace(/[^\p{L}\p{N}\p{P}\p{Z}]/gu, '').trim()
						}));

					for (const [user, roles] of discordRoles) {
						let done = false;

						for (const role of watchingRoles) {
							if (!roles.includes(role)) {
								updatedUsers.push({ userId: robloxId, roles: watchingRoles });
								done = true;
								break;
							}
						}

						if (done) break;
					}

					discordRoles.set(
						robloxId,
						watchingRoles
					);
				}

				updatedUsers.length && broadcastWSMessage({ name: 'updatediscordroles', data: updatedUsers });

				logger.debug('Finished updating discord roles');

				setTimeout(
					updateRoles,
					DISCORD_ROLE_UPDATE_INTERVAL_SECONDS * 1000
				);
			})
			.catch((err) => {
				logger.error('Failed to update Discord roles');
				logger.error(err);
				setTimeout(
					updateRoles,
					DISCORD_ROLE_UPDATE_INTERVAL_SECONDS * 1000
				);
			});
	}

	updateRoles();
});

setInterval(() => {
	let savedSessions = [];

	let updates: Array<{ userId: number; seconds: number; }> = [];

	for (const [userId, joined] of trackingUsers) {
		logger.debug(`Auto-saving ${userId}`);

		let seconds = endSession(userId, joined);

		updates.push({ userId, seconds });

		savedSessions.push(userId);
	}

	updates.length && broadcastWSMessage({
		name: 'usersecondsupdate',
		data: updates
	});

	for (const user of savedSessions) {
		trackingUsers.set(user, new Date().getTime());
	}
}, AUTO_SAVE_INTERVAL_SECONDS * 1000);

setInterval(() => {
	if (process.env.NODE_ENV === 'development') return;

	if (fs.existsSync(BACKUP_DIR)) {
		const dbData = fs.readFileSync('tracker.db', 'utf8');

		fs.writeFileSync(
			path.join(BACKUP_DIR, `${new Date().getTime()}-backup.db`),
			dbData
		);

		const backups = fs.readdirSync(BACKUP_DIR);

		const sorted = backups.sort((b1, b2) =>
			b1.split('-')[0] < b2.split('-')[0] ? -1 : 1
		);

		while (sorted.length > BACKUP_RETAIN_AMOUNT) {
			let toDelete = sorted.shift();
			if (toDelete) {
				logger.debug(`Delete ${toDelete}`);
				fs.unlinkSync(path.join(BACKUP_DIR, toDelete));
			}
		}
	} else {
		logger.warn(`Backup dir ${BACKUP_DIR} doesn't exist, skipping backup`);
	}
}, BACKUP_INTERVAL_SECONDS * 1000);

const endSession = (userId: number, joined: number): number => {
	trackingUsers.delete(userId);

	let date = new Date();

	let timeInSeconds = Math.round((date.getTime() - joined) / 1000);

	let currentTime = db.get('activity').find({
		weekId: formatWeekID(),
		userId
	});

	let seconds = currentTime.value().seconds + timeInSeconds;

	currentTime.assign({ seconds }).write();

	return seconds;
};

const broadcastWSMessage = (data: { name: string; data: any; }): void => {
	for (const client of socket.clients) {
		client.send(JSON.stringify(data));
	}
};

const formatWeekID = () => {
	let date = new Date(new Date().toLocaleString(undefined, { timeZone: 'Europe/London' }));

	return `${date.getFullYear()}-W${weeknumber.weekNumberSat(date) + 1}`;
}
	

const resolveUser = (data: ActivityLog): Promise<ResolvedUser> =>
	new Promise((resolve, reject) => {
		let promises: Promise<any>[] = [
			roblox.getUsername(data.userId),
			roblox.getGroupStatus(data.userId, GROUP_ID)
		];

		Promise.all(promises)
			.then((res) =>
				resolve({
					username: res[0],
					role: res[1].role,
					rank: res[1].rank,
					...data,
					inGame: trackingUsers.has(data.userId),
					roles: discordRoles.get(data.userId) ?? []
				})
			)
			.catch(reject);
	});

const resolveRankHolders = (roleset: Roleset): Promise<ResolvedHolder[]> =>
	new Promise((resolve, reject) => {
		roblox
			.getRankHolders(GROUP_ID, roleset.id)
			.then((users) => {
				let resolvedHolders = users.map((user) => {
					roblox.usernameCache.set(user.userId, {
						username: user.username,
						expires: new Date().getTime() + CACHE_EXPIRE_SECONDS * 1000
					});

					roblox.roleCache.set(user.userId, {
						role: roleset.name,
						rank: roleset.rank,
						expires: new Date().getTime() + CACHE_EXPIRE_SECONDS * 1000
					});

					return {
						...user,
						role: roleset.name,
						rank: roleset.rank
					};
				});

				Promise.all(
					resolvedHolders.map((holder) => resolveHolderHeadshot(holder))
				)
					.then(resolve)
					.catch(reject);
			})
			.catch(reject);
	});

const resolveRankChange = (user: RankChange) =>
	new Promise((resolve, reject) =>
		roblox
			.getUsername(user.userId)
			.then((name) => resolve({ username: name, ...user }))
			.catch(reject)
	);

const resolveHolderHeadshot = (
	holder: ResolvedRankHolder
): Promise<ResolvedHolder> =>
	new Promise((resolve, reject) =>
		roblox
			.getHeadshot(holder.userId)
			.then((headshot) => resolve({ ...holder, headshot }))
			.catch(reject)
	);

app.get('/api/info', (_, res) => {
	Promise.all([discord.fetchUser(OWNER), getWidget(OWNER_GUILD)])
		.then((data) => {
			res.json({
				activityPollInterval: POLL_INTERVAL_SECONDS,
				discordRoleCheckInterval: DISCORD_ROLE_UPDATE_INTERVAL_SECONDS,
				serverVersion: `v${version}`,
				ownerTag: `${data[0].tag}`,
				discordInvite: `${data[1].instant_invite}`
			});
		})
		.catch((err) => {
			res.sendStatus(500);
			logger.error(err);
		});
});

app.get('/api/staff', async (req, res) => {
	const queryType = req.query.type;
	if (typeof queryType !== 'string')
		return res.status(400).send('Querystring `type` must be provided');

	if (queryType === 'resignations') {
		let rankChanges = db.get('rankChanges').value();

		let resignations = rankChanges.filter(
			(change) => change.newRank < MIN_WATCHING_RANK
		);
		let sorted = resignations.sort((a, b) =>
			new Date(a.at).getTime() > new Date(b.at).getTime() ? -1 : 1
		);

		Promise.all(sorted.map((user) => resolveRankChange(user)))
			.then((data) => res.json(data))
			.catch((err) => {
				logger.error('Failed to resolve usernames');
				logger.error(err);
				res.sendStatus(500);
			});
	} else if (queryType === 'promotions') {
		let rankChanges = db.get('rankChanges').value();

		let promotions = rankChanges.filter(
			(change) => change.newRank > change.oldRank
		);
		let sorted = promotions.sort((a, b) =>
			new Date(a.at).getTime() > new Date(b.at).getTime() ? -1 : 1
		);

		Promise.all(sorted.map((user) => resolveRankChange(user)))
			.then((data) => res.json(data))
			.catch((err) => {
				logger.error('Failed to resolve usernames');
				logger.error(err);
				res.sendStatus(500);
			});
	} else {
		return res
			.status(400)
			.send('Querystring `type` must be either `resignations` or `promotions`');
	}
});

app.get('/api/activity', async (req, res) => {
	let weekId = req.query.weekId;

	if (!weekId) {
		weekId = formatWeekID();
	} else if (typeof weekId !== 'string')
		return res.status(400).send('Week must be a string');

	let users: ResolvedUser[];
	try {
		users = (
			await Promise.all(
				db
					.get('activity')
					.filter((activity) => activity.weekId === weekId)
					.value()
					.map((user) => resolveUser(user))
			)
		).map(user => user.rank < MIN_WATCHING_RANK ? { ...user, role: 'Resigned' } : user);
	} catch (err) {
		res.sendStatus(500);
		logger.error('Failed to get usernames');
		logger.error(err);
		return;
	}

	let sortedByWeeks = db
		.get('activity')
		.sort((a, b) => {
			let splitA = a.weekId.split('-W');
			let splitB = b.weekId.split('-W');

			return parseInt(splitA[0] + splitA[1]) > parseInt(splitB[0] + splitB[1])
				? -1
				: 1;
		})
		.value();

	let weekRanges: string[] = [];

	for (const { weekId } of sortedByWeeks) {
		if (!weekRanges.includes(weekId)) weekRanges.push(weekId);
	}

	res.json({
		weekRanges,
		users
	});
});

socket.on('connection', (w) => {
	logger.debug('Websocket connection established');

	w.on('close', () => logger.debug('Websocket connection established'));
});

if (process.env.NODE_ENV !== 'development') {
	const clientDir = path.join(__dirname, 'client');
	app.use(
		express.static(clientDir, {
			maxAge: CLIENT_CACHE_EXPIRE_MS
		})
	);
	app.use((_, res) => res.sendFile(path.join(clientDir, 'index.html')));
}

app.use('/', (_, res) => res.sendStatus(404));

discord.login(TOKEN);

server.listen(PORT, () => logger.info(`Listening on: ${PORT}`));
