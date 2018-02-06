const debug = require('debug')('deploy')
const fs = require('fs-extra')

const Token = artifacts.require('UKTToken')
const Controller = artifacts.require('UKTTokenController')

module.exports = async (deployer, network, accounts) => {
	
	let config = {}
	
	try {
		config = require(`../config/deploy/${network}`)
	} catch (error) {
		console.error(error)
		process.exit(1)
	}
	
	const TokenInstance = await Token.deployed()
	const ControllerInstance = await Controller.deployed()
	
	debug("> Setting controller %s for TokenInstance...", ControllerInstance.address)
	await TokenInstance.setController(ControllerInstance.address)
	
	
	debug("> Setting token %s for ControllerInstance...", TokenInstance.address)
	await ControllerInstance.setToken(TokenInstance.address)
	
	const { token : tokenConfig } = config
	
	debug("> Setting configuration %O for token params...", {
		tokenName   : tokenConfig.name,
		tokenSymbol : tokenConfig.symbol,
		totalSupply : tokenConfig.totalSupply
	})
	await ControllerInstance.configureTokenParams(
		tokenConfig.name,
		tokenConfig.symbol,
		tokenConfig.totalSupply
	)
	
	const { allocations : allocationsConfig } = config
	
	// Allocating initial balances
	
	const allocationAddresses = allocationsConfig.map(
		a => a.address || Controller.address
	)
	const allocationAddressesTypes = allocationsConfig.map(
		a => a.name
	)
	const allocationAmounts = allocationsConfig.map(
		a => a.amount
	)
	
	debug("> Trying to allocate initial balances...")
	await ControllerInstance.allocateInitialBalances(
		allocationAddresses,
		allocationAddressesTypes,
		allocationAmounts
	)
	
	// Locking addresses
	
	const lockedAllocationAddresses = allocationsConfig.filter(
		a => a.lock && a.address !== Controller.address
	)
	
	for (const a of lockedAllocationAddresses) {
		debug("> Locking balance for address %s...", a.address)
		await ControllerInstance.lockAllocationAddress(a.address)
	}
	
	// Timelocking addresses
	
	const timelockedAllocationAddresses = allocationsConfig.filter(
		a => a.timelock && a.address !== Controller.address
	)
	
	for (const a of timelockedAllocationAddresses) {
		debug("> Timelocking balance for address %s till %d timestamp...", a.address, a.timelock)
		await ControllerInstance.timelockAllocationAddress(a.address, a.timelock)
	}
}
