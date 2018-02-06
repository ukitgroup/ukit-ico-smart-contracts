pragma solidity ^0.4.18;


/**
 * @title AddressTools
 * @dev Useful tools for address type
 */
library AddressTools {
	
	/**
	* @dev Returns true if given address is the contract address, otherwise - returns false
	*/
	function isContract(address a) internal view returns (bool) {
		if(a == address(0)) {
			return false;
		}
		
		uint codeSize;
		assembly {
			codeSize := extcodesize(a)
		}
		
		if(codeSize > 0) {
			return true;
		}
		
		return false;
	}
	
}
