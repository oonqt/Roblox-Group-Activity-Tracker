import { createContext } from 'react';

// i dont even really know how context works, should probably learn more about it so i can do it the right way...
const initialState = {
	ownerTag: 'Loading...',
	serverVersion: 'Loading...',
	discordInvite: 'https://discord.gg/invite',
	activityPollInterval: 'Loading...',
	userCacheExpire: 'Loading...',
	discordRoleCheckInterval: 'Loading...'
};

export type TrackerState = typeof initialState;

const TrackerContext = createContext<TrackerState>(initialState);

export const TrackerProvider = TrackerContext.Provider;
export const TrackerConsumer = TrackerContext.Consumer;

export default TrackerContext;