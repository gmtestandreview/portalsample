const path = require('node:path');
const CopyPlugin = require('copy-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');
const sass = require('sass');

const sassDeprecationsToSilence = [
  'import',
  'global-builtin',
  'color-functions',
  'if-function',
];

const sassCompatibilityOptions = {
  // quietDeps suppresses deprecations from Bootstrap (a load-path dependency).
  // Remove this compatibility layer when Bootstrap 6 enables a complete @use migration.
  quietDeps: true,
  silenceDeprecations: sassDeprecationsToSilence,
};

const redirectBridgeContentSecurityPolicy =
  "default-src 'none'; script-src 'self'; base-uri 'none'; form-action 'none'; object-src 'none'; frame-ancestors 'self'";

// ---------------------------------------------------------------------------
// Development env vars — these are injected into index.html at build time so
// the bundle reads them from window.* (see ClientApp/src/env.ts).
// In CI/production, supply real values via environment variables.
// ---------------------------------------------------------------------------
const devEnvVars = {
  REACT_APP_B2C_CLIENTID: process.env.REACT_APP_B2C_CLIENTID || 'dev-client-id',
  REACT_APP_B2C_AUTHORITY:
    process.env.REACT_APP_B2C_AUTHORITY ||
    'https://login.microsoftonline.com/common',
  REACT_APP_B2C_KNOWN_AUTHORITIES:
    process.env.REACT_APP_B2C_KNOWN_AUTHORITIES || 'login.microsoftonline.com',
  REACT_APP_B2C_POST_LOGOUT_REDIRECT_URL:
    process.env.REACT_APP_B2C_POST_LOGOUT_REDIRECT_URL ||
    'http://localhost:3000',
  REACT_APP_B2C_READ_SCOPE: process.env.REACT_APP_B2C_READ_SCOPE || 'openid',
  REACT_APP_B2C_USER_IMPERSONATION_SCOPE:
    process.env.REACT_APP_B2C_USER_IMPERSONATION_SCOPE || 'openid',
  REACT_APP_B2C_REDIRECT_URL:
    process.env.REACT_APP_B2C_REDIRECT_URL ||
    'http://localhost:3000/redirect.html',
  EXTERNAL_REDIRECT_URL:
    process.env.EXTERNAL_REDIRECT_URL || 'http://localhost:3000',
  REACT_APP_APPINSIGHTS_INSTRUMENTATIONKEY:
    process.env.REACT_APP_APPINSIGHTS_INSTRUMENTATIONKEY || '',
  REACT_APP_APPINSIGHTS_CONN_STRING:
    process.env.REACT_APP_APPINSIGHTS_CONN_STRING || 'dummy-key',
  REACT_APP_GA_TRACKINGID: process.env.REACT_APP_GA_TRACKINGID || '',
};

