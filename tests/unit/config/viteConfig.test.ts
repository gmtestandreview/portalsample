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
  repositoryRoot,
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
  repositoryRoot,
);

const tsconfig = JSON.parse(
  readTextFileSync(path.join(repositoryRoot, 'tsconfig.json'), repositoryRoot),
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
    expect.assertions(3);
    expect(config.base).toBe('/');
    expect(config.build.outDir).toBe('dist');
    expect(config.build.emptyOutDir).toBe(true);
  });
});

describe('vite config', () => {
  it('defines the Vite environment contract for application code', () => {
    expect.assertions(1);
    expect(config.define['import.meta.env.VITE_ENVIRONMENT']).toBe(
      JSON.stringify('development'),
    );
  });
});

describe('vite config', () => {
  it('serves static assets from ClientApp/public', () => {
    expect.assertions(1);
    expect(config.publicDir).toBe('ClientApp/public');
  });
});
