pragma solidity ^0.4.18;


import "./ERC20.sol";


contract ERC223 is ERC20 {
	function transfer(address to, uint256 value, bytes data) public returns (bool);
	event ERC223Transfer(address indexed from, address indexed to, uint256 value, bytes data);
}
