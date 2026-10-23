import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv, type Plugin } from 'vite';
import type { DeprecationOrId } from 'sass';

const dirname = path.dirname(fileURLToPath(import.meta.url));
const RUNTIME_ENVIRONMENT_FILE = path.resolve(dirname, 'ClientApp/env.js');

const VITE_ENV_KEYS = [
  'VITE_B2C_CLIENTID',
  'VITE_B2C_AUTHORITY',
  'VITE_B2C_KNOWN_AUTHORITIES',
  'VITE_B2C_POST_LOGOUT_REDIRECT_URL',
  'VITE_B2C_READ_SCOPE',
  'VITE_B2C_USER_IMPERSONATION_SCOPE',
  'VITE_B2C_REDIRECT_URL',
  'VITE_EXTERNAL_REDIRECT_URL',
  'VITE_APPINSIGHTS_INSTRUMENTATIONKEY',
  'VITE_APPINSIGHTS_CONN_STRING',
  'VITE_GA_TRACKINGID',
  'VITE_ENVIRONMENT',
] as const;

const DEVELOPMENT_DEFAULTS: Readonly<Record<string, string>> = {
  VITE_B2C_CLIENTID: 'dev-client-id',
  VITE_B2C_AUTHORITY: 'https://login.microsoftonline.com/common',
  VITE_B2C_KNOWN_AUTHORITIES: 'login.microsoftonline.com',
  VITE_B2C_POST_LOGOUT_REDIRECT_URL: 'http://localhost:3000',
  VITE_B2C_READ_SCOPE: 'openid',
  VITE_B2C_USER_IMPERSONATION_SCOPE: 'openid',
  VITE_B2C_REDIRECT_URL: 'http://localhost:3000/redirect.html',
  VITE_EXTERNAL_REDIRECT_URL: 'http://localhost:3000',
  VITE_APPINSIGHTS_INSTRUMENTATIONKEY: '',
  VITE_APPINSIGHTS_CONN_STRING: 'dummy-key',
  VITE_GA_TRACKINGID: '',
  VITE_ENVIRONMENT: 'development',
};

function resolveEnvVars(mode: string, command: string): Record<string, string> {
  const loadedEnv = loadEnv(mode, dirname, '');
  const loadedEnvValues = new Map(Object.entries(loadedEnv));
  const developmentDefaults = new Map(Object.entries(DEVELOPMENT_DEFAULTS));
  const isDevelopment = command === 'serve';

  if (command === 'build' && !loadedEnvValues.get('VITE_ENVIRONMENT')) {
    throw new Error(
      'VITE_ENVIRONMENT must be provided explicitly for production builds'
    );
  }

  return Object.fromEntries(
    VITE_ENV_KEYS.map((key) => [
      key,
      loadedEnvValues.get(key) ??
        (isDevelopment ? developmentDefaults.get(key) : '') ??
        '',
    ])
  );
}

const HTML_ATTRIBUTE_ESCAPE_REPLACEMENTS = new Map([
  ['&', '&amp;'],
  ['"', '&quot;'],
  ["'", '&#39;'],
  ['<', '&lt;'],
  ['>', '&gt;'],
]);

