import React, { Component, Fragment } from 'react'
import { inject, observer } from 'mobx-react'

import NumberFormat from 'react-number-format'


const FormattedTokensValue = ({ value }) => <NumberFormat
	value={value}
	suffix=" UKT"
	displayType={'text'}
	thousandSeparator={true}
/>


@inject('UKTTokenController')
@observer
class ControllerStat extends Component {
	render () {
		
		const { totalSupply, icoAllocation } = this.props.UKTTokenController
		
		const totalSupplyFormatted = <FormattedTokensValue
			value={totalSupply}
		/>
		const icoAllocationFormatted = <FormattedTokensValue
			value={icoAllocation}
		/>
		
		return (
			<nav className='level'>
				<div className='level-item has-text-centered'>
					<div>
						<p className='heading'>Total Supply</p>
						<p className='title'>{totalSupplyFormatted}</p>
					</div>
				</div>
				<div className='level-item has-text-centered'>
					<div>
						<p className='heading'>ICO Allocation</p>
						<p className='title'>{icoAllocationFormatted}</p>
					</div>
				</div>
			</nav>
		)
	}
}


@inject('UKTTokenController')
@observer
class TokenHolder extends Component {
	
	async distributeTokens (idx) {
		await this.props.UKTTokenController.holders[idx].distributeTokens()
	}
	
	render () {
		
		const { idx, disabled } = this.props
		
		const {
			address,
			avBalance,
			acBalance,
			isDistributing,
			isDistributed
		} = this.props.UKTTokenController.holders[idx]
		
		const avBalanceFormatted = <FormattedTokensValue
			value={avBalance}
		/>
		const acBalanceFormatted = <FormattedTokensValue
			value={acBalance}
		/>
		
		return (
			<tr className='js-token-holder'>
				<th>{idx + 1}</th>
				<td>{address}</td>
				<td>{avBalanceFormatted}</td>
				<td>{acBalanceFormatted}</td>
				<td>
					<button
						className={`button is-primary ${isDistributing && 'is-loading'}`}
						onClick={this.distributeTokens.bind(this, idx)}
						disabled={disabled || isDistributed}
					>
						Distribute
					</button>
				</td>
			</tr>
		)
	}
}


@inject('UKTTokenController')
@observer
export default class UKTTokenController extends Component {
	
	async distributeTokens () {
		await this.props.UKTTokenController.distributeTokens()
	}
	
	async finalizeTokensDistribution () {
		await this.props.UKTTokenController.finalizeTokensDistribution()
	}
	
	render () {
		
		const {
			holders,
			isFinalizing,
			isFinalized,
			isDistributing,
			isDistributed
		} = this.props.UKTTokenController
		
		return (
			<section className='section'>
				<div className='container'>
					<h2 className='subtitle'>
						<strong>UKTTokenController</strong> - distribution of tokens and ICO finalization
					</h2>
				
					<ControllerStat />
					
					<table className='table is-fullwidth'>
						<thead>
							<tr>
								<th></th>
								<th>Holder address</th>
								<th>Available balance</th>
								<th>Actual balance</th>
								<th></th>
							</tr>
						</thead>
						<tbody>
							{
								holders.map(
									(holder, idx) => <TokenHolder
										key={`holder_${idx}`}
										idx={idx}
										disabled={
											isDistributing ||
											isDistributed ||
											isFinalizing ||
											isFinalized
										}
									/>
								)
							}
						</tbody>
						<tfoot>
							<tr>
								<th colSpan='5'>
									<div className='field is-grouped'>
										<div className='control'>
											<button
												className={`button is-success ${isDistributing && 'is-loading'}`}
												onClick={::this.distributeTokens}
												disabled={isDistributed || isFinalizing || isFinalized}
											>Distribute All</button>
										</div>
										<div className='control'>
											<button
												className={`button is-danger ${isFinalizing && 'is-loading'}`}
												onClick={::this.finalizeTokensDistribution}
												disabled={isFinalized || isDistributing}
											>Finalize ICO</button>
										</div>
									</div>
								</th>
							</tr>
						</tfoot>
					</table>
				</div>
			</section>
		)
	}
}
