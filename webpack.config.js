const path = require('node:path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');
const sass = require('sass');

// ---------------------------------------------------------------------------
// Development env vars — these are injected into index.html at build time so
// the bundle reads them from window.* (see ClientApp/src/env.ts).
// In CI/production, supply real values via environment variables.
// ---------------------------------------------------------------------------
const devEnvVars = {
    REACT_APP_B2C_CLIENTID:                 process.env.REACT_APP_B2C_CLIENTID                 || 'dev-client-id',
    REACT_APP_B2C_AUTHORITY:                process.env.REACT_APP_B2C_AUTHORITY                || 'https://login.microsoftonline.com/common',
    REACT_APP_B2C_KNOWN_AUTHORITIES:        process.env.REACT_APP_B2C_KNOWN_AUTHORITIES        || 'login.microsoftonline.com',
    REACT_APP_B2C_POST_LOGOUT_REDIRECT_URL: process.env.REACT_APP_B2C_POST_LOGOUT_REDIRECT_URL || 'http://localhost:3000',
    REACT_APP_B2C_READ_SCOPE:               process.env.REACT_APP_B2C_READ_SCOPE               || 'openid',
    REACT_APP_B2C_USER_IMPERSONATION_SCOPE: process.env.REACT_APP_B2C_USER_IMPERSONATION_SCOPE || 'openid',
    REACT_APP_B2C_REDIRECT_URL:             process.env.REACT_APP_B2C_REDIRECT_URL             || 'http://localhost:3000',
    EXTERNAL_REDIRECT_URL:                  process.env.EXTERNAL_REDIRECT_URL                  || 'http://localhost:3000',
    REACT_APP_APPINSIGHTS_INSTRUMENTATIONKEY: process.env.REACT_APP_APPINSIGHTS_INSTRUMENTATIONKEY || '',
    REACT_APP_APPINSIGHTS_CONN_STRING:      process.env.REACT_APP_APPINSIGHTS_CONN_STRING      || 'dummy-key',
    REACT_APP_GA_TRACKINGID:                process.env.REACT_APP_GA_TRACKINGID                || '',
};

module.exports = function webpackConfig(env, argv) {
    const isProd = argv.mode === 'production';

    return {
        entry: './ClientApp/src/index.tsx',

        output: {
            path: path.resolve(__dirname, 'dist'),
            filename: isProd ? 'js/[name].[contenthash:8].js' : 'js/bundle.js',
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
                                    // quietDeps suppresses all deprecations from Bootstrap (a load-path dependency).
                                    // Remove quietDeps and the import/global-builtin/color-functions entries
                                    // when upgrading to Bootstrap 6 with @use support.
                                    quietDeps: true,
                                    silenceDeprecations: ['import', 'global-builtin', 'color-functions', 'if-function'],
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
                template: './index.html',
                templateParameters: devEnvVars,
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
        },

        devtool: isProd ? 'source-map' : 'cheap-module-source-map',

        performance: false,

        optimization: {
            splitChunks: isProd
                ? {
                      chunks: 'all',
                      cacheGroups: {
                          vendor: {
                              test: /[\\/]node_modules[\\/]/,
                              name: 'vendors',
                              chunks: 'all',
                          },
                      },
                  }
                : false,
        },
    };
};