const HTML_ATTRIBUTE_UNSAFE_CHARACTER_PATTERN = /[&"'<>]/gu;

function escapeHtmlAttributeCharacter(character: string): string {
  return HTML_ATTRIBUTE_ESCAPE_REPLACEMENTS.get(character) ?? character;
}

function escapeHtmlAttributeValue(value: string): string {
  return value.replace(
    HTML_ATTRIBUTE_UNSAFE_CHARACTER_PATTERN,
    escapeHtmlAttributeCharacter
  );
}

function replaceEnvironmentTemplates(
  html: string,
  envVars: Record<string, string>
): string {
  let transformedHtml = html;

  for (const [key, value] of Object.entries(envVars)) {
    transformedHtml = transformedHtml.replaceAll(`<%= ${key} %>`, () =>
      escapeHtmlAttributeValue(value)
    );
  }

  return transformedHtml;
}

type AssetInfo = {
  name?: string;
  names?: string[];
};

function assetFileNames(assetInfo: AssetInfo): string {
  const assetName = assetInfo.names?.[0] ?? assetInfo.name ?? '';
  const lowerCaseName = assetName.toLowerCase();

  if (lowerCaseName.endsWith('.css')) {
    return 'css/[name].[hash:8][extname]';
  }

  if (/\.(woff2?|eot|ttf|otf)$/u.test(lowerCaseName)) {
    return 'fonts/[name][extname]';
  }

  if (lowerCaseName.endsWith('.svg')) {
    return 'images/[name][extname]';
  }

  return 'assets/[name].[hash:8][extname]';
}

function envTemplatePlugin(envVars: Record<string, string>): Plugin {
  return {
    name: 'env-template',
    transformIndexHtml: (html) => replaceEnvironmentTemplates(html, envVars),
  };
}

function runtimeEnvironmentPlugin(command: 'build' | 'serve'): Plugin {
  const readRuntimeEnvironment = () =>
    readFileSync(RUNTIME_ENVIRONMENT_FILE, 'utf8');

  return {
    name: 'runtime-environment',
    transformIndexHtml: {
      order: 'post',
      handler: (html, context) => {
        if (command !== 'build' || !context.filename.endsWith('index.html')) {
          return;
        }

        return {
          html,
          tags: [
            {
              tag: 'script',
              attrs: { src: '/env.js' },
              injectTo: 'head-prepend',
            },
          ],
        };
      },
    },
    generateBundle() {
      if (command !== 'build') {
        return;
      }

      this.emitFile({
        type: 'asset',
        fileName: 'env.js',
        source: readRuntimeEnvironment(),
      });
    },
  };
}

const BLOCKED_RESOLUTION_PREFIXES = [
  'ClientApp/src/main',
  'ClientApp/src/parent/node_modules',
  'ClientApp/src/external',
];

function blockedGeneratedPathsPlugin(): Plugin {
  return {
    name: 'blocked-generated-paths',
    resolveId(source) {
      const normalizedSource = source.replaceAll('\\', '/');
      const isBlocked = BLOCKED_RESOLUTION_PREFIXES.some(
        (prefix) =>
          normalizedSource === prefix ||
          normalizedSource.startsWith(`${prefix}/`)
      );

      if (isBlocked) {
        throw new Error(`Blocked generated/vendor import: ${source}`);
      }

      return null;
    },
  };
}

const REDIRECT_BRIDGE_CSP =
  "default-src 'none'; script-src 'self'; base-uri 'none'; form-action 'none'; object-src 'none'; frame-ancestors 'self'";

function msalRedirectCspPlugin(): Plugin {
  return {
    name: 'msal-redirect-csp',
    configureServer(server) {
      return () => {
        server.middlewares.use((req, res, next) => {
          const requestPath = req.url?.split(/[?#]/u, 1)[0];
          if (requestPath === '/redirect.html') {
            const originalSetHeader = res.setHeader.bind(res);
            res.setHeader = ((name, value) => {
              if (
                typeof name === 'string' &&
                name.toLowerCase() === 'cache-control'
              ) {
                return originalSetHeader('Cache-Control', 'no-store');
              }

              return originalSetHeader(name, value);
            }) as typeof res.setHeader;
            res.setHeader('Cache-Control', 'no-store');
            res.setHeader('Content-Security-Policy', REDIRECT_BRIDGE_CSP);
            res.removeHeader('Cross-Origin-Opener-Policy');
          }
          next();
        });
      };
    },
  };
}

const sassDeprecationsToSilence: DeprecationOrId[] = [
  'import',
  'global-builtin',
  'color-functions',
  'if-function',
];

export default defineConfig(({ command, mode }) => {
  const envVars = resolveEnvVars(mode, command);
  const envValues = new Map(Object.entries(envVars));
  const define = Object.fromEntries(
    VITE_ENV_KEYS.map((key) => [
      `import.meta.env.${key}`,
      JSON.stringify(envValues.get(key)),
    ])
  );

  return {
    base: '/',
    publicDir: 'ClientApp/public',
    define,

    plugins: [
      react(),
      blockedGeneratedPathsPlugin(),
      envTemplatePlugin(envVars),
      runtimeEnvironmentPlugin(command),
      msalRedirectCspPlugin(),
    ],

    resolve: {
      alias: {
        '@': path.resolve(dirname, 'ClientApp/src'),
      },
    },

    css: {
      preprocessorOptions: {
        scss: {
          loadPaths: [path.resolve(dirname, 'node_modules')],
          quietDeps: true,
          silenceDeprecations: sassDeprecationsToSilence,
        },
      },
    },

    server: {
      port: 3000,
      open: true,
    },

    modulePreload: {
      resolveDependencies: (
        filename: string,
        dependencies: string[],
        { hostId }: { hostId: string; hostType: 'html' | 'js' }
      ) => {
        if (
          hostId.endsWith('redirect.html') ||
          filename.includes('/redirect.')
        ) {
          return dependencies.filter((dependency) =>
            /\/(?:auth|rolldown-runtime|modulepreload-polyfill)\./u.test(
              dependency
            )
          );
        }

        return dependencies;
      },
    },

    build: {
      outDir: 'dist',
      emptyOutDir: true,
      sourcemap: true,
      rolldownOptions: {
        input: {
          main: path.resolve(dirname, 'index.html'),
          redirect: path.resolve(dirname, 'redirect.html'),
        },
        output: {
          entryFileNames: 'js/[name].[hash:8].js',
          chunkFileNames: 'js/[name].[hash:8].js',
          assetFileNames,
          codeSplitting: {
            groups: [
              {
                name: 'react-runtime',
                test: /node_modules[\\/](react|react-dom|react-router)[\\/]/,
              },
              {
                name: 'auth',
                test: /node_modules[\\/]@azure[\\/]/,
              },
              {
                name: 'forms',
                test: /node_modules[\\/](formik|yup)[\\/]/,
              },
              {
                name: 'ui',
                test: /node_modules[\\/]react-bootstrap[\\/]/,
              },
              {
                name: 'utilities',
                // Lodash remains a transitive runtime dependency of Formik and Slate.
                test: /node_modules[\\/](lodash|date-fns)[\\/]/,
              },
            ],
          },
        },
      },
    },
  };
});
