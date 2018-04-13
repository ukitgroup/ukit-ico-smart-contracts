const constants    = require('../utils/constants.json')
const increaseTime = require('../utils/increaseTime.js')
const withDecimals = require('../utils/withDecimals.js')
const delay        = require('nanodelay')

const web3EthAbi = require('web3-eth-abi')
const ERC223TrasnferAbi = {
	"constant" : false,
	"inputs" : [
		{
			"name" : "_to",
			"type" : "address"
		},
		{
			"name" : "_value",
			"type" : "uint256"
		},
		{
			"name" : "_data",
			"type" : "bytes"
		}
	],
	"name" : "transfer",
	"outputs" : [
		{
			"name": "",
			"type": "bool"
		}
	],
	"payable" : false,
	"stateMutability" : "nonpayable",
	"type" : "function"
}
const ERC223TransactionData = (_to, _value, _data) => web3EthAbi.encodeFunctionCall(
	ERC223TrasnferAbi,
	[ _to, _value, _data ]
)

const {
	token : tokenConfig
} = require('../config/deploy/development.js')

const Token = artifacts.require('UKTToken')
const Controller = artifacts.require('UKTTokenController')
const Voting = artifacts.require('UKTTokenVoting')
const VotingFactory = artifacts.require('UKTTokenVotingFactory')

