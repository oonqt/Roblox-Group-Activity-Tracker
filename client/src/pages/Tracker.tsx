import React, { Component, Fragment } from 'react';
import axios from 'axios';
import { Container, Column, Progress, Button } from 'rbx';
import Debounce from 'awesome-debounce-promise';
import requirements from '../requirements';
import { getCurrentWeek } from '../utils';

import TrackerContext from '../context/TrackerContext';

import ActivityCard from '../components/ActivityCard';
import Message from '../components/Message';
import ListControl from '../components/ListControl';

interface Role {
	name: string;
	color: string;
}

interface UserData {
	username: string;
	role: string;
	rank: number;
	userId: number;
	seconds: number;
	weekId: string;
	inGame: boolean;
	roles: Role[];
}

interface State {
	loading: boolean;
	weekRanges: string[];
	search: string;
	error: boolean;
	users: UserData[];
	weekId: string;
	queriedUsers: UserData[] | null;
	ws: WebSocket | null;
}

interface RankChange {
	oldRole: string;
	newRole: string;
	oldRank: number;
	newRank: number;
	userId: number;
	at: string;
}

type WebsocketResponse =
	| { name: 'userleavegame'; data: Array<{ userId: number; seconds: number }> }
	| { name: 'userjoingame'; data: Array<{ userId: number }> }
	| { name: 'usersecondsupdate'; data: Array<{ userId: number; seconds: number }> }
	| { name: 'updatediscordroles'; data: Array<{ userId: number; roles: Role[] }> }
	| { name: 'rankchange'; data: RankChange[] };

class Index extends Component {
	state: Readonly<State> = {
		users: [],
		queriedUsers: null,
		weekRanges: [],
		search: '',
		weekId: getCurrentWeek(),
		loading: true,
		error: false,
		ws: null
	};

	static contextType = TrackerContext;

	timeout = 1000;
	mounted = false;

	componentDidMount() {
		this.mounted = true;
		this.updateActivity(this.state.weekId);
		this.connect();
	}

	componentWillUnmount() {
		this.mounted = false;
		if (this.state.ws) this.state.ws.close()
	}

	connect = () => {
		let ws = new WebSocket(
			`${window.location.protocol === 'https:' ? 'wss' : 'ws'}://${
				window.location.host
			}/realtime`
		);
		let self = this;
		let connectInterval: NodeJS.Timeout | null;
		let pingInterval: NodeJS.Timeout | null;

		ws.onopen = () => {
			console.log('Websocket connection established');

			this.setState({ ws });

			pingInterval = setInterval(() => {
				ws.send('ping');
			}, 30000);

			self.timeout = 1000;
			if (connectInterval) clearTimeout(connectInterval);
		};

		ws.onmessage = (message) => {
			const data: WebsocketResponse = JSON.parse(message.data);

			const { users, queriedUsers, weekId } = this.state;
			const isSelectedCurrentWeek = weekId === getCurrentWeek();

			console.debug(data);

			switch (data.name) {
				case 'userjoingame': {
					const joinMap = (user: UserData): UserData  => {
						let updateMatch = data.data.find(u => u.userId === user.userId);

						return updateMatch ? { ...user, inGame: true } : user;
					}

					let newState: any = {
						users: users.map(joinMap)
					}

					this.asyncSearch();

					this.setState(newState);

					break;
				}
				case 'userleavegame': {
					const leaveMap = (user: UserData): UserData  => {
						let updateMatch = data.data.find(u => u.userId === user.userId);

						return updateMatch ? { ...user, inGame: false, seconds: isSelectedCurrentWeek ? updateMatch.seconds : user.seconds } : user;
					}

					let newState: any = {
						users: users.map(leaveMap)
					};

					this.asyncSearch();

					this.setState(newState);

					break;
				}
				case 'usersecondsupdate': {
					if(!isSelectedCurrentWeek) return;

					const updateMap = (user: UserData): UserData  => {
						let updateMatch = data.data.find(u => u.userId === user.userId);

						return updateMatch ? { ...user, seconds: updateMatch.seconds } : user;
					}

					let newState: any = {
						users: users.map(updateMap)
					};

					if (queriedUsers) newState.queriedUsers = queriedUsers.map(updateMap);

					this.setState(newState);

					break;
				}
				case 'updatediscordroles': {
					const updateMap = (user: UserData): UserData  => {
						let updateMatch = data.data.find(u => u.userId === user.userId);

						return updateMatch ? { ...user, roles: updateMatch.roles } : user;
					}

					let newState: any = {
						users: users.map(updateMap)
					};

					if (queriedUsers) newState.queriedUsers = queriedUsers.map(updateMap);

					this.setState(newState);

					break;
				}
				case 'rankchange': {
					const updateMap = (user: UserData): UserData => {
						let updateMatch = data.data.find(u => u.userId === user.userId);

						return updateMatch ? { ...user, rank: updateMatch.newRank, role: updateMatch.newRole } : user;
					}

					let newState: any = {
						users: users.map(updateMap)
					}	

					if (queriedUsers) newState.queriedUsers = queriedUsers.map(updateMap);

					this.setState(newState);

					break;
				}
				default:
					console.warn('Unrecognized event: ', data);
			}
		};

		ws.onclose = (e) => {
			if (pingInterval) clearInterval(pingInterval);
			if (!this.mounted) return;

			console.warn(
				`Socket closed. Attempting to reconnect in ${Math.min(
					10,
					(self.timeout + self.timeout) / 1000
				)} seconds`,
				e.reason
			);

			self.timeout += self.timeout;
			connectInterval = setTimeout(this.check, Math.min(10000, self.timeout));
		};

		ws.onerror = (err) => {
			console.error('Websocket errored, closing', err);

			ws.close();
		};
	};