module.exports = function webpackConfig(env, argv) {
  const isProd = argv.mode === 'production';

  return {
    entry: {
      main: './ClientApp/src/index.tsx',
      redirect: './ClientApp/src/authentication/redirectBridge.ts',
    },

    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: isProd ? 'js/[name].[contenthash:8].js' : 'js/[name].js',
      publicPath: '/',
      clean: true,
    },

    // Required for top-level await in ClientApp/src/index.tsx:13
    experiments: {
      topLevelAwait: true,
    },

    resolve: {
      extensions: ['.tsx', '.ts', '.js'],
      // Prevent webpack from resolving the generated vendor bundles
      alias: {
        'ClientApp/src/main': false,
        'ClientApp/src/parent/node_modules': false,
        'ClientApp/src/external': false,
      },
    },

    module: {
      rules: [
        {
          test: /\.tsx?$/,
          use: [
            {
              loader: 'ts-loader',
              options: {
                // Type checking is handled by ForkTsCheckerWebpackPlugin
                transpileOnly: true,
              },
            },
          ],
          exclude: [
            /node_modules/,
            /ClientApp\/src\/parent/,
            /ClientApp\/src\/external/,
            /ClientApp\/webpack/,
            /ClientApp\/source-map-http-downloads/,
          ],
        },
        {
          test: /\.scss$/,
          use: [
            isProd ? MiniCssExtractPlugin.loader : 'style-loader',
            'css-loader',
            {
              loader: 'sass-loader',
              options: {
                implementation: sass,
                api: 'modern',
                // Resolve ~ imports (e.g. @import '~bootstrap/scss/bootstrap')
                sassOptions: {
                  includePaths: [path.resolve(__dirname, 'node_modules')],
                  ...sassCompatibilityOptions,
                },
              },
            },
          ],
        },
        {
          test: /\.css$/,
          use: [
            isProd ? MiniCssExtractPlugin.loader : 'style-loader',
            'css-loader',
          ],
        },
        {
          test: /\.(woff2?|eot|ttf|otf)$/i,
          type: 'asset/resource',
          generator: {
            filename: 'fonts/[name][ext]',
          },
        },
        {
          test: /\.svg$/i,
          type: 'asset/resource',
          generator: {
            filename: 'images/[name][ext]',
          },
        },
      ],
    },

    plugins: [
      new HtmlWebpackPlugin({
        chunks: ['main'],
        template: './index.html',
        templateParameters: devEnvVars,
        // minimizer-webpack-plugin@5.9.0 passes an unsupported `as` option to
        // terser when minifying index.html's inline script, aborting the build.
        // minifyJS is disabled to avoid that crash; the other production defaults
        // html-webpack-plugin's `minify: 'auto'` would otherwise apply are kept.
        // Revisit when terser > 5.51.2 or minimizer-webpack-plugin drops the
        // unsupported `as` passthrough.
        minify: isProd
          ? {
              collapseWhitespace: true,
              removeComments: true,
              removeRedundantAttributes: true,
              removeScriptTypeAttributes: true,
              removeStyleLinkTypeAttributes: true,
              useShortDoctype: true,
              minifyCSS: true,
              minifyJS: false,
            }
          : false,
      }),

      new HtmlWebpackPlugin({
        chunks: ['redirect'],
        filename: 'redirect.html',
        inject: 'body',
        minify: false,
        publicPath: './',
        template: './redirect.html',
        templateParameters: {},
      }),

      new CopyPlugin({
        patterns: [
          {
            from: path.resolve(__dirname, 'ClientApp/public/favicon.ico'),
            to: 'favicon.ico',
          },
          {
            from: path.resolve(__dirname, 'ClientApp/public/NMI-tile.png'),
            to: 'NMI-tile.png',
          },
        ],
      }),

      new ForkTsCheckerWebpackPlugin({
        typescript: {
          configFile: path.resolve(__dirname, 'tsconfig.json'),
        },
      }),

      ...(isProd
        ? [
            new MiniCssExtractPlugin({
              filename: 'css/[name].[contenthash:8].css',
            }),
          ]
        : []),
    ],

    devServer: {
      port: 3000,
      open: true,
      hot: true,
      // Required for React Router v6 client-side routing — all 404s serve index.html
      historyApiFallback: true,
      static: {
        directory: path.resolve(__dirname, 'ClientApp/public'),
      },
      setupMiddlewares: (middlewares, server) => {
        if (!server) {
          throw new Error('webpack-dev-server is required for bridge headers');
        }

        middlewares.unshift({
          name: 'msal-redirect-bridge-policy',
          middleware: (request, response, next) => {
            const requestPath = request.url?.split(/[?#]/u, 1)[0];
            if (requestPath === '/redirect.html') {
              response.setHeader('Cache-Control', 'no-store');
              response.setHeader(
                'Content-Security-Policy',
                redirectBridgeContentSecurityPolicy
              );
              response.removeHeader('Cross-Origin-Opener-Policy');
            }
            next();
          },
        });

        return middlewares;
      },
    },

    devtool: isProd ? 'source-map' : 'cheap-module-source-map',

    performance: false,

    optimization: {
      splitChunks: isProd
        ? {
            chunks: (chunk) => chunk.name !== 'redirect',
            cacheGroups: {
              vendor: {
                test: /[\\/]node_modules[\\/]/,
                name: 'vendors',
                chunks: (chunk) => chunk.name !== 'redirect',
              },
            },
          }
        : false,
    },
  };
};
