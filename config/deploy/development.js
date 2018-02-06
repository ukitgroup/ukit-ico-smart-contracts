module.exports = {
	token : {
		name : 'uKit AI Token',
		symbol : 'UKT',
		totalSupply : 1 * 10**9,
		decimals : 18
	},
	allocations : [
		{
			name : 'ico',
			// this address is the address of controller
			amount : 570 * 10**6
		},
		{
			name : 'team',
			address : '0xec5a57b3a7fd75cf019e85865dec140bcaf21b74',
			amount : 150 * 10**6,
			timelock : Math.ceil(Date.now() / 1000) + 60 * 60 * 24 * 548 // +1.5 years
		},
		{
			name : 'reserve',
			address : '0x638764A6cb1Ad8C07835e96705ce2D4A62241741',
			amount : 226 * 10**6
		},
		{
			name : 'advisors',
			address : '0x8745c03893f3ce6b742af904286e54f0ee41879d',
			amount : 30 * 10**6,
			lock : true
		},
		{
			name : 'icos',
			address : '0x622c0fa2beeead0b3f6f79b710c8769ba730a697',
			amount : 24 * 10**6,
			lock : true
		}
	]
}
