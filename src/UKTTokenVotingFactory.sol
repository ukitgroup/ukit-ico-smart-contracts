pragma solidity ^0.4.18;


import "./shared/Ownable.sol";
import "./UKTTokenVoting.sol";


/**
 * @title  UKT Token Voting Factory contract
 * @author  Oleg Levshin <levshin@ucoz-team.net>
 */
contract UKTTokenVotingFactory is Ownable {
	
	address[] public votings;
	mapping(address => int256) public votingsWinners;
	
	event NewVoting(address indexed votingAddress);
	event WinnerSetted(address indexed votingAddress, uint256 winnerIdx, bytes32 winner, uint256 winnerWeight);
	
	
	/**
	 * @dev Checks voting contract address for validity
	 */
	function isValidVoting(address votingAddress) private view returns (bool) {
		for (uint256 i = 0; i < votings.length; i++) {
			if (votings[i] == votingAddress) {
				return true;
			}
		}
		
		return false;
	}
	
	
	/**
	 * @dev Creates new instance of UKTTokenVoting contract with given params
	 */
	function getNewVoting(
		bytes32[] _proposals,
		uint256 _tokensValuePerVote,
		uint256 _dateEnd,
		address[] tokenContractsAddresses
	) public onlyOwner returns (address votingAddress) {
		
		votingAddress = address(new UKTTokenVoting(
			_proposals,
			_tokensValuePerVote,
			_dateEnd,
			tokenContractsAddresses
		));
		
		NewVoting(votingAddress);
		
		votings.push(votingAddress);
		votingsWinners[votingAddress] = -1;
		
		return votingAddress;
	}
	
	
	/**
	 * @dev Sets calculated proposalIdx as voting winner
	 */
	function setVotingWinner(address votingAddress) public onlyOwner {
		require(votingsWinners[votingAddress] == -1);
		
		var (winnerIdx, winner, winnerWeight) = UKTTokenVoting(votingAddress).getWinner();
		require(winnerIdx > 0);
		
		votingsWinners[votingAddress] = int256(winnerIdx);
		
		WinnerSetted(votingAddress, winnerIdx, winner, winnerWeight);
	}
	
	
	/**
	 * @dev Refunds tokens for all voters
	 */
	function refundVotingTokens(address votingAddress) public onlyOwner returns (bool) {
		require(isValidVoting(votingAddress));
		
		return UKTTokenVoting(votingAddress).refundTokens();
	}
	
	
	/**
	 * @dev Gets voting winner
	 */
	function getVotingWinner(address votingAddress) public view returns (bytes32) {
		require(votingsWinners[votingAddress] > 0);
		
		return UKTTokenVoting(votingAddress).proposals(uint256(votingsWinners[votingAddress]));
	}
}
