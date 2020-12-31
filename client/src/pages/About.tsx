import React, { Fragment, useContext } from 'react';
import Timeago from 'react-timeago';
import { Container, Column, Title, Content } from 'rbx';
import { version as clientVersion } from '../../package.json';
import updateLog from '../updateLog';
import { lastUpdated } from '../requirements';

import TrackerContext from '../context/TrackerContext';

const About = () => {
	const trackerState = useContext(TrackerContext);

	return (
		<Container>
			<Column.Group className='is-mobile-columns'>
				<Column size={8}>
					<Title size={1}>Soro's Tracker</Title>
					<Title
						size={5}
						subtitle
						style={{ marginBottom: '0.25rem', marginTop: 5 }}
					>
						Client Version v{clientVersion}
					</Title>
					<Title size={5} subtitle>
						Server Version {trackerState.serverVersion}
					</Title>
					<Title size={5} subtitle spaced>
						Activity Requirements Last Updated <Timeago date={lastUpdated} />
					</Title>
					<Title size={6} subtitle>
						Developed by {trackerState.ownerTag}
					</Title>
					<Content>
						<p>
							<i>
								By using this site, your IP and some other information about
								your request will be recorded in a log file. None of this data
								can be used to personally identify you, it is only stored for
								security-related reasons.
							</i>
						</p>
					</Content>
					
					<Title size={4} style={{ marginBottom: 10 }}>
						How often is data updated?
					</Title>
					<Content>
						<ul>
							<li>
								Roblox is checked every {trackerState.activityPollInterval}{' '}
								seconds to see which users are in-game, who resigned, and who
								was promoted
							</li>
							<li>
								Discord roles are updated every{' '}
								{typeof trackerState.discordRoleCheckInterval === 'string'
									? trackerState.discordRoleCheckInterval
									: parseInt(
											trackerState.discordRoleCheckInterval
									  ) / 60}{' '}
								minutes
							</li>
						</ul>
					</Content>
					<Title size={4} style={{ marginBottom: 10 }}>
						Where'd The Logs Go?
					</Title>
					<Content>
						<p>
							Accidentally deleted the database (yeah I already knew it was
							coming, just a matter of time until I accidentally deleted it){' '}
							<br /> All activity has been reset, from now on the database is
							backed up once per 30 minutes to prevent an incident like this
							from happening again.
						</p>
					</Content>
					<Title size={4}>Update Log</Title>
					<Content>
						{updateLog.map((logInfo, index) => (
							<Fragment key={index}>
								<Title size={6}>v{logInfo.version}</Title>

								<ul>
									{logInfo.logs.map((log, index) => (
										<li key={index}>{log}</li>
									))}
								</ul>
							</Fragment>
						))}
					</Content>
				</Column>
			</Column.Group>
		</Container>
	);
};

export default About;
