import React, { Component, Fragment } from 'react';
import axios from 'axios';
import { Container, Column, Progress, Button } from 'rbx';

import TrackerContext from '../context/TrackerContext';

import PromotionCard from '../components/PromotionCard';
import Message from '../components/Message';

interface Promotion {
	username: string;
	userId: number;
	oldRole: string;
	newRole: string;
	at: string;
}

interface State {
	promotions: Promotion[];
	error: boolean;
	loading: boolean;
}

class Promotions extends Component {
	state: Readonly<State> = {
		promotions: [],
		error: false,
		loading: true
	};

	static contextType = TrackerContext;

	componentDidMount() {
		this.loadPromotions();
	}

	loadPromotions = () => {
		this.setState({ loading: true });

		axios
			.get('/api/staff?type=promotions')
            .then((res) => {
				this.setState({ promotions: res.data, loading: false, error: false });
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
											any promotions. Try refreshing the page, if it still
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
												<Button color='danger' onClick={this.loadPromotions}>
													<strong>Reload Promotions</strong>
												</Button>
											</div>
										</Fragment>
									}
								/>
							) : this.state.promotions.length ? (
								<Fragment>
									<p>{this.state.promotions.length} Users Promoted</p>

									{this.state.promotions.map((p, index) => (
										<PromotionCard
											userId={p.userId}
											username={p.username}
											oldRole={p.oldRole}
											newRole={p.newRole}
											at={p.at}
											key={index}
										/>
									))}
								</Fragment>
							) : (
								<Message
									color='warning'
									header='No promotions'
									body={
										<Fragment>
											Looks like we haven't recorded any promotions yet. Check
											back in the future to see promotions.
											<div className='buttons' style={{ marginTop: '20px' }}>
												<Button
													color='warning'
													style={{ color: 'white' }}
													onClick={this.loadPromotions}
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

export default Promotions;
