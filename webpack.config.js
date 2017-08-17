const path = require('path');
const BabiliPlugin = require("babili-webpack-plugin");

module.exports = [
	{
		entry: './src/jslib.js',
		target: 'web',
		output: {
			path: path.resolve(__dirname, 'dist'),
			filename: 'fengari_interop.js',
			library: 'fengari_interop'
		},
		externals: {
			"util": "util",
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
			library: 'fengari_interop'
		},
		externals: {
			"util": "util",
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