describe('UKTTokenVotingFactory + UKTTokenVoting', addresses => {
	
	let TokenContract
	let ControllerContract
	let VotingContract
	let VotingFactoryContract
	
	const investors = [
		constants.investor1.address,
		constants.investor2.address,
		constants.investor3.address,
		constants.investor4.address
	]
	const investorsAmounts = investors.map(
		(a, i) => withDecimals(10000 * (i + 1), tokenConfig.decimals)
	)
	const investorsTrackingIds = investors.map(
		a => web3.sha3(a)
	)
	
	const transferERC223TokensToVotingContract = async (from, _value, _data) => await web3.eth.sendTransaction({
		from  : from,
		to    : TokenContract.address,
		value : 0,
		gas   : 3 * 10**5,
		data  : ERC223TransactionData(
			VotingContract.address,
			new web3.BigNumber(withDecimals(_value, tokenConfig.decimals)),
			web3.fromUtf8(_data)
		)
	})
	
	before(async () => {
		TokenContract = await Token.deployed()
		ControllerContract = await Controller.deployed()
		VotingFactoryContract = await VotingFactory.deployed()
		
		await delay(100)
		
		await ControllerContract.distribute(investors, investorsAmounts, investorsTrackingIds, {
			from : constants.owner.address
		})
	})
	
	beforeEach(async () => {
		await delay(100)
	})
	
	it('Should create new voting', async () => {
		
		const _dateEnd = 1670792400
		const _proposals = [ "proposal 1", "proposal 2", "proposal 3" ]
		const _acceptedTokens = [ TokenContract.address ]
		const _acceptedTokensValues = [ withDecimals(10000, tokenConfig.decimals) ]
		
		const tx =  await VotingFactoryContract.getNewVoting(
			_dateEnd,
			_proposals,
			_acceptedTokens,
			_acceptedTokensValues
		)
		
		const votingAddress = tx.logs[0].args.votingAddress
		
		assert.equal(web3.isAddress(votingAddress), true, 'Unable to create new voting')
		
		VotingContract = await Voting.at(votingAddress)
		
		const dateEnd = await VotingContract.dateEnd.call()
		const notValidProposal = await VotingContract.proposals.call(0)
		const acceptedToken = await VotingContract.acceptedTokens.call(TokenContract.address)
		const acceptedTokenValue = await VotingContract.acceptedTokensValues.call(TokenContract.address)
		
		assert.equal(dateEnd, _dateEnd, 'Date end do not match')
		assert.equal(web3.toUtf8(notValidProposal), 'Not valid proposal', 'Not valid proposal do not match')
		const proposals = await Promise.all(
			_proposals.map(
				async (p, idx) => await VotingContract.proposals.call(idx + 1)
			)
		)
		for(const idx in _proposals) {
			assert.equal(web3.toUtf8(proposals[idx]), _proposals[idx], 'Valid proposal do not match')
		}
		assert.equal(acceptedToken, true, 'Accepted token do not match')
		assert.equal(acceptedTokenValue.toNumber(), _acceptedTokensValues[0], 'Token value per vote')
		
	})
	
	// TODO: it('Should not accept non acceptable tokens', async () => {})
	
	it('Should not accept value of tokens less than minimum', async () => {
		try {
			
			await transferERC223TokensToVotingContract(constants.investor1.address, 9999, '1')
			
			throw new Error('Value of tokens (999) less than minimum (10000) should not be accepted')
			
		} catch (error) {
			assert.equal(error.message, 'VM Exception while processing transaction: revert')
		}
	})
	
	it('Should not accept tokens of voting for invalid proposal', async () => {
		try {
			
			await transferERC223TokensToVotingContract(constants.investor1.address, 10000, '0')
			
			throw new Error('Tokens (10000) of voting for invalid proposal (0) should not be accepted')
			
		} catch (error) {
			assert.equal(error.message, 'VM Exception while processing transaction: revert')
		}
	})
	
	it('Should accept tokens and store vote', async () => {
		
		// investor3 sends tokens amount of 1 vote for "proposal 3"
		await transferERC223TokensToVotingContract(constants.investor2.address, 10000, '3')
		assert.equal(
			(await VotingContract.proposalsWeights.call(3)).toNumber(),
			1, 'Total votes for proposal 3 do not match'
		)
		
		// investor3 sends tokens amount of 2 votes for "proposal 1"
		await transferERC223TokensToVotingContract(constants.investor3.address, 20000, '1')
		assert.equal(
			(await VotingContract.proposalsWeights.call(1)).toNumber(),
			2, 'Total votes for proposal 1 do not match'
		)
		
		// investor4 sends tokens amount of 3 votes for "proposal 2"
		await transferERC223TokensToVotingContract(constants.investor4.address, 35000, '2')
		assert.equal(
			(await VotingContract.proposalsWeights.call(2)).toNumber(),
			3, 'Total votes for proposal 2 do not match'
		)
		
	})
	
	it('Should claim tokens from voter and reduce proposal weight', async () => {
		
		await VotingContract.claimTokens({ from : constants.investor4.address })
		assert.equal(
			(await VotingContract.proposalsWeights.call(2)).toNumber(),
			0, 'Total votes for proposal 2 do not match'
		)
		
	})
	
	it('Should accept claimed tokens back and store vote', async () => {
		
		await transferERC223TokensToVotingContract(constants.investor4.address, 35000, '2')
		assert.equal(
			(await VotingContract.proposalsWeights.call(2)).toNumber(),
			3, 'Total votes for proposal 2 do not match'
		)
		
	})
	
	it('Should not accept tokens from one voter more than once', async () => {
		try {
			
			await transferERC223TokensToVotingContract(constants.investor2.address, 10000, '3')
			
			throw new Error(`Tokens from one voter ${constants.investor2.address} should not be accepted more than once`)
			
		} catch (error) {
			assert.equal(error.message, 'VM Exception while processing transaction: revert')
		}
	})
	
	it('Should not claim tokens from non voter', async () => {
		try {
			
			await VotingContract.claimTokens({
				from : constants.investor1.address
			})
			
			throw new Error(`Only voter should be able to claim his tokens`)
			
		} catch (error) {
			assert.equal(error.message, 'VM Exception while processing transaction: revert')
		}
	})
	
	it('Should not set voting winner before voting end', async () => {
		try {
			
			await VotingFactoryContract.setVotingWinner(VotingContract.address)
			
			throw new Error(`Voting winner should not be setted before voting end`)
			
		} catch (error) {
			assert.equal(error.message, 'VM Exception while processing transaction: revert')
		}
	})
	
	it('Should not accept tokens after voting end', async () => {
		await increaseTime(1670792400 - Math.floor(Date.now() / 1000))
		
		try {
			
			await transferERC223TokensToVotingContract(constants.investor1.address, 10000, '1')
			
			throw new Error(`Tokens should not be acceptable after voting end`)
			
		} catch (error) {
			assert.equal(error.message, 'VM Exception while processing transaction: revert')
		}
	})
	
	it('Should set voting winner and finalize it', async () => {
		
		await VotingFactoryContract.setVotingWinner(VotingContract.address)
		
		const isFinalized = await VotingContract.isFinalized.call()
		const isFinalizedValidly = await VotingContract.isFinalizedValidly.call()
		
		assert.isTrue(isFinalized, 'Finalization flag do not match')
		assert.isTrue(isFinalizedValidly, 'Finalization validity flag do not match')
		
	})
	
	it('Should not set voting winner more than once', async () => {
		try {
			
			await VotingFactoryContract.setVotingWinner(VotingContract.address)
			
			throw new Error(`Voting winner should not be setted more than once`)
			
		} catch (error) {
			assert.equal(error.message, 'VM Exception while processing transaction: revert')
		}
	})
	
	it('Should get voting winner', async () => {
		
		const winnerProposal = await VotingFactoryContract.getVotingWinner.call(VotingContract.address)
		
		assert.equal(web3.toUtf8(winnerProposal), 'proposal 2', 'Winner proposal do not match')
		
	})
	
	it('Should claim and refund tokens', async () => {
		
		await VotingFactoryContract.refundVotingTokens(
			VotingContract.address,
			constants.investor3.address
		)
		
		await VotingFactoryContract.refundVotingTokens(
			VotingContract.address,
			'0x0'
		)
		
		for(const idx in investors) {
			const balanceOf = await TokenContract.balanceOf.call(investors[idx])
			assert.equal(
				balanceOf.toNumber(),
				investorsAmounts[idx],
				`Investor ${constants[`investor${parseInt(idx) + 1}`].address} balanceOf do not match`
			)
		}
		
	})
	
})
