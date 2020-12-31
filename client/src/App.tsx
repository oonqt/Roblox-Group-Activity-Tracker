import React, { Component } from 'react';
import axios from 'axios';
import { BrowserRouter as Router, Switch, Route } from 'react-router-dom';
import './App.css';

import { TrackerProvider, TrackerState } from './context/TrackerContext';

import Footer from './components/Footer';
import Header from './components/Header';

import Tracker from './pages/Tracker';
import Resignations from './pages/Resignations';
import About from './pages/About';
import Promotions from './pages/Promotions';

interface State {
	serverInfo: TrackerState
}

class App extends Component {
	state: Readonly<State> = {
		serverInfo: {
			serverVersion: 'Loading...',
			ownerTag: 'Loading...',
			discordInvite: 'https://discord.gg/',
			activityPollInterval: 'Loading...',
			userCacheExpire: 'Loading...',
			discordRoleCheckInterval: 'Loading...'
		}
	};
	componentDidMount() {
		axios('/api/info')
			.then((res) => {
				this.setState({ serverInfo: res.data });
			})
			.catch((err) => {
				console.error(err);
			});
	}

	render() {
		return (
			<TrackerProvider value={this.state.serverInfo}>
				<Router>
					<Header />
					<Switch>
						<Route path='/about'>
							<About />
						</Route>
						<Route path='/resignations'>
							<Resignations />
						</Route>
						<Route path='/promotions'>
							<Promotions />
						</Route>
						<Route path='/'>
							<Tracker />
						</Route>
					</Switch>
					<Footer />
				</Router>
			</TrackerProvider>
		);
	}
}

export default App;