	check = () => {
		const ws = this.state.ws;

		if (!ws || ws.readyState === WebSocket.CLOSED) this.connect();
	};

	updateActivity = (weekId?: string) => {
		let endpoint = '/api/activity';

		if (weekId) endpoint += `?weekId=${weekId}`;

		this.setState({
			loading: true,
			weekId,
			queriedUsers: null,
			search: ''
		});

		axios
			.get(endpoint)
			.then((res) => {
				this.setState({
					loading: false,
					users: res.data.users,
					weekRanges: res.data.weekRanges,
					error: false
				});
			})
			.catch((err) => {
				this.setState({ loading: false, error: true });
				console.error(err);
			});
	};

	dateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		if (this.state.weekId === e.target.value) return;

		this.updateActivity(e.target.value);
	};

	asyncSearch = Debounce(() => {
		if (!this.state.search) return this.setState({ queriedUsers: null });

		let search = this.state.users.map((user) => {
			let searchData: string[] = [];

			searchData.push(user.username);
			searchData.push(user.role);
			searchData.push(`${Math.floor(user.seconds / 60 / 10) * 10} Minutes`);
			if (user.inGame) searchData.push('In Game');
			if (requirements[user.role]) {
				let requirementsMet = requirements[user.role] <= user.seconds / 60;
				searchData.push(
					requirementsMet ? 'Requirements Met' : 'Requirements Not Met'
				);
				searchData.push(requirementsMet ? 'Reqs Met' : 'Reqs Not Met');
			}
			user.roles.forEach((role) => searchData.push(role.name));

			return { searchData, user };
		});

		let queryResult = search
			.filter((search) =>
				search.searchData.find((element) =>
					element.toLowerCase().includes(this.state.search.trim().toLowerCase())
				)
			)
			.map((search) => search.user);

		this.setState({ queriedUsers: queryResult });
	}, 750);

	searchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		let search = e.target.value;

		this.setState({ search });
		this.asyncSearch();
	};

	render() {
		return (
			<main>
				<Container>
					<Column.Group centered>
						<Column size='four-fifths'>
							{!this.state.loading && !this.state.error && (
								<ListControl
									dateChange={this.dateChange}
									searchChange={this.searchChange}
									search={this.state.search}
									weekRanges={this.state.weekRanges}
									weekId={this.state.weekId}
								/>
							)}

							{this.state.loading ? (
								<Progress size='small' color='link'></Progress>
							) : this.state.error ? (
								<Message
									color='danger'
									header='Error'
									body={
										<Fragment>
											Something unexpected happened and we were unable to fetch
											activity for staff. Try refreshing the page, if it still
											doesn't work, join the{' '}
											<a
												href={this.context.discordInvite}
												target='_blank'
												rel='noreferrer'
											>
												Discord server
											</a>{' '}
											to report it.
											<div className='buttons' style={{ marginTop: '20px' }}>
												<Button
													color='danger'
													onClick={() => this.updateActivity(this.state.weekId)}
												>
													<strong>Reload Activity</strong>
												</Button>
											</div>
										</Fragment>
									}
								/>
							) : (
								<Fragment>
									<p>
										{this.state.queriedUsers
											? this.state.queriedUsers.length
											: this.state.users.length}{' '}
										Users Displayed
									</p>

									{(this.state.queriedUsers
										? this.state.queriedUsers
										: this.state.users
									)
										.sort((a, b) => (a.rank < b.rank ? -1 : 1))
										.sort((a, b) => (a.seconds > b.seconds ? -1 : 1))
										.map((user) => (
											<ActivityCard
												username={user.username}
												role={user.role}
												minutes={Math.round(user.seconds / 60)}
												userId={user.userId}
												key={user.userId}
												inGame={user.inGame}
												roles={user.roles}
											/>
										))}
								</Fragment>
							)}
						</Column>
					</Column.Group>
				</Container>
			</main>
		);
	}
}

export default Index;
