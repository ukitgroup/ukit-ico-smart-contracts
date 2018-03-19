const Controller = artifacts.require('UKTTokenController')

module.exports = async (deployer, network, accounts) => {
	
	const { config : { controller } } = global
	
	return await deployer.deploy(
		Controller,
		controller.finalizeType,
		controller.finalizeTransferAddressType
	)
	
}
