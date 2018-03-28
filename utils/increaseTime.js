module.exports = async addSeconds => {
	web3.currentProvider.send({
		jsonrpc: "2.0",
		method: "evm_increaseTime",
		params: [addSeconds], id: 0
	})
	
	await require('nanodelay')(900)
}
