const webpack = require('webpack');
const path = require('path');
const MinifyPlugin = require('babel-minify-webpack-plugin');

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
			'fengari': 'fengari'
		},
		plugins: [
			new webpack.DefinePlugin({
				'typeof process': JSON.stringify('undefined')
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
			'fengari': 'fengari'
		},
		plugins: [
			new webpack.DefinePlugin({
				'typeof process': JSON.stringify('undefined')
			}),
			new MinifyPlugin()
		]
	}
];
