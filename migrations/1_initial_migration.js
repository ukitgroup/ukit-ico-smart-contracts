const Migrations = artifacts.require('./Migrations.sol')

module.exports = async deployer => {
	
	return await deployer.deploy(Migrations)
	
}
