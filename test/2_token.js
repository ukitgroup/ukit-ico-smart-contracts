const constants = require('../utils/constants.json')
const increaseTime = require('../utils/increaseTime.js')
const withDecimals = require('../utils/withDecimals.js')

const {
	token       : tokenConfig,
	allocations : allocationsConfig
} = require('../config/deploy/development.js')

const Token = artifacts.require('UKTToken')
const Controller = artifacts.require('UKTTokenController')

describe('UKTToken', addresses => {
	
	let TokenContract
	let ControllerContract
	
	before(async () => {
		TokenContract = await Token.deployed()
		ControllerContract = await Controller.deployed()
	})
	
	beforeEach(async () => {
		await new Promise(resolve => setTimeout(resolve, 100))
	})
	
	it('Should be controlled', async () => {
		
		const isControlled = await TokenContract.isControlled.call()
		const controllerAddress = await TokenContract.controller.call()
		
		assert.equal(isControlled, true, 'Controller was not set')
		assert.equal(controllerAddress, ControllerContract.address, 'Controller do not match')
	})
	
	it('Should have params', async () => {
		
		const isConfigured = await TokenContract.isConfigured.call()
		assert.equal(isConfigured, true, 'Configuration was not set')
		
		
		const name = await TokenContract.name.call()
		const symbol = await TokenContract.symbol.call()
		const decimals = await TokenContract.decimals.call()
		const totalSupply = await TokenContract.totalSupply.call()
		
		assert.equal(name, tokenConfig.name, 'Name do not match')
		assert.equal(symbol, tokenConfig.symbol, 'Symbol do not match')
		assert.equal(decimals, tokenConfig.decimals, 'Decimals do not match')
		assert.equal(totalSupply.toNumber(), withDecimals(tokenConfig.totalSupply, tokenConfig.decimals), 'Total supply do not match')
	})
	
	it('Should have allocations', async () => {
		
		const isAllocated = await TokenContract.isAllocated.call()
		assert.equal(isAllocated, true, 'Allocation was not set')
		
		const controllerAddress = await TokenContract.controller.call()
		const totalSupply = await TokenContract.totalSupply.call()
		
		let balancesSupply = 0
		for (const a of allocationsConfig) {
			
			const addressFromContract = web3.toChecksumAddress(
				await TokenContract.allocationAddressesTypes.call(a.name)
			)
			const addressFromConfig = web3.toChecksumAddress(
				a.address || controllerAddress
			)
			assert.equal(addressFromContract, addressFromConfig, `Allocation address type do not match for ${a.name}`)
			
			const balanceFromContract = await TokenContract.balanceOf.call(a.address || controllerAddress)
			const balanceFromConfig = withDecimals(a.amount, tokenConfig.decimals)
			assert.equal(balanceFromContract.toNumber(), balanceFromConfig, `Allocation address balance do not match for ${a.name}`)
			
			balancesSupply += balanceFromContract.toNumber()
		}
		
		assert.equal(balancesSupply, totalSupply.toNumber(), 'Allocated supply do not match')
	})
	
	it('Should be locked', async () => {
		
		for (const a of allocationsConfig) {
			if (a.lock) {
				const isLockedAddress = await TokenContract.lockedAddresses.call(a.address)
				assert.equal(isLockedAddress, true, 'Locked address is not locked')
			}
		}
		
	})
	
	it('Should be timelocked', async () => {
		
		for (const a of allocationsConfig) {
			if (a.timelock) {
				const lockedTillDate = await TokenContract.timelockedAddresses.call(a.address)
				assert.equal(lockedTillDate.toNumber(), a.timelock, 'Time locked till date do not match')
			}
		}
		
	})
	
	it('Should not be able to transfer from locked address', async () => {
		
		const lockedAddress = allocationsConfig.find(a => a.lock).address
		
		try {
			
			const tx = await TokenContract.transfer(
				'0x1111111111111111111111111111111111111111',
				withDecimals(10000, tokenConfig.decimals),
				{
					from : lockedAddress
				}
			)
			
			throw new Error('Owner of locked address should not be able to transfer tokens')
			
		} catch (error) {
			assert.equal(error.message, 'VM Exception while processing transaction: revert')
		}
		
	})
	
	it('Should be able to transfer from unlocked address', async () => {
		
		const lockedAddress = allocationsConfig.find(a => a.lock).address
		const toAddress = '0x1111111111111111111111111111111111111111'
		const amount = withDecimals(10000, tokenConfig.decimals)
		
		await ControllerContract.unlockAllocationAddress(lockedAddress, { from : constants.owner.address })
		
		await TokenContract.transfer(toAddress, amount, {from : lockedAddress })
		
		const balance = await TokenContract.balanceOf.call(toAddress)
		
		assert.equal(balance.toNumber(), amount, 'Balance of toAddress do not match')
	})
	
	it('Should not be able to transfer from timelocked address', async () => {
		
		const timelockedAddress = allocationsConfig.find(a => a.timelock).address
		
		try {
			
			const tx = await TokenContract.transfer(
				'0x2222222222222222222222222222222222222222',
				withDecimals(10000, tokenConfig.decimals),
				{
					from : timelockedAddress
				}
			)
			
			throw new Error('Owner of time locked address should not be able to transfer tokens')
			
		} catch (error) {
			assert.equal(error.message, 'VM Exception while processing transaction: revert')
		}
		
	})
	
	it('Should be able to transfer from timeunlocked address', async () => {
		
		const timelockedTillDate = allocationsConfig.find(a => a.timelock).timelock
		
		increaseTime(timelockedTillDate - Math.floor(Date.now() / 1000))
		
		const timelockedAddress = allocationsConfig.find(a => a.timelock).address
		const toAddress = '0x2222222222222222222222222222222222222222'
		const amount = withDecimals(10000, tokenConfig.decimals)
		
		await TokenContract.transfer(toAddress, amount, {from : timelockedAddress })
		
		const balance = await TokenContract.balanceOf.call(toAddress)
		
		assert.equal(balance.toNumber(), amount, 'Balance of toAddress do not match')
		
	})
	
	it('Should not be able to transfer tokens to contract address without tokenFallback() method', async () => {
		
		try {
			
			const tx = await TokenContract.transfer(
				ControllerContract.address,
				withDecimals(10000, tokenConfig.decimals),
				{
					from : allocationsConfig.find(a => a.lock).address
				}
			)
			
			throw new Error('It should be not possible to transfer tokens to contract address without tokenFallback() method')
			
		} catch (error) {
			assert.equal(error.message, 'VM Exception while processing transaction: revert')
		}
		
	})
	
})
