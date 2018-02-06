const Controller = artifacts.require('UKTTokenController')

module.exports = async deployer => {
	
	return await deployer.deploy(Controller)
	
}
