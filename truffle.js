const fs             = require('fs')
const merge          = require('lodash.merge')
const configDefaults = require('./truffle.js.default')


/**
 * Reading of config directory
 * @param  {String} configSection config section/dir name
 * @return {Array}
 */
const readConfigDir = configSection => (
	fs.readdirSync(`./config/${configSection}`)
		.filter ( file => /\.js/.test(file) )
		.map    ( file => file.replace(/\.js$/i, '') )
)


/**
 * Building part of config
 * @param  {String} configSection         config section/dir name
 * @param  {Object} configSectionDefaults config section defaults
 * @return {Object}
 */
const buildConfigPart = (configSection, configSectionDefaults) => (
	readConfigDir(configSection).reduce(
		(configPart, key) => {
			configPart[configSection][key] = merge(
				{},
				configSectionDefaults,
				require(`./config/${configSection}/${key}`)
			)
			return configPart
		},
		{
			[configSection] : {}
		}
	)
)


const configAssigned = merge(
	{},
	configDefaults,
	buildConfigPart('networks', configDefaults.rpc)
)

module.exports = configAssigned
