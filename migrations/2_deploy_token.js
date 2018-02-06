const Token = artifacts.require('UKTToken')

module.exports = async deployer => {
	
	return await deployer.deploy(Token)
	
}
