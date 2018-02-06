module.exports = addSeconds => web3.currentProvider.send({
	jsonrpc: "2.0",
	method: "evm_increaseTime",
	params: [addSeconds], id: 0
})
