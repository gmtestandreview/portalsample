import { createRequire } from 'node:module';

interface SassImplementation {
    info: string;
}

interface SassLoaderOptions {
    implementation: SassImplementation;
    api: string;
    sassOptions: {
        includePaths: string[];
    };
}

type LoaderEntry = string | {
    loader?: string;
    options?: SassLoaderOptions;
};

interface SassLoaderEntry {
    loader: 'sass-loader';
    options: SassLoaderOptions;
}

interface ModuleRule {
    test?: RegExp;
    use?: LoaderEntry[];
}

interface WebpackConfig {
    entry: string;
    output: {
        filename: string;
    };
    devtool: string;
    optimization: {
        splitChunks: false | {
            chunks: string;
        };
    };
    module: {
        rules: ModuleRule[];
    };
    plugins: Array<{
        constructor: {
            name: string;
        };
        userOptions?: {
            templateParameters?: Record<string, string>;
        };
    }>;
}

type WebpackConfigFactory = (
    env: Record<string, unknown>,
    argv: { mode: string },
) => WebpackConfig;

const require = createRequire(import.meta.url);
const webpackConfigFactory = require('../../../webpack.config.js') as unknown as WebpackConfigFactory;

const isSassLoaderEntry = (entry: LoaderEntry): entry is SassLoaderEntry => (
    typeof entry !== 'string' && entry.loader === 'sass-loader' && entry.options !== undefined
);

describe('webpack config', () => {
    it('uses development bundle and source-map settings', () => {
        const config = webpackConfigFactory({}, { mode: 'development' });

        expect(config.entry).toBe('./ClientApp/src/index.tsx');
        expect(config.output.filename).toBe('js/bundle.js');
        expect(config.devtool).toBe('cheap-module-source-map');
        expect(config.optimization.splitChunks).toBe(false);
        expect(config.plugins.map((plugin) => plugin.constructor.name)).not.toContain('MiniCssExtractPlugin');
    });

    it('uses hashed production assets, source maps, and vendor splitting', () => {
        const config = webpackConfigFactory({}, { mode: 'production' });

        expect(config.output.filename).toBe('js/[name].[contenthash:8].js');
        expect(config.devtool).toBe('source-map');
        expect(config.optimization.splitChunks).toEqual(expect.objectContaining({
            chunks: 'all',
        }));
        expect(config.plugins.map((plugin) => plugin.constructor.name)).toContain('MiniCssExtractPlugin');
    });

    it('passes configured environment variables to the HTML template', () => {
        const configPath = require.resolve('../../../webpack.config.js');
        const environment = {
            REACT_APP_B2C_CLIENTID: 'configured-client',
            REACT_APP_B2C_AUTHORITY: 'configured-authority',
            REACT_APP_B2C_KNOWN_AUTHORITIES: 'configured-known-authority',
            REACT_APP_B2C_POST_LOGOUT_REDIRECT_URL: 'configured-logout',
            REACT_APP_B2C_READ_SCOPE: 'configured-read',
            REACT_APP_B2C_USER_IMPERSONATION_SCOPE: 'configured-impersonation',
            REACT_APP_B2C_REDIRECT_URL: 'configured-redirect',
            EXTERNAL_REDIRECT_URL: 'configured-external',
            REACT_APP_APPINSIGHTS_INSTRUMENTATIONKEY: 'configured-insights-key',
            REACT_APP_APPINSIGHTS_CONN_STRING: 'configured-insights-connection',
            REACT_APP_GA_TRACKINGID: 'configured-ga',
        };
        const previous = Object.fromEntries(
            Object.keys(environment).map((key) => [key, process.env[key]]),
        );

        Object.assign(process.env, environment);
        delete require.cache[configPath];

        try {
            const configuredFactory = require(configPath) as unknown as WebpackConfigFactory;
            const config = configuredFactory({}, { mode: 'development' });
            const htmlPlugin = config.plugins.find(
                (plugin) => plugin.constructor.name === 'HtmlWebpackPlugin',
            );

            expect(htmlPlugin?.userOptions?.templateParameters).toEqual(environment);
        } finally {
            Object.entries(previous).forEach(([key, value]) => {
                if (value === undefined) {
                    delete process.env[key];
                } else {
                    process.env[key] = value;
                }
            });
            delete require.cache[configPath];
        }
    });

    it('configures the SCSS rule to use Dart Sass via the modern API', () => {
        const config = webpackConfigFactory({}, { mode: 'production' });
        const scssRule = config.module.rules.find((rule) => rule.test?.test('.scss'));
        const sassLoader = scssRule?.use?.find(isSassLoaderEntry);

        expect(scssRule).toBeDefined();
        expect(sassLoader).toBeDefined();
        expect(sassLoader?.options.implementation.info).toContain('dart-sass');
        expect(sassLoader?.options.api).toBe('modern');
        expect(sassLoader?.options.sassOptions.includePaths).toEqual([
            expect.stringContaining('node_modules'),
        ]);
    });
});
