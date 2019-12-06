const path = require('path');
const TerserJSPlugin = require('terser-webpack-plugin');
const OptimizeCSSAssetsPlugin = require('optimize-css-assets-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
	mode: 'development',
	entry: './src/index.ts',
	devtool: 'source-map',
	devServer: {
		contentBase: './dist',
		hot: true,
		proxy: {
			'/WebMap/*': {
				target: 'http://localhost:80',
				changeOrigin: true,
				secure: false
			},
			'/external-settings.js': { // or create your own file external-settings.js in public folder
				target: 'http://localhost:80/WebMap/App/ExternalSettings/Tracker-12.js',
				changeOrigin: true,
				secure: false
			}
		}
	},
	resolve: {
		extensions: ['.ts', '.js'],
	},
	output: {
		filename: 'bundle.js',
		path: path.resolve(__dirname, 'dist'),
	},
	module: {
		rules: [
			{
				test: /\.tsx?$/,
				use: 'ts-loader',
				exclude: /node_modules/,
			},
			{
				test: /\.(sa|sc|c)ss$/,
				use: [
					{
						loader: MiniCssExtractPlugin.loader,
						options: {
							hmr: true
						},
					},
					'css-loader',
					'sass-loader',
				],
			},
			{
				test: /\.(ttf|eot|svg|gif|png|jpg)(\?v=[0-9]\.[0-9]\.[0-9])?$/,
				use: [{
					loader: 'file-loader'
				}]
			}
		],
	},
	optimization: {
		minimizer: [new TerserJSPlugin({}), new OptimizeCSSAssetsPlugin({})],
	},
	plugins: [
		new MiniCssExtractPlugin({
			filename: '[name].css',
			chunkFilename: '[id].css',
			ignoreOrder: false,
		}),
		new HtmlWebpackPlugin({
			hash: true,
			template: './src/index.html',
			filename: './index.html'
		})
	]
};