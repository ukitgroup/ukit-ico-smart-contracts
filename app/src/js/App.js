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
import UKTTokenControllerStore from './UKTTokenController/store'

const stores = {
	UKTTokenController : UKTTokenControllerStore
}


class App extends Component {
	
	state = {
		isErrored : false,
		error     : null
	}
	
	async initializeStores (provider, account) {
		try {
			
			for (const c of Object.keys(contracts)) {
				contracts[c].setProvider(provider)
			}
			
			for (const s of Object.keys(stores)) {
				await stores[s].initialize(contracts, account)
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
