import request from 'request';

interface Channel {
	id: string;
	name: string;
	position: number;
}

interface Member {
	avatar_url: string;
	discriminator: string;
	id: string;
	status: string;
	username: string;
}

interface Widget {
	channels: Channel[];
	members: Member[];
	name: string;
	id: string;
	presence_count: number;
	instant_invite: string;
}

export function getWidget(guildId: string): Promise<Widget> {
	return new Promise((resolve, reject) => {
		request(
			{
				url: `https://discord.com/api/guilds/${guildId}/widget.json`,
				json: true
			},
			(err, response, body) => {
				if (err) return reject(err);

				if (response.statusCode !== 200)
					return reject(
						`Status: ${response.statusCode} Body: ${JSON.stringify(body)}`
					);

				resolve(body);
			}
		);
	});
}