import { createRequire } from 'node:module';
import { vi } from 'vitest';

interface SassImplementation {
  info: string;
}

interface SassLoaderOptions {
  implementation: SassImplementation;
  api: string;
  sassOptions: {
    includePaths: string[];
    quietDeps: boolean;
    silenceDeprecations: string[];
  };
}

type LoaderEntry =
  | string
  | {
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
  entry: Record<string, string>;
  output: {
    filename: string;
  };
  devtool: string;
  optimization: {
    splitChunks:
      | false
      | {
          chunks: string | ((chunk: { name?: string }) => boolean);
          cacheGroups?: {
            vendor?: {
              chunks: string | ((chunk: { name?: string }) => boolean);
            };
          };
        };
  };
  module: {
    rules: ModuleRule[];
  };
  devServer: {
    setupMiddlewares: (...args: unknown[]) => unknown;
  };
  plugins: Array<{
    constructor: {
      name: string;
    };
    patterns?: Array<{
      from: string;
      to: string;
    }>;
    userOptions?: {
      templateParameters?: Record<string, string>;
    };
  }>;
}

type WebpackConfigFactory = (
  env: Record<string, unknown>,
  argv: { mode: string }
) => WebpackConfig;

const require = createRequire(import.meta.url);
const webpackConfigFactory =
  require('../../../webpack.config.js') as unknown as WebpackConfigFactory;

const isSassLoaderEntry = (entry: LoaderEntry): entry is SassLoaderEntry =>
  typeof entry !== 'string' &&
  entry.loader === 'sass-loader' &&
  entry.options !== undefined;

describe('webpack config', () => {
  it('uses development bundle and source-map settings', () => {
    const config = webpackConfigFactory({}, { mode: 'development' });

    expect(config.entry).toEqual({
      main: './ClientApp/src/index.tsx',
      redirect: './ClientApp/src/authentication/redirectBridge.ts',
    });
    expect(config.output.filename).toBe('js/[name].js');
    expect(config.devtool).toBe('cheap-module-source-map');
    expect(config.optimization.splitChunks).toBe(false);
    expect(config.devServer.setupMiddlewares).toEqual(expect.any(Function));
    expect(
      config.plugins.map((plugin) => plugin.constructor.name)
    ).not.toContain('MiniCssExtractPlugin');
  });

  it('adds bridge-only no-store and CSP headers in development', () => {
    const config = webpackConfigFactory({}, { mode: 'development' });
    expect(() => config.devServer.setupMiddlewares([], undefined)).toThrow(
      'webpack-dev-server is required for bridge headers'
    );
    const middlewares = config.devServer.setupMiddlewares([], {});
    const bridgePolicy = (
      middlewares as Array<{
        middleware: (
          request: { url?: string },
          response: {
            setHeader: (name: string, value: string) => void;
            removeHeader: (name: string) => void;
          },
          next: () => void
        ) => void;
      }>
    )[0];
    if (!bridgePolicy) {
      throw new Error('bridge policy middleware was not registered');
    }
    const response = {
      removeHeader: vi.fn(),
      setHeader: vi.fn(),
    };
    const next = vi.fn();

    bridgePolicy.middleware(
      { url: '/redirect.html?code=redacted' },
      response,
      next
    );

    expect(response.setHeader).toHaveBeenNthCalledWith(
      1,
      'Cache-Control',
      'no-store'
    );
    expect(response.setHeader).toHaveBeenNthCalledWith(
      2,
      'Content-Security-Policy',
      "default-src 'none'; script-src 'self'; base-uri 'none'; form-action 'none'; object-src 'none'; frame-ancestors 'self'"
    );
    expect(response.removeHeader).toHaveBeenCalledWith(
      'Cross-Origin-Opener-Policy'
    );
    expect(next).toHaveBeenCalled();

    response.setHeader.mockClear();
    response.removeHeader.mockClear();
    next.mockClear();
    bridgePolicy.middleware({ url: '/index.html' }, response, next);

    expect(response.setHeader).not.toHaveBeenCalled();
    expect(response.removeHeader).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('uses hashed production assets, source maps, and vendor splitting', () => {
    const config = webpackConfigFactory({}, { mode: 'production' });

    expect(config.output.filename).toBe('js/[name].[contenthash:8].js');
    expect(config.devtool).toBe('source-map');
    expect(config.optimization.splitChunks).toEqual(
      expect.objectContaining({
        chunks: expect.any(Function),
      })
    );
    if (config.optimization.splitChunks === false) {
      throw new Error('production splitChunks must be configured');
    }
    const chunkSelector = config.optimization.splitChunks.chunks;
    if (typeof chunkSelector !== 'function') {
      throw new Error('production splitChunks must select chunks by function');
    }
    expect(chunkSelector({ name: 'redirect' })).toBe(false);
    expect(chunkSelector({ name: 'main' })).toBe(true);
    const vendorSelector =
      config.optimization.splitChunks.cacheGroups?.vendor?.chunks;
    if (typeof vendorSelector !== 'function') {
      throw new Error('vendor splitChunks must select chunks by function');
    }
    expect(vendorSelector({ name: 'redirect' })).toBe(false);
    expect(config.plugins.map((plugin) => plugin.constructor.name)).toContain(
      'MiniCssExtractPlugin'
    );
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
      Object.keys(environment).map((key) => [key, process.env[key]])
    );

    Object.assign(process.env, environment);
    delete require.cache[configPath];

    try {
      const configuredFactory = require(
        configPath
      ) as unknown as WebpackConfigFactory;
      const config = configuredFactory({}, { mode: 'development' });
      const htmlPlugins = config.plugins.filter(
        (plugin) => plugin.constructor.name === 'HtmlWebpackPlugin'
      );

      expect(htmlPlugins).toHaveLength(2);
      expect(htmlPlugins[0]?.userOptions?.templateParameters).toEqual(
        environment
      );
      expect(htmlPlugins[1]?.userOptions?.templateParameters).toEqual({});
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

  it('copies application shell identity assets into production output', () => {
    const config = webpackConfigFactory({}, { mode: 'production' });
    const copyPlugin = config.plugins.find(
      (plugin) => plugin.constructor.name === 'CopyPlugin'
    );

    expect(copyPlugin?.patterns).toEqual([
      {
        from: expect.stringMatching(/ClientApp[\\/]public[\\/]favicon\.ico$/),
        to: 'favicon.ico',
      },
      {
        from: expect.stringMatching(/ClientApp[\\/]public[\\/]NMI-tile\.png$/),
        to: 'NMI-tile.png',
      },
    ]);
  });

  it('configures the SCSS rule to use Dart Sass via the modern API', () => {
    const config = webpackConfigFactory({}, { mode: 'production' });
    const scssRule = config.module.rules.find((rule) =>
      rule.test?.test('.scss')
    );
    const sassLoader = scssRule?.use?.find(isSassLoaderEntry);

    expect(scssRule).toBeDefined();
    expect(sassLoader).toBeDefined();
    expect(sassLoader?.options.implementation.info).toContain('dart-sass');
    expect(sassLoader?.options.api).toBe('modern');
    expect(sassLoader?.options.sassOptions.includePaths).toEqual([
      expect.stringContaining('node_modules'),
    ]);
    expect(sassLoader?.options.sassOptions.quietDeps).toBe(true);
    expect(sassLoader?.options.sassOptions.silenceDeprecations).toEqual([
      'import',
      'global-builtin',
      'color-functions',
      'if-function',
    ]);
  });
});
