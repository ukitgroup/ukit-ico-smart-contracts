import React, { Component, Fragment } from 'react'
import { Provider } from 'mobx-react'
import { hot } from 'react-hot-loader'
import MetamaskChecker from 'react-metamask-checker'

import contract from 'truffle-contract'

import AppLoader from 'AppLoader'
import AppError from 'AppError'

import constants from 'Utils/constants.json'


import UKTTokenArtifacts from 'Contracts/UKTToken.json'
import UKTTokenControllerArtifacts from 'Contracts/UKTTokenController.json'
import UKTTokenVotingFactoryArtifacts from 'Contracts/UKTTokenVotingFactory.json'
import UKTTokenVotingArtifacts from 'Contracts/UKTTokenVoting.json'

const contracts = {
	UKTToken              : contract(UKTTokenArtifacts),
	UKTTokenController    : contract(UKTTokenControllerArtifacts),
	UKTTokenVotingFactory : contract(UKTTokenVotingFactoryArtifacts),
	UKTTokenVoting        : contract(UKTTokenVotingArtifacts)
}


import UKTTokenController from './UKTTokenController'
import UKTTokenControllerStore from './stores/UKTTokenController'

const stores = {
	UKTTokenController : UKTTokenControllerStore
}


class App extends Component {
	
	state = {
		isErrored : false,
		error     : null
	}
	
	constructor (props) {
		super(props)
		
		this.stores = {}
	}
	
	async initializeStores (provider, account) {
		try {
			
			for (const s of Object.keys(stores)) {
				this.stores[s] = new stores[s](provider, account)
				await this.stores[s].initialize(contracts)
			}
			
		} catch (error) {
			console.error(error)
			this.setState({
				isErrored : true,
				error
			})
		}
	}
	
	render () {
		
		if (this.state.isErrored) {
			return <AppError error={this.state.error.message || this.state.error} />
		}
		
		const { stores } = this
		
		const props = {
			account : constants.owner.address,
			network : 5777,
			
			onCheckSuccess : async (provider, account) => await this.initializeStores(provider, account),
			
			renderDefault : () => <AppLoader />,
			renderErrored : error => <AppError error={error.message || error} />,
			renderChecked : (provider, account) => (
				<Provider {...stores}>
					<UKTTokenController />
				</Provider>
			)
		}
		
		return <MetamaskChecker {...props} />
	}
}

export default hot(module)(App)
