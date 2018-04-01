import React, { Component, Fragment } from 'react'
import { inject, observer } from 'mobx-react'

@observer
class TokenHolder extends Component {
	render () {
		
		const { idx, address, avBalance, acBalance} = this.props
		
		return (
			<tr className='js-token-holder'>
				<th>{idx + 1}</th>
				<td>{address}</td>
				<td>{avBalance} UKT</td>
				<td>{acBalance} UKT</td>
				<td>
					<button
						className='button is-primary js-token-holder-distribute'
						disabled={ ! avBalance}
					>
						Distribute
					</button>
				</td>
			</tr>
		)
	}
}

@inject('UKTTokenControllerStore')
@observer
class ControllerStat extends Component {
	render () {
		
		const { totalSupply, icoAllocation } = this.props.UKTTokenControllerStore
		
		return (
			<nav className='level'>
				<div className='level-item has-text-centered'>
					<div>
						<p className='heading'>Total Supply</p>
						<p className='title'><span>{totalSupply}</span> UKT</p>
					</div>
				</div>
				<div className='level-item has-text-centered'>
					<div>
						<p className='heading'>ICO Allocation</p>
						<p className='title'><span>{icoAllocation}</span> UKT</p>
					</div>
				</div>
			</nav>
		)
	}
}

@inject('UKTTokenControllerStore')
@observer
export default class UKTTokenController extends Component {
	render () {
		
		const { holders } = this.props.UKTTokenControllerStore
		
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
									(holder, idx) => <TokenHolder key={holder.address} {...{ idx, ...holder }} />
								)
							}
						</tbody>
						<tfoot>
							<tr>
								<th colSpan='5'>
									<div className='field is-grouped'>
										<div className='control'>
											<button className='button is-success'>Distribute All</button>
										</div>
										<div className='control'>
											<button className='button is-danger'>Finalize ICO</button>
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
