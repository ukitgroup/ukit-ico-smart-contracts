import { action, observable } from 'mobx'

class TokenHolder {
	
	@observable address   = '0x0'
	@observable avBalance = 0
	@observable acBalance = 0
	
	constructor ({ address = '0x0', avBalance = 0, acBalance = 0 }) {
		this.address = address
		this.avBalance = avBalance
		this.acBalance = acBalance
	}
}

export default class UKTTokenControllerStore {
	
	@observable totalSupply   = 0
	@observable icoAllocation = 0
	@observable holders       = []
	
	web3 = {}
	
	UKTTokenInstance = null
	UKTTokenControllerInstance = null
	
	constructor ({ UKTTokenContract, UKTTokenControllerContract }) {
		this.UKTTokenContract = UKTTokenContract
		this.UKTTokenControllerContract = UKTTokenControllerContract
	}
	
	async initialize () {
		this.UKTTokenInstance = await this.UKTTokenContract.deployed()
		this.UKTTokenControllerInstance = await this.UKTTokenControllerContract.deployed()
		
		await this.populateHolders()
		await this.setTotalSupply()
		await this.setIcoAllocation()
	}
	
	async balanceOf (address) {
		return (await this.UKTTokenInstance.balanceOf.call(address)).toNumber() / 10 ** 18
	}
	
	async setTotalSupply () {
		this.totalSupply = (await this.UKTTokenInstance.totalSupply.call()).toNumber() / 10 ** 18
	}
	
	async setIcoAllocation () {
		this.icoAllocation = await this.balanceOf(this.UKTTokenControllerInstance.address)
	}
	
	async distributeTokens (addresses, amounts) {
		await this.UKTTokenControllerInstance.distribute(
			addresses, amounts, { from : web3.eth.accounts[0] }
		)
	}
	
	async finalizeDistribution () {
		await this.UKTTokenControllerInstance.finalize(
			{ from : web3.eth.accounts[0] }
		)
	}
	
	@action
	async populateHolders () {
		this.holders = await Promise.all([
			'0x1042f55c0413ad18df17908c71fb4a08dbf75203', // 0xf16fc0867e2fa44b1d4ad4b47bd67b3c6453c32a9d8044c9f4cd0cd302ed50b3
			'0x79e7cff79934068e8fb2a8664fe5027ef21ac2bb', // 0x80361b857f09837de373d87588b14bb6363349776e4d8d5c8fe5379c1d237738
			'0x89b7d70224c09106501e1a9ea135ba321624923a', // 0x3d2e71230b9f71b7291e1d26cf37c69121cec9e45691eb063534114dfb675a72
			'0x495af2efdad3503c43f0571cd0d2a65bf581edbd', // 0x0e34451c7c297da5491d4a41403e8f029c0a3a0714bb23593bc04e11d9a472ac
			'0x84ef1e392785dc0e5731a46e1e7445040f9b57b1', // 0x5fdaa9a9554f38fa7d24d6dfe3ee5251b8bb279c84fcb43410d3ddc999cd0373
			'0x2c44665ecfd3af1e954fe70b9d55d77fe8a723e0', // 0x8836faf5aa60d363f76fdb0650848c578cd2815be2a719e86d7ebae7eb5c3984
			'0xaaffd31cf8c36c0baa958c6bd7bf6e3677bc84aa', // 0x93c9ceb0cc5643e601dfa682bc567e955118273c3f9d08487189650364b3d412
			'0xeb477c5e72c3031e628f5ce5d7d29923ec71bd48', // 0x1cc267aa5fd8bf8c3dea09e76732ff2ef6c89618ddfa2612ff2535c5202fdaba
			'0xeeb462daa7f2645b43561c65c9348f8601d1542c', // 0x2ea2264ce6e057a3cda7e91aa9ed94975b58c4d64c0c10f4b54ab9a3c7a8d18a
			'0x3586394e67aad6003ccfb21ae2287412d1a0d3fd', // 0xb2fe585e7dbb0b393f3ae5d3bda1bfcbfbd2afbcf3511a5e805628a2373b942f
		].map(async (address, idx) => {
			const acBalance = await this.balanceOf(address)
			const avBalance = (! acBalance && icoAllocation) ? (idx + 1) * 10000 : 0
			return new TokenHolder({ address, avBalance, acBalance })
		}))
	}
}
