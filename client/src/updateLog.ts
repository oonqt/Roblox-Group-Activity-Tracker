interface Update {
    version: string;
    logs: string[];
}

const updateLog: Update[] = [
	{
		version: '1.7.0',
		logs: [
			'Fixed discoprd roles not updating when a member is missing',
        	'Display resigned users in activity',
			'Real-time updates for minute count, users joining/leaving games, etc. (Updated according to the intervals shown above)',
			'Some small tings',
			'Stop cloudgay from terminating the realtime/websocket connections after 100 seconds',
			'Base tracking timezone on Europe/London to get the most accurate results'
		]
	},
	{
		version: '1.6.0',
		logs: [
			'Include worker of the month and worker of the week roles for users',
			'Rollover activity on saturday rather than monday',
			'Fixed week picker not working on certain browsers and devices'
		]
	},
	{
		version: '1.5.8',
		logs: [
			'Don\'t allow users to select weeks outside of the recorded range of weeks',
			'Improved search accuracy',
			'Significantly improved load times'
		]
	},
	{
		version: '1.5.7',
		logs: [
			'Allow searching users by minutes (minutes rounded, so searching for 70 minutes would return people wigh 71 minutes, 73 minutes, etc)',
			'Added details to about page'
		]
	},
	{
		version: '1.5.6',
		logs: [
			"Stop all users being returned for search results that don't return any users",
			'Add inactivity/leave of absence detection'
		]
	},
	{
		version: '1.4.5',
		logs: [
			'If the user has an activity requirement, display the amount of minutes needed to reach that requirement',
			'Added user counts on list pages'
		]
	},
	{
		version: '1.3.5',
		logs: [
			'Updated activity reqs for mods again (FUCK)',
			'Track promotions given to low ranks (vc -> mod) (HC -> SL)',
			'Switch to preact and implement compression on the serverside to improve page load times'
		]
	},
	{
		version: '1.3.2',
		logs: [
			'Updated activity requirements for all ranks',
			'Added promotion tracker',
			'Sort by rank before sorting by amount of minutes (Accounts for if a user gets unsuspended and are added to the activity list out of order)'
		]
	},
	{
		version: '1.2.2',
		logs: ['Minor changes and improvements to usability', 'Updated about page']
	},
	{
		version: '1.2.0',
		logs: [
			'Added resignation tracker',
			'Updated requirements (Should be mostly correct, need to get confirmation)',
			'Some styling fixes'
		]
	},
	{
		version: '1.1.0',
		logs: [
			'Improved search feature! Increased speed, search by rank',
			'Added about page!',
			"Don't return activity for users who have resigned and are no longer a SL+"
		]
	},
	{
		version: '1.0.0',
		logs: [
			'First Release! Report any bugs or feature requests to the Discord server'
		]
	}
];

export default updateLog;
