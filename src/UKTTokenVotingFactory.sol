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
	
	event VotingCreated(address indexed votingAddress, uint256 dateEnd, bytes32[] proposals, address[] acceptedTokens, uint256[] acceptedTokensValues);
	event WinnerSetted(address indexed votingAddress, uint256 winnerIdx, bytes32 winner, uint256 winnerWeight);
	event VotingFinalized(address indexed votingAddress, bool isFinalizedValidly);
	
	
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
		uint256 dateEnd,
		bytes32[] proposals,
		address[] acceptedTokens,
		uint256[] acceptedTokensValues
	) public onlyOwner returns (address votingAddress) {
		
		votingAddress = address(new UKTTokenVoting(dateEnd, proposals, acceptedTokens, acceptedTokensValues));
		
		VotingCreated(votingAddress, dateEnd, proposals, acceptedTokens, acceptedTokensValues);
		
		votings.push(votingAddress);
		votingsWinners[votingAddress] = -1;
		
		return votingAddress;
	}
	
	
	/**
	 * @dev Refunds tokens for all voters
	 */
	function refundVotingTokens(address votingAddress, address to) public onlyOwner returns (bool) {
		require(isValidVoting(votingAddress));
		
		return UKTTokenVoting(votingAddress).refundTokens(to);
	}
	
	
	/**
	 * @dev Sets calculated proposalIdx as voting winner
	 */
	function setVotingWinner(address votingAddress) public onlyOwner {
		require(votingsWinners[votingAddress] == -1);
		
		var (winnerIdx, winner, winnerWeight) = UKTTokenVoting(votingAddress).getWinner();
		
		bool isFinalizedValidly = winnerIdx > 0;
		
		UKTTokenVoting(votingAddress).finalize(isFinalizedValidly);
		
		VotingFinalized(votingAddress, isFinalizedValidly);
		
		votingsWinners[votingAddress] = int256(winnerIdx);
		
		WinnerSetted(votingAddress, winnerIdx, winner, winnerWeight);
	}
	
	
	/**
	 * @dev Gets voting winner
	 */
	function getVotingWinner(address votingAddress) public view returns (bytes32) {
		require(votingsWinners[votingAddress] > -1);
		
		return UKTTokenVoting(votingAddress).proposals(uint256(votingsWinners[votingAddress]));
	}
}
