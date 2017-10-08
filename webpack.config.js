const webpack = require('webpack');
const path = require('path');
const BabiliPlugin = require("babili-webpack-plugin");

module.exports = [
	{
		entry: './src/jslib.js',
		target: 'web',
		output: {
			path: path.resolve(__dirname, 'dist'),
			filename: 'fengari_interop.js',
			libraryTarget: 'global'
		},
		externals: {
			"fengari": "fengari"
		},
		plugins: [
			new webpack.DefinePlugin({
				WEB: JSON.stringify(true),
			})
		]
	},
	{
		entry: './src/jslib.js',
		target: 'web',
		output: {
			path: path.resolve(__dirname, 'dist'),
			filename: 'fengari_interop.min.js',
			libraryTarget: 'global'
		},
		externals: {
			"fengari": "fengari"
		},
		plugins: [
			new webpack.DefinePlugin({
				WEB: JSON.stringify(true),
			}),
			new BabiliPlugin()
		]
	}
];
