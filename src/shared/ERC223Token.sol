pragma solidity ^0.4.18;


import "./ERC223.sol";
import "./ERC223Reciever.sol";
import "./StandardToken.sol";

import "./AddressTools.sol";


/**
 * @title (Not)Reference implementation of the ERC223 standard token.
 */
contract ERC223Token is ERC223, StandardToken {
	
	using AddressTools for address;
	
	/**
	 * @dev Makes execution of the token fallback method from if reciever address is contract
	 */
	function executeTokenFallback(address _to, uint256 _value, bytes _data) private returns (bool) {
		ERC223Reciever receiver = ERC223Reciever(_to);
		
		return receiver.tokenFallback(msg.sender, _value, _data);
	}
	
	
	/**
	 * @dev Makes execution of the tokens transfer method from super class
	 */
	function executeTransfer(address _to, uint256 _value, bytes _data) private returns (bool) {
		require(super.transfer(_to, _value));
		
		if(_to.isContract()) {
			require(executeTokenFallback(_to, _value, _data));
			ERC223Transfer(msg.sender, _to, _value, _data);
		}
		
		return true;
	}
	
	
	/**
	 * @dev Transfer the specified amount of tokens to the specified address.
	 *      Invokes the `tokenFallback` function if the recipient is a contract.
	 *      The token transfer fails if the recipient is a contract
	 *      but does not implement the `tokenFallback` function
	 *      or the fallback function to receive funds.
	 *
	 * @param _to    Receiver address
	 * @param _value Amount of tokens that will be transferred
	 * @param _data  Transaction metadata
	 */
	function transfer(address _to, uint256 _value, bytes _data) public returns (bool) {
		return executeTransfer(_to, _value, _data);
	}
	
	
	/**
	 * @dev Transfer the specified amount of tokens to the specified address.
	 *      This function works the same with the previous one
	 *      but doesn"t contain `_data` param.
	 *      Added due to backwards compatibility reasons.
	 *
	 * @param _to    Receiver address
	 * @param _value Amount of tokens that will be transferred
	 */
	function transfer(address _to, uint256 _value) public returns (bool) {
		bytes memory _data;
		
		return executeTransfer(_to, _value, _data);
	}
	
}
