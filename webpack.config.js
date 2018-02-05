const webpack = require('webpack');
const path = require('path');

module.exports = [
	{
		entry: './src/jslib.js',
		target: 'web',
		output: {
			path: path.resolve(__dirname, 'dist'),
			filename: 'fengari_interop.js',
			libraryTarget: 'global'
		},
		module: {
			rules: [
				{
					test: [/\.js$/],
					loader: 'babel-loader',
					options: {
						presets: [['env', {
							"targets": {
								"browsers": ["last 2 versions", "safari >= 7"]
							}
						}]]
					}
				}
			]
		},
		externals: {
			'fengari': 'fengari'
		},
		plugins: [
			new webpack.DefinePlugin({
				'typeof process': JSON.stringify('undefined')
			})
		]
	}
];
