const Token = artifacts.require('UKTToken')

module.exports = async (deployer, network, accounts) => {
	
	return await deployer.deploy(Token)
	
}
