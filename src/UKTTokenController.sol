pragma solidity 0.4.21;


import "./UKTTokenBasic.sol";
import "./shared/Ownable.sol";
import "./shared/SafeMath.sol";
import "./shared/AddressTools.sol";


/**
 * @title  Basic controller contract for basic UKT token
 * @author  Oleg Levshin <levshin@ucoz-team.net>
 */
contract UKTTokenController is Ownable {
	
	using SafeMath for uint256;
	using AddressTools for address;
	
	// address of the controlled token
	UKTTokenBasic public token;
	// finalize function type. One of two values is possible: "transfer" or "burn"
	bytes32 public finalizeType = "transfer";
	// address type where finalize function will transfer undistributed tokens
	bytes32 public finalizeTransferAddressType = "";
	// maximum quantity of addresses to distribute
	uint8 internal MAX_ADDRESSES_FOR_DISTRIBUTE = 100;
	// list of locked initial allocation addresses
	address[] internal lockedAddressesList;
	
	
	// fires when tokens distributed to holder
	event Distributed(address indexed owner, uint256 amount);
	
	
	/**
	 * @dev The UKTTokenController constructor
	 */
	function UKTTokenController(
		bytes32 _finalizeType,
		bytes32 _finalizeTransferAddressType
	) public {
		require(_finalizeType == "transfer" || _finalizeType == "burn");
		
		if (_finalizeType == "transfer") {
			require(_finalizeTransferAddressType != "");
		} else if (_finalizeType == "burn") {
			require(_finalizeTransferAddressType == "");
		}
		
		finalizeType = _finalizeType;
		finalizeTransferAddressType = _finalizeTransferAddressType;
	}
	
	
	/**
	 * @dev Sets controlled token
	 */
	function setToken (
		address _token
	) public onlyOwner returns (bool) {
		require(token == address(0));
		require(_token.isContract());
		
		token = UKTTokenBasic(_token);
		
		return true;
	}
	
	
	/**
	 * @dev Configures controlled token params
	 */
	function configureTokenParams(
		string _name,
		string _symbol,
		uint _totalSupply
	) public onlyOwner returns (bool) {
		require(token != address(0));
		return token.setConfiguration(_name, _symbol, _totalSupply);
	}
	
	
	/**
	 * @dev Allocates initial ICO balances (like team, advisory tokens and others)
	 */
	function allocateInitialBalances(
		address[] addresses,
		bytes32[] addressesTypes,
		uint[] amounts
	) public onlyOwner returns (bool) {
		require(token != address(0));
		return token.setInitialAllocation(addresses, addressesTypes, amounts);
	}
	
	
	/**
	 * @dev Locks given allocation address
	 */
	function lockAllocationAddress(
		address allocationAddress
	) public onlyOwner returns (bool) {
		require(token != address(0));
		token.setInitialAllocationLock(allocationAddress);
		lockedAddressesList.push(allocationAddress);
		return true;
	}
	
	
	/**
	 * @dev Unlocks given allocation address
	 */
	function unlockAllocationAddress(
		address allocationAddress
	) public onlyOwner returns (bool) {
		require(token != address(0));
		
		token.setInitialAllocationUnlock(allocationAddress);
		
		for (uint idx = 0; idx < lockedAddressesList.length; idx++) {
			if (lockedAddressesList[idx] == allocationAddress) {
				lockedAddressesList[idx] = address(0);
				break;
			}
		}
		
		return true;
	}
	
	
	/**
	 * @dev Unlocks all allocation addresses
	 */
	function unlockAllAllocationAddresses() public onlyOwner returns (bool) {
		for(uint a = 0; a < lockedAddressesList.length; a++) {
			if (lockedAddressesList[a] == address(0)) {
				continue;
			}
			unlockAllocationAddress(lockedAddressesList[a]);
		}
		
		return true;
	}
	
	
	/**
	 * @dev Locks given allocation address with timestamp
	 */
	function timelockAllocationAddress(
		address allocationAddress,
		uint32 timelockTillDate
	) public onlyOwner returns (bool) {
		require(token != address(0));
		return token.setInitialAllocationTimelock(allocationAddress, timelockTillDate);
	}
	
	
	
	/**
	 * @dev Distributes tokens to holders (investors)
	 */
	function distribute(
		address[] addresses,
		uint[] amounts
	) public onlyOwner returns (bool) {
		require(token != address(0));
		// quantity of addresses should be less than MAX_ADDRESSES_FOR_DISTRIBUTE
		require(addresses.length < MAX_ADDRESSES_FOR_DISTRIBUTE);
		// the array of addresses should be the same length as the array of amounts
		require(addresses.length == amounts.length);
		
		for(uint a = 0; a < addresses.length; a++) {
			token.transfer(addresses[a], amounts[a].withDecimals(18));
			emit Distributed(addresses[a], token.balanceOf(addresses[a]));
		}
		
		return true;
	}
	
	
	/**
	 * @dev Finalizes the ability to use the controller and destructs it
	 */
	function finalize() public onlyOwner {
		
		if (finalizeType == "transfer") {
			// transfer all undistributed tokens to particular address
			token.transfer(
				token.allocationAddressesTypes(finalizeTransferAddressType),
				token.balanceOf(this)
			);
		} else if (finalizeType == "burn") {
			// burn all undistributed tokens
			token.burn(token.balanceOf(this));
		}
		
		require(unlockAllAllocationAddresses());
		
		selfdestruct(owner);
	}
	
}
