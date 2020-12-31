import request from 'request';

export interface Roleset {
    id: number;
    name: string;
    rank: number;
    memberCount: number;
}

interface GroupRoleResponse {
    groupId: number;
    roles: Roleset[]
}

export interface User {
    buildersClubMembershipType: string;
    userId: number;
    username: string;
    displayName: string;
}

interface RankHolderResponse {
    data: User[],
    previousPageCursor: string | null;
    nextPageCursor: string | null;
}

interface Headshot {
    Url: string,
    IsFinal: boolean
}


interface Thumbnail extends Headshot {
    AssetId: number,
    AssetHash: null | string,
    AssetTypeId: number
}

interface Player {
    Id: number,
    Username: string,
    Thumbnail: Thumbnail
}

interface Group {
    description: string;
    id: number;
    isBuildersClubOnly: boolean;
    memberCount: number;
    name: string;
    publicEntryAllowed: boolean;
    owner: User;
    shout: {
        body: string;
        created: string;
        poster: User;
        updated: string;
    }
}

interface PlayerRole {
    role: Roleset;
    group: Group;
}

interface RoleResponse {
    data: PlayerRole[] 
}

interface GameServer {
    UserCanJoin: boolean;
    ShowShutdownButton: boolean;
    JoinScript: string;
    FriendsDescription: string;
    FriendsMouseover: string;
    PlayersCapacity: string;
    RobloxAppJoinScript: string;
    Capacity: number,
    Ping: number,
    Fps: number,
    ShowSlowGameMessage: boolean,
    Guid: string,
    PlaceId: number,
    CurrentPlayers: Player[]
}

interface GetGameInstancesResponse {
    PlaceId: number;
    ShowShutdownAllButton: boolean;
    Collection: GameServer[];
    TotalCollectionSize: number;
}

class Roblox {
    public readonly usernameCache: Map<number, { username: string; expires: number; }>;
    public readonly roleCache: Map<number, { role: string; rank: number; expires: number; }>;

    constructor(public cookie: string, public cacheExp: number) {
        this.cookie = cookie;
        this.usernameCache = new Map();
        this.roleCache = new Map();
    }

    public getRolesets(groupId: number): Promise<Roleset[]> {
        return new Promise((resolve, reject) => {
            request({
                url: `https://groups.roblox.com/v1/groups/${groupId}/roles`,
                json: true
            }, (err, response, body: GroupRoleResponse) => {
                if (err) return reject(err);

                if(response.statusCode !== 200) return reject(`Status: ${response.statusCode} Response: ${JSON.stringify(body)}`);

                resolve(body.roles);
            });
        });
    }

    public getUsername(userId: number): Promise<string> {
        return new Promise((resolve, reject) => {
            let usernameCacheResult = this.usernameCache.get(userId);

            if(usernameCacheResult && usernameCacheResult.expires >= new Date().getTime()) {
                resolve(usernameCacheResult.username);
            } else {
                request({
                    url: `https://api.roblox.com/users/${userId}`,
                    json: true
                }, (err, response, body) => {
                    if (err) return reject(err);
    
                    if(response.statusCode !== 200) return reject(`Status: ${response.statusCode} Response: ${JSON.stringify(body)}`);
    
                    this.usernameCache.set(userId, { username: body.Username, expires: new Date().getTime() + this.cacheExp * 1000 });

                    resolve(body.Username);
                });
            }
        });
    }

    public getGroupStatus(userId: number, groupId: number, bypassCache?: true): Promise<{ rank: number; role: string; }> {
        return new Promise((resolve, reject) => {
            let roleCacheResult = this.roleCache.get(userId);

            if(!bypassCache && (roleCacheResult && roleCacheResult.expires >= new Date().getTime())) {
                resolve({ role: roleCacheResult.role, rank: roleCacheResult.rank });
            } else {
                request({
                    url: `https://groups.roblox.com/v1/users/${userId}/groups/roles`,
                    json: true
                }, (err, response, body: RoleResponse) => {
                    if (err) return reject(err);
    
                    if(response.statusCode !== 200) return reject(`Status: ${response.statusCode} Response: ${JSON.stringify(body)}`);
    
                    const playerGroup = body.data.find(group => group.group.id === groupId);

                    let role = playerGroup ? playerGroup.role.name : 'Guest';
                    let rank = playerGroup ? playerGroup.role.rank : 0;

                    if(!bypassCache) this.roleCache.set(userId, { role, rank, expires: new Date().getTime() + this.cacheExp * 1000 });

                    resolve({ role, rank });
                });
            }
        });
    }

    public getHeadshot(userId: number): Promise<string> {
        return new Promise((resolve, reject) => {
            request({
                url: `https://www.roblox.com/headshot-thumbnail/json?userId=${userId}&width=48&height=48`,
                json: true
            }, (err, response, body: Headshot) => {
                if (err) return reject(err);

                if(response.statusCode !== 200) return reject(`Status: ${response.statusCode} Response: ${JSON.stringify(body)}`);

                resolve(body.Url);
            });
        })
    }

    public getRankHolders(groupId: number, rankId: number): Promise<User[]> {
        return new Promise((resolve, reject) => {
            request({
                // shouldnt ever be more than 100 users, we'll cross that road if we get to it
                url: `https://groups.roblox.com/v1/groups/${groupId}/roles/${rankId}/users?cursor=&limit=100`,
                json: true
            }, (err, response, body: RankHolderResponse) => {
                if (err) return reject(err);

                if(response.statusCode !== 200) return reject(`Status: ${response.statusCode} Response: ${JSON.stringify(body)}`);

                resolve(body.data);
            });
        });
    }

    public getUsersInGame(gameId: number): Promise<Player[]> {
        return new Promise((resolve, reject) => {
            request({
                url: `https://www.roblox.com/games/getgameinstancesjson?placeId=${gameId}&startIndex=0`,
                headers: {
                    Cookie: `.ROBLOSECURITY=${this.cookie}`
                },
                json: true
            }, (err, response, body: GetGameInstancesResponse) => {
                if (err) return reject(err);

                if(response.statusCode !== 200) return reject(`Status: ${response.statusCode} Response: ${JSON.stringify(body)}`);

                if(!body.Collection) return reject(`Malformed body: ${JSON.stringify(body)}`)

                let inGameUsers: Player[] = [];
                for (const collection of body.Collection) {
                    for (const player of collection.CurrentPlayers) {
                        inGameUsers.push(player);
                    }
                }

                resolve(inGameUsers);
            });
        });
    }
}

export default Roblox;