pragma solidity 0.4.21;


/**
 * @title BytesTools
 * @dev Useful tools for bytes type
 */
library BytesTools {
	
	/**
	 * @dev Parses n of type bytes to uint256
	 */
	function parseInt(bytes n) internal pure returns (uint256) {
		
		uint256 parsed = 0;
		bool decimals = false;
		
		for (uint256 i = 0; i < n.length; i++) {
			if ( n[i] >= 48 && n[i] <= 57) {
				
				if (decimals) break;
				
				parsed *= 10;
				parsed += uint256(n[i]) - 48;
			} else if (n[i] == 46) {
				decimals = true;
			}
		}
		
		return parsed;
	}
	
}
