import path from 'node:path';
import { vi, beforeAll, afterAll, describe, it, expect } from 'vitest';

import { readTextFileSync } from '../../helpers/safeTestFilesystem';

interface VitePlugin {
  name: string;
  transformIndexHtml?: (html: string) => string;
  configureServer?: (server: unknown) => void | (() => void);
  resolveId?: (source: string) => unknown;
}

interface ViteConfig {
  base: string;
  publicDir: string;
  define: Record<string, string>;
  plugins: VitePlugin[];
  resolve: {
    alias: Record<string, string>;
  };
  css: {
    preprocessorOptions: {
      scss: {
        loadPaths: string[];
        quietDeps: boolean;
        silenceDeprecations: string[];
      };
    };
  };
  server: {
    port: number;
    open: boolean;
  };
  build: {
    outDir: string;
    emptyOutDir: boolean;
    sourcemap: boolean;
    rolldownOptions: {
      input: Record<string, string>;
      output: {
        entryFileNames: string;
        chunkFileNames: string;
        assetFileNames: (assetInfo: {
          name?: string;
          names?: string[];
        }) => string;
        codeSplitting: {
          groups: Array<{
            name: string;
            test: RegExp;
          }>;
        };
      };
    };
  };
}

let config: ViteConfig;
let configFn: (env: { command: string; mode: string }) => ViteConfig;
const previousTestEnvironment = new Map<string, string | undefined>();
const repositoryRoot = path.resolve(import.meta.dirname, '../../..');
const readEnv = (key: string): string | undefined =>
  Reflect.get(process.env, key) as string | undefined;
const writeEnv = (key: string, value: string): void => {
  Reflect.set(process.env, key, value);
};
const deleteEnv = (key: string): void => {
  Reflect.deleteProperty(process.env, key);
};

const migrationDesign = readTextFileSync(
  path.join(repositoryRoot, 'docs/specs/2026-10-20-webpack-to-vite-design.md'),
  repositoryRoot
);
const legacyToViteMapping = [
  ...migrationDesign.matchAll(/^\|\s*`([^`]+)`\s*\|\s*(.*?)\s*\|$/gmu),
].map(([, legacyName, viteName]) => ({
  legacyName,
  viteName: viteName?.replaceAll('`', ''),
}));
const viteEnvironmentNames = legacyToViteMapping
  .map(({ viteName }) => viteName)
  .filter((name) => name?.startsWith('VITE_'));
const envSource = readTextFileSync(
  path.join(repositoryRoot, 'ClientApp/src/env.ts'),
  repositoryRoot
);
const tsconfig = JSON.parse(
  readTextFileSync(path.join(repositoryRoot, 'tsconfig.json'), repositoryRoot)
) as { exclude: string[] };
const CLIENT_ID_WITH_REPLACEMENT_TOKENS = "literal-$&-$'-$`";
const ESCAPED_CLIENT_ID = 'literal-$&amp;-$&#39;-$`';
const TEST_ENVIRONMENT = {
  VITE_B2C_CLIENTID: CLIENT_ID_WITH_REPLACEMENT_TOKENS,
  VITE_B2C_AUTHORITY: 'test-authority',
  VITE_B2C_KNOWN_AUTHORITIES: 'test-known',
  VITE_B2C_POST_LOGOUT_REDIRECT_URL: 'test-logout',
  VITE_B2C_READ_SCOPE: 'test-read',
  VITE_B2C_USER_IMPERSONATION_SCOPE: 'test-impersonation',
  VITE_B2C_REDIRECT_URL: 'test-redirect',
  VITE_EXTERNAL_REDIRECT_URL: 'test-external',
  VITE_APPINSIGHTS_INSTRUMENTATIONKEY: 'test-insights',
  VITE_APPINSIGHTS_CONN_STRING: 'test-conn',
  VITE_GA_TRACKINGID: 'test-ga',
  VITE_ENVIRONMENT: 'development',
};
const ENVIRONMENT_TEMPLATE_HTML = [
  '<%= VITE_B2C_CLIENTID %>',
  '<%= VITE_B2C_AUTHORITY %>',
  '<%= VITE_B2C_KNOWN_AUTHORITIES %>',
  '<%= VITE_B2C_POST_LOGOUT_REDIRECT_URL %>',
  '<%= VITE_B2C_READ_SCOPE %>',
  '<%= VITE_B2C_USER_IMPERSONATION_SCOPE %>',
  '<%= VITE_B2C_REDIRECT_URL %>',
  '<%= VITE_EXTERNAL_REDIRECT_URL %>',
  '<%= VITE_APPINSIGHTS_INSTRUMENTATIONKEY %>',
  '<%= VITE_APPINSIGHTS_CONN_STRING %>',
  '<%= VITE_GA_TRACKINGID %>',
  '<%= VITE_ENVIRONMENT %>',
].join('\n');

