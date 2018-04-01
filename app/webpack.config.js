const path = require('path')
const webpack = require('webpack')

const HtmlWebPackPlugin = require("html-webpack-plugin")

module.exports = {
	entry : './src/js/index.js',
	
	resolve : {
		alias : {
			Utils : path.resolve(__dirname, '../utils'),
			Contracts : path.resolve(__dirname, '../build/contracts'),
		},
		modules : [
			path.resolve(__dirname, "./src/js"),
			path.resolve(__dirname, "./src/scss"),
			"node_modules"
		]
	},
	
	module : {
		rules : [
			{
				test: /\.js$/,
				exclude: /node_modules/,
				use: {
					loader: "babel-loader"
				}
			},
			{
				test: /\.html$/,
				use: {
					loader: "html-loader"
				}
			},
			{
				test: /\.(scss|sass)$/,
				use: [{
					loader: "style-loader"
				}, {
					loader: "css-loader"
				}, {
					loader: "sass-loader"
				}]
			}
		]
	},
	
	plugins : [
		new HtmlWebPackPlugin({
			template : "./src/index.html",
			filename : "./index.html"
		}),
		new webpack.NamedModulesPlugin(),
		new webpack.HotModuleReplacementPlugin()
	],
	
	devServer : {
		host : '0.0.0.0',
		port : 9999,
		hot : true
	}
}
