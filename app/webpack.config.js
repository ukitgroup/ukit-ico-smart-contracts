const path = require('path')

const HtmlWebPackPlugin = require("html-webpack-plugin")

module.exports = {
	resolve : {
		alias : {
			Utils : path.resolve(__dirname, '../utils'),
			Contracts : path.resolve(__dirname, '../build/contracts'),
		}
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
		})
	],
	
	devServer : {
		host : '0.0.0.0',
		port : 9999
	}
}
