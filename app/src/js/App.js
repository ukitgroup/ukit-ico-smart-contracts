import React, { Component, Fragment } from 'react'
import { Provider }        from 'mobx-react'
import { hot }             from 'react-hot-loader'

import contract from 'truffle-contract'

import constants from 'Utils/constants.json'

import UKTTokenArtifacts              from 'Contracts/UKTToken.json'
import UKTTokenControllerArtifacts    from 'Contracts/UKTTokenController.json'
import UKTTokenVotingFactoryArtifacts from 'Contracts/UKTTokenVotingFactory.json'
import UKTTokenVotingArtifacts        from 'Contracts/UKTTokenVoting.json'

const UKTTokenContract              = contract(UKTTokenArtifacts)
const UKTTokenControllerContract    = contract(UKTTokenControllerArtifacts)
const UKTTokenVotingFactoryContract = contract(UKTTokenVotingFactoryArtifacts)
const UKTTokenVotingContract        = contract(UKTTokenVotingArtifacts)

const contracts = {
	UKTTokenContract,
	UKTTokenControllerContract,
	UKTTokenVotingFactoryContract,
	UKTTokenVotingContract
}

for (const c of Object.keys(contracts)) {
	contracts[c].setProvider(web3.currentProvider)
}

import UKTTokenController      from './UKTTokenController'
import UKTTokenControllerStore from './UKTTokenController/store'

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
		error : null
	}
	
	constructor () {
		super()
		
		this.stores = {
			UKTTokenControllerStore : new UKTTokenControllerStore(contracts)
		}
	}
	
	async componentDidMount () {
		await this.checkSelectedAccount()
	}
	
	async checkSelectedAccount () {
		try {
			const selectedAccount = await new Promise((resolve, reject) => {
				web3.eth.getAccounts((error, result) => {
					if (error) {
						reject(error); return
					}
					
					resolve(result[0])
				})
			})
			
			if (selectedAccount == constants.owner.address) {
				this.setState({ error : null })
				await this.initializeStores()
			} else {
				if ( ! this.state.error) {
					this.setState({
						error : new Error('Metamask\'s selected account is not the same as contracts owner!')
					})
				}
				
				setTimeout(async () => await this.checkSelectedAccount(), 100)
			}
		} catch (error) {
			console.error(error)
			this.setState({ error })
		}
	}
	
	async initializeStores () {
		try {
			for (const s of Object.keys(this.stores)) {
				await this.stores[s].initialize()
			}
		} catch (error) {
			console.error(error)
			this.setState({ error })
		}
	}
	
	render () {
		
		return (
			this.state.error ? 
			<AppError error={this.state.error.message || this.state.error} /> :
			<Provider {...this.stores}>
				<Fragment>
					<UKTTokenController />
				</Fragment>
			</Provider>
	)
	}
}

export default hot(module)(App)
