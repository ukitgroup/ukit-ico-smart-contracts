pragma solidity 0.4.21;


import "./shared/ERC223.sol";
import "./shared/BurnableToken.sol";


/**
 * @title UKTTokenBasic
 * @dev UKTTokenBasic interface
 */
contract UKTTokenBasic is ERC223, BurnableToken {
	
	bool public isControlled = false;
	bool public isConfigured = false;
	bool public isAllocated = false;
	
	// mapping of string labels to initial allocated addresses
	mapping(bytes32 => address) public allocationAddressesTypes;
	// mapping of addresses to time lock period
	mapping(address => uint32) public timelockedAddresses;
	// mapping of addresses to lock flag
	mapping(address => bool) public lockedAddresses;
	
	
	function setConfiguration(string _name, string _symbol, uint _totalSupply) external returns (bool);
	function setInitialAllocation(address[] addresses, bytes32[] addressesTypes, uint[] amounts) external returns (bool);
	function setInitialAllocationLock(address allocationAddress ) external returns (bool);
	function setInitialAllocationUnlock(address allocationAddress ) external returns (bool);
	function setInitialAllocationTimelock(address allocationAddress, uint32 timelockTillDate ) external returns (bool);
	
	// fires when the token contract becomes controlled
	event Controlled(address indexed tokenController);
	// fires when the token contract becomes configured
	event Configured(string tokenName, string tokenSymbol, uint totalSupply);
	event InitiallyAllocated(address indexed owner, bytes32 addressType, uint balance);
	event InitiallAllocationLocked(address indexed owner);
	event InitiallAllocationUnlocked(address indexed owner);
	event InitiallAllocationTimelocked(address indexed owner, uint32 timestamp);
	
}
