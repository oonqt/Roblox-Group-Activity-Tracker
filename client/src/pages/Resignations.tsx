import React, { Component, Fragment } from 'react';
import axios from 'axios';
import { Container, Column, Progress, Button } from 'rbx';

import TrackerContext from '../context/TrackerContext';

import ResignationCard from '../components/ResignationCard';
import Message from '../components/Message';

interface Resignation {
	username: string;
	userId: number;
	oldRole: string;
	at: string;
}

interface State {
	resignations: Resignation[];
	error: boolean;
	loading: boolean;
}

class Resignations extends Component {
	state: Readonly<State> = {
		resignations: [],
		error: false,
		loading: true
	};

	static contextType = TrackerContext;

	componentDidMount() {
		this.loadResignations();
	}

	loadResignations = () => {
		this.setState({ loading: true });

		axios
			.get('/api/staff?type=resignations')
			.then((res) => {
				this.setState({ resignations: res.data, loading: false, error: false });
			})
			.catch((err) => {
				this.setState({ error: true, loading: false });
				console.error(err);
			});
	};

	render() {
		return (
			<main>
				<Container>
					<Column.Group centered>
						<Column size='four-fifths'>
							{this.state.loading ? (
								<Progress size='small' color='link'></Progress>
							) : this.state.error ? (
								<Message
									color='danger'
									header='Error'
									body={
										<Fragment>
											Something unexpected happened and we were unable to fetch
											any resignations. Try refreshing the page, if it still
											doesn't work, join the{' '}
											<a
												href={this.context.discordInvite}
												target='_blank'
												rel='noreferrer'
											>
												Discord server
											</a>{' '}
											to report it
											<div className='buttons' style={{ marginTop: '20px' }}>
												<Button color='danger' onClick={this.loadResignations}>
													<strong>Reload Resignations</strong>
												</Button>
											</div>
										</Fragment>
									}
								/>
							) : this.state.resignations.length ? (
								<Fragment>
									<p>{this.state.resignations.length} Users Resigned/Terminated</p>

									{this.state.resignations.map((r, index) => (
										<ResignationCard
											username={r.username}
											userId={r.userId}
											at={r.at}
											role={r.oldRole}
											key={index}
										/>
									))}
								</Fragment>
							) : (
								<Message
									color='warning'
									header='No resignations'
									body={
										<Fragment>
											Looks like we haven't recorded any resignations yet. Check
											back in the future to see resignations.
											<div className='buttons' style={{ marginTop: '20px' }}>
												<Button
													color='warning'
													style={{ color: 'white' }}
													onClick={this.loadResignations}
												>
													<strong>Check Again</strong>
												</Button>
											</div>
										</Fragment>
									}
								/>
							)}
						</Column>
					</Column.Group>
				</Container>
			</main>
		);
	}
}

export default Resignations;
