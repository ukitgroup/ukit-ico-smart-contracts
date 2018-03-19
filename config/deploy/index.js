const Validator = require('validatorjs')

module.exports = network => {
	
	const config          = require(`${process.cwd()}/config/deploy/${network}`)
	const { allocations } = config
	
	const allocationsSupply = allocations.reduce((r, a) => r += a.amount, 0)
	const allocationsTypes  = allocations.map(a => a.name)
	
	const configValidationSchema = {
		'token'             : 'required',
		'token.name'        : 'required|string',
		'token.symbol'      : 'required|string',
		'token.totalSupply' : `required|integer|size:${allocationsSupply}`,
		'token.decimals'    : 'required|integer|between:0,18',
		
		'allocations'            : 'required|array',
		'allocations.*.name'     : 'required|string',
		'allocations.*.address'  : 'regex:/^0x[0-9a-fA-F]{40}$/',
		'allocations.*.amount'   : 'required|integer',
		'allocations.*.lock'     : 'boolean',
		'allocations.*.timelock' : `integer|min:${Math.ceil(Date.now() / 1000)}`,
		
		'controller'                             : 'required',
		'controller.finalizeType'                : 'required|in:transfer,burn',
		'controller.finalizeTransferAddressType' : [
			{ required_if: ['controller.finalizeType', 'transfer'] },
			`in:${allocationsTypes}`,
			'not_in:ico'
		]
	}
	
	const configValidation = new Validator(config, configValidationSchema)
	
	if (configValidation.fails()) {
		
		const configValidationErrors = configValidation.errors.all()
		
		throw Error(`There are an errors in the deployment configuration file!
			
			${JSON.stringify(configValidationErrors)}
			
		`)
	}
	
	return config
}
