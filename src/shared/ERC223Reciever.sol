pragma solidity ^0.4.18;



/**
* @title Contract that will work with ERC223 tokens
*/
contract ERC223Reciever {
	
	/**
	 * @dev Standard ERC223 function that will handle incoming token transfers
	 *
	 * @param _from address  Token sender address
	 * @param _value uint256 Amount of tokens
	 * @param _data bytes  Transaction metadata
	 */
	function tokenFallback(address _from, uint256 _value, bytes _data) external returns (bool);
	
}
