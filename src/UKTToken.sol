pragma solidity ^0.4.18;


import "./shared/StandardToken.sol";
import "./shared/AddressTools.sol";
import "./shared/Ownable.sol";


/**
 * @title  Basic UKT token contract
 * @author  Oleg Levshin <levshin@ucoz-team.net>
 */
contract UKTToken is StandardToken, Ownable {
	
	using AddressTools for address;
	
	string public name;
	string public symbol;
	uint public constant decimals = 18;
	
	bool public isControlled = false;
	bool public isConfigured = false;
	bool public isAllocated = false;
	
	// address of the controller contract
	address public controller = address(0);
	
	// mapping of string labels to initial allocated addresses
	mapping(bytes32 => address) public allocationAddressesTypes;
	// mapping of addresses to time lock period
	mapping(address => uint32) public timelockedAddresses;
	// mapping of addresses to lock flag
	mapping(address => bool) public lockedAddresses;
	
	
	// fires when the token contract becomes controlled
	event Controlled(address indexed tokenController);
	// fires when the token contract becomes configured
	event Configured(string tokenName, string tokenSymbol, uint totalSupply);
	event InitiallyAllocated(address indexed owner, bytes32 addressType, uint balance);
	event InitiallAllocationLocked(address indexed owner);
	event InitiallAllocationUnlocked(address indexed owner);
	event InitiallAllocationTimelocked(address indexed owner, uint32 timestamp);
	
	
	modifier onlyController() {
		require(msg.sender == controller);
		_;
	}
	
	
	/**
	 * @dev Sets the controller contract address and removes token contract ownership
	 */
	function setController(
		address _controller
	) public onlyOwner {
		// cannot be invoked after initial setting
		require( ! isControlled);
		// _controller should be an address of the smart contract
		require(_controller.isContract());
		
		controller = _controller;
		removeOwnership();
		
		Controlled(controller);
		
		isControlled = true;
	}
	
	
	/**
	 * @dev Sets the token contract configuration
	 */
	function setConfiguration(
		string _name,
		string _symbol,
		uint _totalSupply
	) external onlyController returns (bool) {
		// not configured yet
		require( ! isConfigured);
		// not empty name of the token
		require(bytes(_name).length > 0);
		// not empty ticker symbol of the token
		require(bytes(_symbol).length > 0);
		// pre-defined total supply
		require(_totalSupply > 0);
		
		name = _name;
		symbol = _symbol;
		totalSupply_ = _totalSupply.withDecimals(decimals);
		
		Configured(name, symbol, totalSupply_);
		
		isConfigured = true;
		
		return isConfigured;
	}
	
	
	/**
	 * @dev Sets initial balances allocation
	 */
	function setInitialAllocation(
		address[] addresses,
		bytes32[] addressesTypes,
		uint[] amounts
	) external returns (bool) {
		// cannot be invoked after initial allocation
		require( ! isAllocated);
		// the array of addresses should be the same length as the array of addresses types
		require(addresses.length == addressesTypes.length);
		// the array of addresses should be the same length as the array of allocating amounts
		require(addresses.length == amounts.length);
		// sum of the allocating balances should be equal to totalSupply
		uint balancesSum = 0;
		for(uint b = 0; b < amounts.length; b++) {
			balancesSum = balancesSum.add(amounts[b]);
		}
		require(balancesSum.withDecimals(decimals) == totalSupply_);
		
		for(uint a = 0; a < addresses.length; a++) {
			balances[addresses[a]] = amounts[a].withDecimals(decimals);
			allocationAddressesTypes[addressesTypes[a]] = addresses[a];
			InitiallyAllocated(addresses[a], addressesTypes[a], balanceOf(addresses[a]));
		}
		
		isAllocated = true;
		
		return isAllocated;
	}
	
	
	/**
	 * @dev Sets lock for given allocation address
	 */
	function setInitialAllocationLock(
		address allocationAddress
	) external onlyController returns (bool) {
		require(allocationAddress != address(0));
		
		lockedAddresses[allocationAddress] = true;
		
		InitiallAllocationLocked(allocationAddress);
		
		return true;
	}
	
	
	/**
	 * @dev Sets unlock for given allocation address
	 */
	function setInitialAllocationUnlock(
		address allocationAddress
	) external onlyController returns (bool) {
		require(allocationAddress != address(0));
		
		lockedAddresses[allocationAddress] = false;
		
		InitiallAllocationUnlocked(allocationAddress);
		
		return true;
	}
	
	
	/**
	 * @dev Sets time lock for given allocation address
	 */
	function setInitialAllocationTimelock(
		address allocationAddress,
		uint32 timelockTillDate
	) external onlyController returns (bool) {
		require(allocationAddress != address(0));
		require(timelockTillDate >= now);
		
		timelockedAddresses[allocationAddress] = timelockTillDate;
		
		InitiallAllocationTimelocked(allocationAddress, timelockTillDate);
		
		return true;
	}
	
	
	/**
	 * @dev Allows transfer of the tokens after locking conditions checking
	 */
	function transfer(
		address _to,
		uint256 _value
	) public returns (bool) {
		require(lockedAddresses[msg.sender] == false);
		require(timelockedAddresses[msg.sender] == 0 || timelockedAddresses[msg.sender] <= now);
		
		return super.transfer(_to, _value);
	}
	
	
	/**
	 * @dev Allows transfer of the tokens after locking conditions checking
	 */
	function transferFrom(
		address _from,
		address _to,
		uint256 _value
	) public returns (bool) {
		require(lockedAddresses[_from] == false);
		require(timelockedAddresses[_from] == 0 || timelockedAddresses[_from] <= now);
		
		return super.transferFrom(_from, _to, _value);
	}
	
}
