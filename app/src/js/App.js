import React, { Component, Fragment } from 'react'
import { Provider }        from 'mobx-react'
import { hot }             from 'react-hot-loader'

import { BounceLoader } from 'react-spinners'

import contract from 'truffle-contract'

import constants from 'Utils/constants.json'

import UKTTokenArtifacts              from 'Contracts/UKTToken.json'
import UKTTokenControllerArtifacts    from 'Contracts/UKTTokenController.json'
import UKTTokenVotingFactoryArtifacts from 'Contracts/UKTTokenVotingFactory.json'
import UKTTokenVotingArtifacts        from 'Contracts/UKTTokenVoting.json'

const UKTContracts = {
	UKTToken              : contract(UKTTokenArtifacts),
	UKTTokenController    : contract(UKTTokenControllerArtifacts),
	UKTTokenVotingFactory : contract(UKTTokenVotingFactoryArtifacts),
	UKTTokenVoting        : contract(UKTTokenVotingArtifacts)
}

import UKTTokenController      from './UKTTokenController'
import UKTTokenControllerStore from './UKTTokenController/store'

const AppLoader = ({ color = '#23d160', loading = false }) => (
	<div className="app-loader-container">
		<div className="app-loader-inner">
			<BounceLoader
				color={color}
				loading={loading}
			/>
		</div>
	</div>
)

const AppError = ({ error }) => <div className="modal is-active">
	<div className="modal-background"></div>
	<div className="modal-content">
		<div className="box">
			{ error }
			<p><a href="#" onClick={() => window.location.reload()}>Reload the page</a></p>
		</div>
	</div>
</div>

class App extends Component {
	
	state = {
		isErrored : false,
		error     : null,
		isLoaded  : false,
	}
	
	constructor () {
		super()
		
		this.stores = {}
	}
	
	async componentDidMount () {
		await this.prepareMetamask()
	}
	
	async prepareMetamask () {
		
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
			setTimeout(() => this.prepareMetamask(), 300)
			return
		}
		
		await this.prepareStores(selectedAccount)
		
	}
	
	async prepareStores (selectedAccount) {
		try {
			
			for (const c of Object.keys(UKTContracts)) {
				UKTContracts[c].setProvider(window.web3.currentProvider)
			}
			
			this.stores = {
				UKTTokenController : new UKTTokenControllerStore(UKTContracts, selectedAccount),
				// UKTTokenVotingFactoryStore : new UKTTokenVotingFactoryStore(contracts, selectedAccount),
				// UKTTokenVotingStore : new UKTTokenVotingStore(contracts, selectedAccount),
			}
			
			for (const s of Object.keys(this.stores)) {
				await this.stores[s].initialize()
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
		
		let render = <AppLoader loading={true} />
		
		if (this.state.isErrored) {
			
			render = <AppError error={this.state.error.message || this.state.error} />
			
		} else if (this.state.isLoaded) {
			
			render = <Provider {...this.stores}>
				<Fragment>
					<UKTTokenController />
				</Fragment>
			</Provider>
			
		}
		
		return render
	}
}

export default hot(module)(App)
