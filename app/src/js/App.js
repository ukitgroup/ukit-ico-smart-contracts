import React, { Component, Fragment } from 'react'
import { Provider } from 'mobx-react'
import { hot } from 'react-hot-loader'

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
		error     : null,
		isLoaded  : false,
	}
	
	async componentDidMount () {
		await this.initializeMetamask()
	}
	
	async initializeMetamask () {
		
		if (typeof window.web3 === 'undefined') {
			this.setState({
				isErrored : true,
				error     : new Error('Can\'t find Metamask\'s web3 provider!')
			})
			return
		}
		
		const selectedNetwork = await new Promise((resolve, reject) => {
			window.web3.version.getNetwork((error, result) => {
				if (error) return reject(error)
				resolve(result)
			})
		})
		
		const selectedAccount = await new Promise((resolve, reject) => {
			window.web3.eth.getAccounts((error, result) => {
				if (error) return reject(error)
				resolve(result[0])
			})
		})
		
		let error = null
		
		if (selectedNetwork != 5777) {
			error = new Error('Metamask\'s selected network is not the same as contracts were deployed!')
		} else if (selectedAccount !== constants.owner.address) {
			error = new Error('Metamask\'s selected account is not the same as contracts owner!')
		}
		
		if (error) {
			console.error(error)
			this.setState({
				isErrored : true,
				error
			})
			setTimeout(() => this.initializeMetamask(), 300)
			return
		}
		
		await this.initializeStores(selectedAccount)
		
	}
	
	async initializeStores (selectedAccount) {
		try {
			
			for (const c of Object.keys(contracts)) {
				contracts[c].setProvider(window.web3.currentProvider)
			}
			
			for (const s of Object.keys(stores)) {
				await stores[s].initialize(contracts, selectedAccount)
			}
			
			this.setState({
				isErrored : false,
				error     : null,
				isLoaded  : true
			})
			
		} catch (error) {
			console.error(error)
			this.setState({
				isErrored : true,
				error
			})
		}
	}
	
	render () {
		
		let render = <AppLoader />
		
		if (this.state.isErrored) {
			
			render = <AppError error={this.state.error.message || this.state.error} />
			
		} else if (this.state.isLoaded) {
			
			render = <Provider {...stores}>
				<UKTTokenController />
			</Provider>
			
		}
		
		return render
	}
}

export default hot(module)(App)
