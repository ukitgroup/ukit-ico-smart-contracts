const constants    = require('../utils/constants.json')
const withDecimals = require('../utils/withDecimals.js')

const {
	token       : tokenConfig,
	controller  : controllerConfig,
	allocations : allocationsConfig
} = require('../config/deploy/development.js')

const Token = artifacts.require('UKTToken')
const Controller = artifacts.require('UKTTokenController')

describe('UKTTokenController', addresses => {
	
	let TokenContract
	let ControllerContract
	
	before(async () => {
		TokenContract = await Token.deployed()
		ControllerContract = await Controller.deployed()
	})
	
	beforeEach(async () => {
		await require('nanodelay')(100)
	})
	
	it('Should distribute amounts to investors', async () => {
		
		const icoAllocation = withDecimals(
			allocationsConfig.find(a => a.name === 'ico').amount,
			tokenConfig.decimals
		)
		
		const contrBalanceInitial =  await TokenContract.balanceOf.call(await TokenContract.controller.call())
		assert.equal(
			contrBalanceInitial.toNumber(),
			icoAllocation,
			'Initial controller balance do not match'
		)
		
		const investorsAddresses = [
			constants.investor1.address,
			constants.investor2.address,
			constants.investor3.address,
			constants.investor4.address
		]
		const investorsAmounts = investorsAddresses.map(
			(a, i) => withDecimals(10000 * (i + 1), tokenConfig.decimals)
		)
		const investorsTrackingIds = investorsAddresses.map(
			a => web3.sha3(a)
		)
		const investorsAmountsTotal = investorsAmounts.reduce(
			(total, a) => total + a,
			0
		)
		
		await ControllerContract.distribute(
			investorsAddresses,
			investorsAmounts,
			investorsTrackingIds,
			{ from : constants.owner.address }
		)
		
		for (const i in investorsAddresses) {
			
			const investorBalance = await TokenContract.balanceOf.call(investorsAddresses[i])
			assert.equal(
				investorBalance.toNumber(),
				investorsAmounts[i],
				'Investor balance do not match'
			)
			
			const distributedEvent = await new Promise(resolve => {
				ControllerContract.Distributed({
					owner      : investorsAddresses[i],
					trackingId : investorsTrackingIds[i]
				}, {
					fromBlock : 0,
					toBlock   : 'latest'
				}).get((error, result) => resolve(error || result[0]))
			})
			assert.isObject(distributedEvent, 'Distributed event is not an object')
			assert.equal(
				distributedEvent.args.amount.toNumber(),
				investorsAmounts[i],
				'Amount from Distributed event do not match'
			)
		}
		
		const contrBalanceRest = await TokenContract.balanceOf.call(ControllerContract.address)
		assert.equal(
			contrBalanceRest.toNumber(),
			icoAllocation - investorsAmountsTotal,
			'Rest controller balance do not match'
		)
	})
	
	it('Should be finalizable', async () => {
		
		const icoAllocationBefore = await TokenContract.balanceOf.call(ControllerContract.address)
		await ControllerContract.finalize({ from : constants.owner.address })
		const icoAllocationAfter = await TokenContract.balanceOf.call(ControllerContract.address)
		
		assert.equal(icoAllocationAfter.toNumber(), 0, 'ICO allocation balance after do not match')
		
		if (controllerConfig.finalizeType === 'transfer') {
			
			const finalizeTransferAllocation = allocationsConfig.find(
				a => a.name === controllerConfig.finalizeTransferAddressType
			)
			const finalizeTransferAllocationBefore = finalizeTransferAllocation.amount
			const finalizeTransferAllocationAfter = await TokenContract.balanceOf.call(
				finalizeTransferAllocation.address
			)
			
			assert.equal(
				finalizeTransferAllocationAfter.toNumber(),
				icoAllocationBefore.add(
					withDecimals(finalizeTransferAllocationBefore, tokenConfig.decimals)
				).toNumber(),
				'Reserve allocation balance after do not match'
			)
			
		}
		
		const lockedAddresses = allocationsConfig.filter(a => a.lock).map(a => a.address)
		
		for(const a of lockedAddresses) {
			const isLockedAddress = await TokenContract.lockedAddresses.call(a)
			assert.equal(isLockedAddress, false, 'Locked address do not match')
		}
	})
	
})