beforeAll(async () => {
  for (const [key, value] of Object.entries(TEST_ENVIRONMENT)) {
    previousTestEnvironment.set(key, readEnv(key));
    writeEnv(key, value);
  }
  const mod = await import('../../../vite.config.mts');
  configFn = mod.default as (env: {
    command: string;
    mode: string;
  }) => ViteConfig;
  config = configFn({ command: 'serve', mode: 'development' });
});

afterAll(() => {
  for (const [key, value] of previousTestEnvironment) {
    if (value === undefined) deleteEnv(key);
    else writeEnv(key, value);
  }
});

describe('vite config', () => {
  it('makes the root base and output cleanup explicit', () => {
    expect(config.base).toBe('/');
    expect(config.build.outDir).toBe('dist');
    expect(config.build.emptyOutDir).toBe(true);
  });

  it('defines the Vite environment contract for application code', () => {
    expect(config.define['import.meta.env.VITE_ENVIRONMENT']).toBe(
      JSON.stringify('development')
    );
  });

  it('serves static assets from ClientApp/public', () => {
    expect(config.publicDir).toBe('ClientApp/public');
  });

  it('resolves the @ alias to ClientApp/src', () => {
    expect(config.resolve.alias['@']).toMatch(/ClientApp[\\/]src$/);
  });

  it('blocks legacy generated and vendor paths from application imports', () => {
    const blockedPathsPlugin = config.plugins.find(
      (plugin) => plugin.name === 'blocked-generated-paths'
    );

    expect(blockedPathsPlugin).toBeDefined();
    expect(() => blockedPathsPlugin?.resolveId?.('ClientApp/src/main')).toThrow(
      /blocked/i
    );
    expect(() =>
      blockedPathsPlugin?.resolveId?.(
        'ClientApp/src/parent/node_modules/module'
      )
    ).toThrow(/blocked/i);
    expect(() =>
      blockedPathsPlugin?.resolveId?.('ClientApp/src/external/vendor')
    ).toThrow(/blocked/i);
    expect(blockedPathsPlugin?.resolveId?.('@/components/Button')).toBeNull();
  });

  it('preserves the TypeScript exclusion policy for generated and vendored code', () => {
    expect(tsconfig.exclude).toEqual([
      'ClientApp/src/api/web-api-client.ts',
      'ClientApp/src/parent/node_modules',
      'ClientApp/src/parent/packages',
      'ClientApp/src/external',
      'ClientApp/source-map-http-downloads',
      'ClientApp/webpack',
      'node_modules',
      'dist',
      'storybook-static',
    ]);
  });

  it('configures SCSS with deprecation silencing and node_modules load path', () => {
    const scss = config.css.preprocessorOptions.scss;

    expect(scss.quietDeps).toBe(true);
    expect(scss.silenceDeprecations).toEqual([
      'import',
      'global-builtin',
      'color-functions',
      'if-function',
    ]);
    expect(scss.loadPaths).toEqual([expect.stringContaining('node_modules')]);
  });

  it('defines both HTML entry points for multi-page build', () => {
    const input = config.build.rolldownOptions.input;

    expect(input['main']).toMatch(/index\.html$/);
    expect(input['redirect']).toMatch(/redirect\.html$/);
  });

  it('keeps the redirect entry as a separate hashed output contract', () => {
    const { input, output } = config.build.rolldownOptions;

    expect(Object.keys(input)).toEqual(['main', 'redirect']);
    expect(input['redirect']).toMatch(/redirect\.html$/);
    expect(output.entryFileNames).toBe('js/[name].[hash:8].js');
    expect(output.chunkFileNames).toBe('js/[name].[hash:8].js');
  });

  it('produces hashed output in the js/ and assets/ directories', () => {
    const output = config.build.rolldownOptions.output;

    expect(output.entryFileNames).toContain('[hash');
    expect(output.chunkFileNames).toContain('[hash');
    expect(output.assetFileNames).toBeTypeOf('function');
  });

  it('routes generated assets to compatibility directories', () => {
    const assetFileNames = config.build.rolldownOptions.output.assetFileNames;

    expect(assetFileNames({ name: 'main.css' })).toBe(
      'css/[name].[hash:8][extname]'
    );
    expect(assetFileNames({ name: 'logo.svg' })).toBe('images/[name][extname]');
    expect(assetFileNames({ name: 'brand.woff2' })).toBe(
      'fonts/[name][extname]'
    );
    expect(assetFileNames({ name: 'NMI-tile.png' })).toBe(
      'assets/[name].[hash:8][extname]'
    );
  });

  it('generates source maps for production builds', () => {
    expect(config.build.sourcemap).toBe(true);
  });

  it('splits vendor dependencies into focused Rolldown groups', () => {
    const output = config.build.rolldownOptions.output;
    const groups = output.codeSplitting.groups;

    expect(output).not.toHaveProperty('manualChunks');
    expect(groups.map(({ name }) => name)).toEqual([
      'react-runtime',
      'auth',
      'forms',
      'ui',
      'utilities',
    ]);

    const matches = (groupName: string, moduleId: string) =>
      groups.find(({ name }) => name === groupName)?.test.test(moduleId);

    expect(matches('react-runtime', '/node_modules/react/index.js')).toBe(true);
    expect(matches('react-runtime', '/node_modules/react-dom/client.js')).toBe(
      true
    );
    expect(
      matches('react-runtime', '/node_modules/react-router/index.js')
    ).toBe(true);
    expect(matches('auth', '/node_modules/@azure/msal-react/index.js')).toBe(
      true
    );
    expect(matches('forms', '/node_modules/formik/index.js')).toBe(true);
    expect(matches('forms', '/node_modules/yup/index.js')).toBe(true);
    expect(matches('ui', '/node_modules/react-bootstrap/index.js')).toBe(true);
    expect(matches('utilities', '/node_modules/lodash/get.js')).toBe(true);
    expect(matches('utilities', '/node_modules/date-fns/index.js')).toBe(true);
    expect(
      matches(
        'react-runtime',
        '/ClientApp/src/authentication/redirectBridge.ts'
      )
    ).toBe(false);
  });

  it('keeps the complete legacy-to-Vite mapping synchronized with the design', () => {
    expect(legacyToViteMapping).toEqual([
      { legacyName: 'REACT_APP_B2C_CLIENTID', viteName: 'VITE_B2C_CLIENTID' },
      { legacyName: 'REACT_APP_B2C_AUTHORITY', viteName: 'VITE_B2C_AUTHORITY' },
      {
        legacyName: 'REACT_APP_B2C_KNOWN_AUTHORITIES',
        viteName: 'VITE_B2C_KNOWN_AUTHORITIES',
      },
      {
        legacyName: 'REACT_APP_B2C_POST_LOGOUT_REDIRECT_URL',
        viteName: 'VITE_B2C_POST_LOGOUT_REDIRECT_URL',
      },
      {
        legacyName: 'REACT_APP_B2C_READ_SCOPE',
        viteName: 'VITE_B2C_READ_SCOPE',
      },
      {
        legacyName: 'REACT_APP_B2C_USER_IMPERSONATION_SCOPE',
        viteName: 'VITE_B2C_USER_IMPERSONATION_SCOPE',
      },
      {
        legacyName: 'REACT_APP_B2C_REDIRECT_URL',
        viteName: 'VITE_B2C_REDIRECT_URL',
      },
      {
        legacyName: 'EXTERNAL_REDIRECT_URL',
        viteName: 'VITE_EXTERNAL_REDIRECT_URL',
      },
      {
        legacyName: 'REACT_APP_APPINSIGHTS_INSTRUMENTATIONKEY',
        viteName: 'VITE_APPINSIGHTS_INSTRUMENTATIONKEY',
      },
      {
        legacyName: 'REACT_APP_APPINSIGHTS_CONN_STRING',
        viteName: 'VITE_APPINSIGHTS_CONN_STRING',
      },
      { legacyName: 'REACT_APP_GA_TRACKINGID', viteName: 'VITE_GA_TRACKINGID' },
      { legacyName: 'REACT_APP_ENVIRONMENT', viteName: 'VITE_ENVIRONMENT' },
      {
        legacyName: 'process.env.NODE_ENV',
        viteName: 'import.meta.env.MODE / DEV / PROD',
      },
    ]);

    for (const viteName of viteEnvironmentNames) {
      expect(envSource).toContain(`import.meta.env.${viteName}`);
    }
  });

  it('includes the env template plugin for EJS variable injection', () => {
    const envPlugin = config.plugins.find(
      (plugin) => plugin.name === 'env-template'
    );

    expect(envPlugin).toBeDefined();
    expect(envPlugin?.transformIndexHtml).toEqual(expect.any(Function));

    const result = envPlugin?.transformIndexHtml?.('<%= VITE_B2C_CLIENTID %>');

    expect(result !== undefined).toBe(true);
    expect(result === ESCAPED_CLIENT_ID).toBe(true);
  });

  it('includes the MSAL redirect CSP plugin for dev server', () => {
    const cspPlugin = config.plugins.find(
      (plugin) => plugin.name === 'msal-redirect-csp'
    );

    expect(cspPlugin).toBeDefined();
    expect(cspPlugin?.configureServer).toEqual(expect.any(Function));
  });

  it('passes configured environment variables through the template plugin', () => {
    const envPlugin = config.plugins.find(
      (plugin) => plugin.name === 'env-template'
    );

    const transformedHtml = envPlugin?.transformIndexHtml?.(
      ENVIRONMENT_TEMPLATE_HTML
    );

    for (const [key, value] of Object.entries(TEST_ENVIRONMENT)) {
      const containsPlaceholder =
        transformedHtml?.includes(`<%= ${key} %>`) ?? false;
      const expectedValue =
        key === 'VITE_B2C_CLIENTID' ? ESCAPED_CLIENT_ID : value;
      const containsConfiguredValue =
        transformedHtml?.includes(expectedValue) ?? false;

      expect(containsPlaceholder).toBe(false);
      expect(containsConfiguredValue).toBe(true);
    }
  });

  it('preserves explicit environment values for PoC builds', () => {
    const buildConfig = configFn({
      command: 'build',
      mode: 'production',
    });
    const envPlugin = buildConfig.plugins.find(
      (plugin) => plugin.name === 'env-template'
    );

    expect(envPlugin?.transformIndexHtml?.('<%= VITE_B2C_AUTHORITY %>')).toBe(
      'test-authority'
    );
  });

  it('substitutes VITE_ENVIRONMENT and defaults it for development serve mode', () => {
    const serveConfig = configFn({ command: 'serve', mode: 'development' });
    const envPlugin = serveConfig.plugins.find(
      (plugin) => plugin.name === 'env-template'
    );

    expect(envPlugin?.transformIndexHtml?.('<%= VITE_ENVIRONMENT %>')).toBe(
      'development'
    );

    writeEnv('VITE_ENVIRONMENT', 'production');
    const explicitConfig = configFn({ command: 'build', mode: 'production' });
    const explicitEnvPlugin = explicitConfig.plugins.find(
      (plugin) => plugin.name === 'env-template'
    );

    expect(
      explicitEnvPlugin?.transformIndexHtml?.('<%= VITE_ENVIRONMENT %>')
    ).toBe('production');

    writeEnv('VITE_ENVIRONMENT', TEST_ENVIRONMENT.VITE_ENVIRONMENT);
  });

  it('uses development defaults only for serve mode and requires production environment input', () => {
    const requiredKeys = Object.keys(TEST_ENVIRONMENT);
    const previous = new Map(requiredKeys.map((key) => [key, readEnv(key)]));

    try {
      for (const [key, value] of Object.entries(TEST_ENVIRONMENT)) {
        writeEnv(key, value);
      }
      deleteEnv('VITE_ENVIRONMENT');
      deleteEnv('STORYBOOK_BUILD');

      const serveConfig = configFn({
        command: 'serve',
        mode: 'development',
      });
      const envPlugin = serveConfig.plugins.find(
        (plugin) => plugin.name === 'env-template'
      );

      expect(envPlugin?.transformIndexHtml?.('<%= VITE_ENVIRONMENT %>')).toBe(
        'development'
      );
      expect(() => configFn({ command: 'build', mode: 'production' })).toThrow(
        /VITE_ENVIRONMENT/i
      );
      expect(() => configFn({ command: 'build', mode: 'staging' })).toThrow(
        /VITE_ENVIRONMENT/i
      );
      expect(() => configFn({ command: 'build', mode: 'development' })).toThrow(
        /VITE_ENVIRONMENT/i
      );
    } finally {
      for (const [key, value] of previous) {
        if (value === undefined) deleteEnv(key);
        else writeEnv(key, value);
      }
      for (const [key, value] of Object.entries(TEST_ENVIRONMENT)) {
        writeEnv(key, value);
      }
    }
  });

  it('sets the MSAL redirect bridge CSP headers for redirect.html requests', () => {
    const cspPlugin = config.plugins.find(
      (plugin) => plugin.name === 'msal-redirect-csp'
    );

    const setHeader = vi.fn();
    const response = {
      setHeader,
      removeHeader: vi.fn(),
    };
    const next = vi.fn();

    const middlewares = {
      use: vi.fn(),
    };
    const server = { middlewares };

    const postConfigure = cspPlugin?.configureServer?.(server);

    expect(postConfigure).toEqual(expect.any(Function));

    postConfigure?.();

    expect(middlewares.use).toHaveBeenCalledWith(expect.any(Function));

    const middleware = middlewares.use.mock.calls[0]?.[0] as (
      req: { url?: string },
      res: typeof response,
      cb: typeof next
    ) => void;

    middleware({ url: '/redirect.html?code=redacted' }, response, next);

    response.setHeader('Cache-Control', 'no-cache');

    expect(setHeader).toHaveBeenCalledWith('Cache-Control', 'no-store');
    expect(setHeader.mock.lastCall).toEqual(['Cache-Control', 'no-store']);
    expect(setHeader).toHaveBeenCalledWith(
      'Content-Security-Policy',
      "default-src 'none'; script-src 'self'; base-uri 'none'; form-action 'none'; object-src 'none'; frame-ancestors 'self'"
    );
    expect(response.removeHeader).toHaveBeenCalledWith(
      'Cross-Origin-Opener-Policy'
    );
    expect(next).toHaveBeenCalledWith();

    setHeader.mockClear();
    response.removeHeader.mockClear();
    next.mockClear();
    middleware({ url: '/index.html' }, response, next);

    expect(setHeader).not.toHaveBeenCalled();
    expect(response.removeHeader).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledTimes(1);
  });
});
