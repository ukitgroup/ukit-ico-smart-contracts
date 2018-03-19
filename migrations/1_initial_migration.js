const Migrations = artifacts.require('./Migrations.sol')

module.exports = async (deployer, network, accounts) => {
	
	try {
		global.config = require(`../config/deploy`)(network)
	} catch (error) {
		console.error(error)
		process.exit(1)
	}
	
	return await deployer.deploy(Migrations)
	
}
