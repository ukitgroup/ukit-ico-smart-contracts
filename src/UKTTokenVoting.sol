pragma solidity ^0.4.18;


import "./shared/Ownable.sol";
import "./shared/ERC223Reciever.sol";
import './shared/StandardToken.sol';

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
	}
	
	mapping(address => bool) public acceptedTokens;
	uint256 public tokensValuePerVote;
	
	bytes32[] public proposals;
	mapping (uint256 => uint256) public totalVotes;
	
	uint256 public dateStart;
	uint256 public dateEnd;
	
	mapping (address => Vote) public votes;
	address[] public voters;
	
	event NewVote(address indexed voter, uint256 proposalIdx);
	event TokensClaimed(address to);
	event TokensRefunded(address to);
	
	
	function UKTTokenVoting(
		bytes32[] _proposals,
		uint256 _tokensValuePerVote,
		uint256 _dateEnd,
		address[] tokenContractsAddresses
	) public {
		require(_proposals.length > 1);
		require(_tokensValuePerVote > 0);
		require(_dateEnd > now);
		require(tokenContractsAddresses.length > 0);
		
		proposals.push(keccak256("not valid proposal"));
		totalVotes[0] = 0;
		for(uint256 i = 0; i < _proposals.length; i++) {
			proposals.push(_proposals[i]);
			totalVotes[i+1] = 0;
		}
		
		tokensValuePerVote = _tokensValuePerVote;
		dateStart = now;
		dateEnd = _dateEnd;
		
		for(uint256 j = 0; j < tokenContractsAddresses.length; j++) {
			acceptedTokens[tokenContractsAddresses[j]] = true;
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
			votes[_address].tokenContractAddress == address(0)
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
		// executed from contract in acceptedTokens
		require(acceptedTokens[msg.sender] == true);
		
		// voting hasn't ended yet
		require(now < dateEnd);
		
		// value of tokens is enough for voting
		require(_value >= tokensValuePerVote);
		
		// give proposal index is valid
		uint256 proposalIdx = _data.parseInt();
		require(isValidProposal(proposalIdx));
		
		// user hasn't voted yet
		require(isAddressNotVoted(_from));
		
		uint256 weight = _value.div(tokensValuePerVote);
		
		votes[_from] = Vote(proposalIdx, _value, weight, msg.sender);
		voters.push(_from);
		
		totalVotes[proposalIdx] += weight;
		
		NewVote(_from, proposalIdx);
		
		return true;
	}
	
	
	/**
	 * @dev Gets winner tuple after voting is finished
	 */
	function getWinner() external view returns (uint256 winnerIdx, bytes32 winner, uint256 winnerWeight) {
		require(now > dateEnd);
		
		winnerIdx = 0;
		winner = proposals[winnerIdx];
		winnerWeight = totalVotes[winnerIdx];
		
		for(uint256 i = 1; i < proposals.length; i++) {
			if(totalVotes[i] >= winnerWeight) {
				winnerIdx = i;
				winner = proposals[winnerIdx];
				winnerWeight = totalVotes[i];
			}
		}
		
		return (winnerIdx, winner, winnerWeight);
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
		
		return StandardToken(vote.tokenContractAddress).transfer(to, vote.tokensValue);
	}
	
	
	/**
	 * @dev Allows voter to claim his tokens back to address
	 */
	function claimTokens() public returns (bool) {
		require(now > dateEnd);
		require(isAddressVoted(msg.sender));
		
		require(transferTokens(msg.sender));
		TokensClaimed(msg.sender);
		
		return true;
	}
	
	
	/**
	 * @dev Refunds tokens for all voters
	 */
	function refundTokens() public onlyOwner returns (bool) {
		for(uint256 i = 0; i < voters.length; i++) {
			require(transferTokens(voters[i]));
			TokensRefunded(voters[i]);
		}
		
		return true;
	}
	
}
