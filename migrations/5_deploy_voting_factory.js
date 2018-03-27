const VotingFactory = artifacts.require('UKTTokenVotingFactory')

module.exports = async (deployer, network, accounts) => {
	
	return await deployer.deploy(VotingFactory)
	
}
