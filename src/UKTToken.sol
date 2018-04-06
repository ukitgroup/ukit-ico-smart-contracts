pragma solidity 0.4.21;



import "./UKTTokenBasic.sol";
import "./shared/ERC223Token.sol";
import "./shared/Ownable.sol";
import "./shared/AddressTools.sol";


/**
 * @title  Basic UKT token contract
 * @author  Oleg Levshin <levshin@ucoz-team.net>
 */
contract UKTToken is UKTTokenBasic, ERC223Token, Ownable {
	
	using AddressTools for address;
	
	string public name;
	string public symbol;
	uint public constant decimals = 18;
	
	// address of the controller contract
	address public controller = address(0);
	
	
	modifier onlyController() {
		require(msg.sender == controller);
		_;
	}
	
	modifier onlyUnlocked(address _address) {
		address from = _address != address(0) ? _address : msg.sender;
		require(
			lockedAddresses[from] == false &&
			(
				timelockedAddresses[from] == 0 ||
				timelockedAddresses[from] <= now
			)
		);
		_;
	}
	
	
	/**
	 * @dev Sets the controller contract address and removes token contract ownership
	 */
	function setController(
		address _controller
	) public onlyOwner {
		// cannot be invoked after initial setting
		require(!isControlled);
		// _controller should be an address of the smart contract
		require(_controller.isContract());
		
		controller = _controller;
		removeOwnership();
		
		emit Controlled(controller);
		
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
		require(!isConfigured);
		// not empty name of the token
		require(bytes(_name).length > 0);
		// not empty ticker symbol of the token
		require(bytes(_symbol).length > 0);
		// pre-defined total supply
		require(_totalSupply > 0);
		
		name = _name;
		symbol = _symbol;
		totalSupply_ = _totalSupply.withDecimals(decimals);
		
		emit Configured(name, symbol, totalSupply_);
		
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
	) external onlyController returns (bool) {
		// cannot be invoked after initial allocation
		require(!isAllocated);
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
			emit InitiallyAllocated(addresses[a], addressesTypes[a], balanceOf(addresses[a]));
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
		
		emit InitiallAllocationLocked(allocationAddress);
		
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
		
		emit InitiallAllocationUnlocked(allocationAddress);
		
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
		
		emit InitiallAllocationTimelocked(allocationAddress, timelockTillDate);
		
		return true;
	}
	
	
	/**
	 * @dev Allows transfer of the tokens after locking conditions checking
	 */
	function transfer(
		address _to,
		uint256 _value
	) public onlyUnlocked(address(0)) returns (bool) {
		require(super.transfer(_to, _value));
		return true;
	}
	
	
	/**
	 * @dev Allows transfer of the tokens (with additional _data) after locking conditions checking
	 */
	function transfer(
		address _to,
		uint256 _value,
		bytes _data
	) public onlyUnlocked(address(0)) returns (bool) {
		require(super.transfer(_to, _value, _data));
		return true;
	}
	
	
	/**
	 * @dev Allows transfer of the tokens after locking conditions checking
	 */
	function transferFrom(
		address _from,
		address _to,
		uint256 _value
	) public onlyUnlocked(_from) returns (bool) {
		require(super.transferFrom(_from, _to, _value));
		return true;
	}
	
}
