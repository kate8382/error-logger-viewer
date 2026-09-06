const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const apiProxyTarget = process.env.API_PROXY_TARGET || 'http://localhost:3000';
const isCypress = !!process.env.CYPRESS_E2E;

module.exports = (env = {}) => ({
  mode: env.prod ? 'production' : 'development',
  entry: './frontend/src/scripts/main.ts',
  output: {
    filename: '[name].[contenthash].js',
    path: path.resolve(__dirname, 'frontend', 'dist'),
    clean: true,
  },
  module: {
    rules: [
      {
        test: /\.[jt]s$/,
        exclude: /(node_modules|bower_components)/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env', '@babel/preset-typescript'],
          },
        },
      },
      {
        test: /\.s?css$/i,
        use: env.prod ? [MiniCssExtractPlugin.loader, 'css-loader', 'sass-loader'] : ['style-loader', 'css-loader', 'sass-loader'],
      },
      {
        test: /\.(png|svg|jpg|jpeg|gif)$/i,
        type: 'asset/resource',
        generator: {
          filename: 'img/[name][ext]',
        },
      },
      {
        test: /\.(woff|woff2)$/i,
        type: 'asset/resource',
        generator: {
          filename: 'fonts/[name][ext]',
        },
      },
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: path.resolve(__dirname, 'frontend', 'src', 'index.html'),
      filename: 'index.html',
      inject: 'body',
    }),
    new MiniCssExtractPlugin({
      filename: 'style.[contenthash].css',
    }),
    new CopyWebpackPlugin({
      patterns: [
        { from: path.resolve(__dirname, 'frontend', 'src', 'assets', 'img'), to: 'img' },
        { from: path.resolve(__dirname, 'frontend', 'src', 'assets', 'fonts'), to: 'fonts' },
        { from: path.resolve(__dirname, 'frontend', 'src', 'assets', 'img', 'logo.png'), to: 'favicon.png' },
      ],
    }),
  ],
  resolve: {
    extensions: ['.ts', '.js'],
  },
  devServer: Object.assign({
    static: {
      directory: path.resolve(__dirname, 'frontend', 'dist'),
    },
    // historyApiFallback для поддержки SPA маршрутизации
    historyApiFallback: true,
    port: 8080,
    compress: true,
    host: '0.0.0.0',
    // Настройка прокси для API запросов к бэкенду, чтобы избежать проблем с CORS при разработке
    proxy: [
      {
        context: ['/errors', '/projects', '/users'],
        target: apiProxyTarget,
        changeOrigin: true,
      },
    ],
  }, isCypress ? {
    hot: false,
    client: false,
    allowedHosts: 'all',
    open: false,
  } : {
    hot: true,
    open: true,
  }),
});
