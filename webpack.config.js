// 191. webpack.config.js
const path = require('path');
const nodeExternals = require('webpack-node-externals');
const { RunScriptWebpackPlugin } = require('run-script-webpack-plugin');
const TsconfigPathsPlugin = require('tsconfig-paths-webpack-plugin');

module.exports = function (options, webpack) {
  return {
    ...options,
    entry: ['webpack/hot/poll?100', options.entry],
    externals: [
      nodeExternals({
        allowlist: ['webpack/hot/poll?100'],
      }),
    ],
    module: {
      rules: [
        {
          test: /.tsx?$/,
          use: 'ts-loader',
          exclude: /node_modules/,
        },
      ],
    },
    plugins: [
      ...options.plugins,
      new webpack.HotModuleReplacementPlugin(),
      new webpack.WatchIgnorePlugin({
        paths: [/\.js$/, /\.d\.ts$/],
      }),
      new RunScriptWebpackPlugin({ name: options.output.filename, autoRestart: false }),
    ],
    resolve: {
      extensions: ['.tsx', '.ts', '.js'],
      plugins: [new TsconfigPathsPlugin({ configFile: './tsconfig.json' })],
      alias: {
        '@config': path.resolve(__dirname, 'src/config'),
        '@shared': path.resolve(__dirname, 'src/shared'),
        '@domain': path.resolve(__dirname, 'src/domain'),
        '@infrastructure': path.resolve(__dirname, 'src/infrastructure'),
        '@helpers': path.resolve(__dirname, 'src/helpers'),
        '@libs': path.resolve(__dirname, 'src/libs'),
        '@utils': path.resolve(__dirname, 'src/shared/utils'),
        '@filters': path.resolve(__dirname, 'src/shared/filters'),
        '@middlewares': path.resolve(__dirname, 'src/shared/middlewares'),
        '@interceptors': path.resolve(__dirname, 'src/shared/interceptors'),
        '@decorators': path.resolve(__dirname, 'src/shared/decorators'),
        '@exceptions': path.resolve(__dirname, 'src/shared/exceptions'),
        '@pipes': path.resolve(__dirname, 'src/shared/pipes'),
        '@interfaces': path.resolve(__dirname, 'src/shared/interfaces'),
        '@constants': path.resolve(__dirname, 'src/shared/constants'),
      },
    },
  };
};
