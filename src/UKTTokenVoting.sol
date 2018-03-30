pragma solidity ^0.4.18;


import "./shared/Ownable.sol";
import "./shared/ERC223Reciever.sol";

import "./shared/SafeMath.sol";
import "./shared/BytesTools.sol";


/**
 * @title  UKT Token Voting contract
 * @author  Oleg Levshin <levshin@ucoz-team.net>
 */
contract UKTTokenVoting is ERC223Reciever, Ownable {
	
	using SafeMath for uint256;
	using BytesTools for bytes;
	
	struct Vote {
		uint256 proposalIdx;
		uint256 tokensValue;
		uint256 weight;
		address tokenContractAddress;
		uint256 blockNumber;
	}
	
	mapping(address => bool) public acceptedTokens;
	mapping(address => uint256) public acceptedTokensValues;
	
	bytes32[] public proposals;
	mapping (uint256 => uint256) public proposalsWeights;
	
	uint256 public dateStart;
	uint256 public dateEnd;
	
	address[] public voters;
	mapping (address => Vote) public votes;
	
	bool public isFinalized = false;
	bool public isFinalizedValidly = false;
	
	event NewVote(address indexed voter, uint256 proposalIdx, uint256 proposalWeight);
	event TokensClaimed(address to);
	event TokensRefunded(address to);
	
	
	function UKTTokenVoting(
		uint256 _dateEnd,
		bytes32[] _proposals,
		address[] _acceptedTokens,
		uint256[] _acceptedTokensValues
	) public {
		require(_dateEnd > now);
		require(_proposals.length > 1);
		require(_acceptedTokens.length > 0);
		require(_acceptedTokensValues.length > 0);
		require(_acceptedTokens.length == _acceptedTokensValues.length);
		
		dateStart = now;
		dateEnd = _dateEnd;
		
		proposals.push("Not valid proposal");
		proposalsWeights[0] = 0;
		for(uint256 i = 0; i < _proposals.length; i++) {
			proposals.push(_proposals[i]);
			proposalsWeights[i+1] = 0;
		}
		
		for(uint256 j = 0; j < _acceptedTokens.length; j++) {
			acceptedTokens[_acceptedTokens[j]] = true;
			acceptedTokensValues[_acceptedTokens[j]] = _acceptedTokensValues[j];
		}
	}
	
	
	/**
	 * @dev Checks proposal index for validity
	 */
	function isValidProposal(uint256 proposalIdx) private view returns (bool) {
		return (
			proposalIdx > 0 &&
			proposals[proposalIdx].length > 0
		);
	}
	
	
	/**
	 * @dev Return true if address not voted yet
	 */
	function isAddressNotVoted(address _address) private view returns (bool) {
		return (
			votes[_address].proposalIdx == 0 &&
			votes[_address].tokensValue == 0 &&
			votes[_address].weight == 0 &&
			votes[_address].tokenContractAddress == address(0) &&
			votes[_address].blockNumber == 0
		);
	}
	
	
	/**
	 * @dev Return true if address already voted
	 */
	function isAddressVoted(address _address) private view returns (bool) {
		return ! isAddressNotVoted(_address);
	}
	
	
	/**
	 * @dev Executes automatically when user transfer his token to this contract address
	 */
	function tokenFallback(
		address _from,
		uint256 _value,
		bytes _data
	) external returns (bool) {
		// voting hasn't ended yet
		require(now < dateEnd);
		
		// executed from contract in acceptedTokens
		require(acceptedTokens[msg.sender] == true);
		
		// value of tokens is enough for voting
		require(_value >= acceptedTokensValues[msg.sender]);
		
		// give proposal index is valid
		uint256 proposalIdx = _data.parseInt();
		require(isValidProposal(proposalIdx));
		
		// user hasn't voted yet
		require(isAddressNotVoted(_from));
		
		uint256 weight = _value.div(acceptedTokensValues[msg.sender]);
		
		votes[_from] = Vote(proposalIdx, _value, weight, msg.sender, block.number);
		voters.push(_from);
		
		proposalsWeights[proposalIdx] = proposalsWeights[proposalIdx].add(weight);
		
		NewVote(_from, proposalIdx, proposalsWeights[proposalIdx]);
		
		return true;
	}
	
	
	/**
	 * @dev Gets winner tuple after voting is finished
	 */
	function getWinner() external view returns (uint256 winnerIdx, bytes32 winner, uint256 winnerWeight) {
		require(now >= dateEnd);
		
		winnerIdx = 0;
		winner = proposals[winnerIdx];
		winnerWeight = proposalsWeights[winnerIdx];
		
		for(uint256 i = 1; i < proposals.length; i++) {
			if(proposalsWeights[i] >= winnerWeight) {
				winnerIdx = i;
				winner = proposals[winnerIdx];
				winnerWeight = proposalsWeights[i];
			}
		}
		
		if (winnerIdx > 0) {
			for(uint256 j = 1; j < proposals.length; j++) {
				if(j != winnerIdx && proposalsWeights[j] == proposalsWeights[winnerIdx]) {
					return (0, proposals[0], proposalsWeights[0]);
				}
			}
		}
		
		return (winnerIdx, winner, winnerWeight);
	}
	
	
	/**
	 * @dev Finalizes voting
	 */
	function finalize(bool _isFinalizedValidly) external onlyOwner {
		require( ! isFinalized && now >= dateEnd);
		
		isFinalized = true;
		isFinalizedValidly = _isFinalizedValidly;
	}
	
	
	/**
	 * @dev Trasnfer tokens to voter
	 */
	function transferTokens(address to) private returns (bool) {
		
		Vote memory vote = votes[to];
		
		if(vote.tokensValue == 0) {
			return true;
		}
		votes[to].tokensValue = 0;
		
		if ( ! isFinalized) {
			votes[to] = Vote(0, 0, 0, address(0), 0);
			proposalsWeights[vote.proposalIdx] = proposalsWeights[vote.proposalIdx].sub(vote.weight);
		}
		
		return vote.tokenContractAddress.call(bytes4(keccak256('transfer(address,uint256)')), to, vote.tokensValue);
	}
	
	
	/**
	 * @dev Allows voter to claim his tokens back to address
	 */
	function claimTokens() public returns (bool) {
		require(isAddressVoted(msg.sender));
		
		require(transferTokens(msg.sender));
		TokensClaimed(msg.sender);
		
		return true;
	}
	
	
	/**
	 * @dev Refunds tokens to particular address
	 */
	function _refundTokens(address to) private returns (bool) {
		require(transferTokens(to));
		TokensRefunded(to);
		
		return true;
	}
	
	
	/**
	 * @dev Refunds tokens for all voters
	 */
	function refundTokens(address to) public onlyOwner returns (bool) {
		if(to != address(0)) {
			return _refundTokens(to);
		}
		
		for(uint256 i = 0; i < voters.length; i++) {
			_refundTokens(voters[i]);
		}
		
		return true;
	}
	
}
