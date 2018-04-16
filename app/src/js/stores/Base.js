import Web3 from 'web3'
import delay from 'nanodelay'


class Base {
	
	
	form = '0x0'
	web3 = null
	
	
	constructor (provider, from) {
		this.web3 = new Web3(provider)
		this.from = from
	}
	
	
	async request ({ instance, method, call = false, params = [], options = {}, responseDelay = 500 }) {
		
		params.push({
			from : this.from,
			...options
		})
		
		let response = null
		
		if (call) {
			response = await instance[method].call.apply(instance, params)
		} else {
			response = await instance[method].apply(instance, params)
		}
		
		await delay(responseDelay)
		
		return response
	}
	
	
}


export default Base