const constants = require('../utils/constants.json')
const withDecimals = require('../utils/withDecimals.js')

const {
	token       : tokenConfig,
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
		await new Promise(resolve => setTimeout(resolve, 100))
	})
	
	it('Should distribute amounts to investors', async () => {
		
		const investorsAddresses = [
			constants.investor1.address,
			constants.investor2.address,
			constants.investor3.address,
			constants.investor4.address
		]
		const investorsAmounts = investorsAddresses.map(
			(a, i) => 10000 * (i + 1)
		)
		const investorsAmountsTotal = investorsAmounts.reduce(
			(total, a) => total + a,
			0
		)
		
		const icoAllocation = allocationsConfig.find(a => a.name === 'ico').amount
		
		const contrBalanceInitial =  await TokenContract.balanceOf.call(await TokenContract.controller.call())
		assert.equal(
			contrBalanceInitial.toNumber(),
			withDecimals(icoAllocation, tokenConfig.decimals),
			'Initial controller balance do not match'
		)
		
		const tx = await ControllerContract.distribute(investorsAddresses, investorsAmounts, {
			from : constants.owner.address
		})
		
		for (const i in investorsAddresses) {
			
			const investorBalance = await TokenContract.balanceOf.call(investorsAddresses[i])
			assert.equal(
				investorBalance.toNumber(),
				withDecimals(investorsAmounts[i], tokenConfig.decimals),
				'Investor balance do not match'
			)
		}
		
		const contrBalanceRest = await TokenContract.balanceOf.call(ControllerContract.address)
		assert.equal(
			contrBalanceRest.toNumber(),
			withDecimals(icoAllocation - investorsAmountsTotal, tokenConfig.decimals),
			'Rest controller balance do not match'
		)
	})
	
	it('Should be finalizable', async () => {
		
		const icoAllocationBefore = await TokenContract.balanceOf.call(ControllerContract.address)
		await ControllerContract.finalize({ from : constants.owner.address })
		const icoAllocationAfter = await TokenContract.balanceOf.call(ControllerContract.address)
		
		assert.equal(icoAllocationAfter.toNumber(), 0, 'ICO allocation balance after do not match')
		
		const reserveAllocation = allocationsConfig.find(a => a.name === 'reserve')
		const reserveAllocationBefore = reserveAllocation.amount
		const reserveAllocationAfter = await TokenContract.balanceOf.call(reserveAllocation.address)
		
		assert.equal(
			reserveAllocationAfter.toNumber(),
			icoAllocationBefore.add(
				withDecimals(reserveAllocationBefore, tokenConfig.decimals)
			).toNumber(),
			'Reserve allocation balance after do not match'
		)
		
		const lockedAddresses = allocationsConfig.filter(a => a.lock).map(a => a.address)
		
		for(const a of lockedAddresses) {
			const isLockedAddress = await TokenContract.lockedAddresses.call(a)
			assert.equal(isLockedAddress, false, 'Locked address do not match')
		}
	})
	
})
