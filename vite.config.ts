import path from 'node:path';
import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
import { defineConfig, type Plugin } from 'vite';
import type { DeprecationOrId } from 'sass';

const dirname = path.dirname(fileURLToPath(import.meta.url));

// ---------------------------------------------------------------------------
// Runtime env vars — injected into index.html so the bundle reads them from
// globalThis.* (see ClientApp/src/env.ts).
//
// `vite dev` falls back to safe dev defaults.
// `vite build` requires every non-optional key via process.env and fails fast
// if any are missing, so a production build never silently ships localhost
// values.
// ---------------------------------------------------------------------------
const ENV_VAR_KEYS = [
  'REACT_APP_B2C_CLIENTID',
  'REACT_APP_B2C_AUTHORITY',
  'REACT_APP_B2C_KNOWN_AUTHORITIES',
  'REACT_APP_B2C_POST_LOGOUT_REDIRECT_URL',
  'REACT_APP_B2C_READ_SCOPE',
  'REACT_APP_B2C_USER_IMPERSONATION_SCOPE',
  'REACT_APP_B2C_REDIRECT_URL',
  'EXTERNAL_REDIRECT_URL',
  'REACT_APP_APPINSIGHTS_INSTRUMENTATIONKEY',
  'REACT_APP_APPINSIGHTS_CONN_STRING',
  'REACT_APP_GA_TRACKINGID',
] as const;

const DEV_DEFAULTS: Readonly<Record<string, string>> = {
  REACT_APP_B2C_CLIENTID: 'dev-client-id',
  REACT_APP_B2C_AUTHORITY: 'https://login.microsoftonline.com/common',
  REACT_APP_B2C_KNOWN_AUTHORITIES: 'login.microsoftonline.com',
  REACT_APP_B2C_POST_LOGOUT_REDIRECT_URL: 'http://localhost:3000',
  REACT_APP_B2C_READ_SCOPE: 'openid',
  REACT_APP_B2C_USER_IMPERSONATION_SCOPE: 'openid',
  REACT_APP_B2C_REDIRECT_URL: 'http://localhost:3000/redirect.html',
  EXTERNAL_REDIRECT_URL: 'http://localhost:3000',
  REACT_APP_APPINSIGHTS_INSTRUMENTATIONKEY: '',
  REACT_APP_APPINSIGHTS_CONN_STRING: 'dummy-key',
  REACT_APP_GA_TRACKINGID: '',
};

const BUILD_OPTIONAL_KEYS = new Set([
  'REACT_APP_APPINSIGHTS_INSTRUMENTATIONKEY',
  'REACT_APP_GA_TRACKINGID',
]);

function resolveEnvVars(command: 'serve' | 'build'): Record<string, string> {
  const vars: Record<string, string> = {};
  let missing: string[] = [];

  for (const key of ENV_VAR_KEYS) {
    const envValue = process.env[key];
    if (envValue !== undefined) {
      vars[key] = envValue;
    } else if (command === 'serve') {
      vars[key] = DEV_DEFAULTS[key] ?? '';
    } else if (BUILD_OPTIONAL_KEYS.has(key)) {
      vars[key] = '';
    } else {
      missing = [...missing, key];
    }
  }

  if (missing.length > 0) {
    throw new Error(
      `[vite build] Missing required env vars: ${missing.join(', ')}. ` +
        'Set them in the environment or use `vite dev` for local development.'
    );
  }

  return vars;
}

const INLINE_SCRIPT_ESCAPE_REPLACEMENTS: Readonly<Record<string, string>> = {
  '\\': '\\\\',
  "'": "\\'",
  '<': '\\u003c',
  '>': '\\u003e',
  '&': '\\u0026',
  '\n': '\\n',
  '\r': '\\r',
  '\u2028': '\\u2028',
  '\u2029': '\\u2029',
};

const INLINE_SCRIPT_UNSAFE_CHARACTER_PATTERN = /[\\'<>&\n\r\u2028\u2029]/gu;

function escapeInlineScriptCharacter(character: string): string {
  return INLINE_SCRIPT_ESCAPE_REPLACEMENTS[character] ?? character;
}

function escapeInlineScriptValue(value: string): string {
  return value.replace(
    INLINE_SCRIPT_UNSAFE_CHARACTER_PATTERN,
    escapeInlineScriptCharacter
  );
}

function replaceEnvironmentTemplate(
  html: string,
  key: string,
  value: string
): string {
  const escapedValue = escapeInlineScriptValue(value);
  return html.replaceAll(`<%= ${key} %>`, () => escapedValue);
}

function replaceEnvironmentTemplates(
  html: string,
  envVars: Record<string, string>
): string {
  let transformedHtml = html;

  for (const [key, value] of Object.entries(envVars)) {
    transformedHtml = replaceEnvironmentTemplate(transformedHtml, key, value);
  }

  return transformedHtml;
}

function envTemplatePlugin(envVars: Record<string, string>): Plugin {
  return {
    name: 'env-template',
    transformIndexHtml: (html) => replaceEnvironmentTemplates(html, envVars),
  };
}

// ---------------------------------------------------------------------------
// MSAL redirect bridge CSP — mirrors the webpack-dev-server middleware that
// sets security headers for the redirect.html page.
// ---------------------------------------------------------------------------
const REDIRECT_BRIDGE_CSP =
  "default-src 'none'; script-src 'self'; base-uri 'none'; form-action 'none'; object-src 'none'; frame-ancestors 'self'";

function msalRedirectCspPlugin(): Plugin {
  return {
    name: 'msal-redirect-csp',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const requestPath = req.url?.split(/[?#]/u, 1)[0];
        if (requestPath === '/redirect.html') {
          res.setHeader('Cache-Control', 'no-store');
          res.setHeader('Content-Security-Policy', REDIRECT_BRIDGE_CSP);
          res.removeHeader('Cross-Origin-Opener-Policy');
        }
        next();
      });
    },
  };
}

// ---------------------------------------------------------------------------
// SCSS deprecation silencing — shared with .storybook/main.ts
// ---------------------------------------------------------------------------
const sassDeprecationsToSilence: DeprecationOrId[] = [
  'import',
  'global-builtin',
  'color-functions',
  'if-function',
];

export default defineConfig(({ command }) => ({
  publicDir: 'ClientApp/public',

  plugins: [
    react(),
    envTemplatePlugin(resolveEnvVars(command)),
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

  build: {
    outDir: 'dist',
    sourcemap: true,
    rolldownOptions: {
      input: {
        main: path.resolve(dirname, 'index.html'),
        redirect: path.resolve(dirname, 'redirect.html'),
      },
      output: {
        entryFileNames: 'js/[name].[hash:8].js',
        chunkFileNames: 'js/[name].[hash:8].js',
        assetFileNames: 'assets/[name].[hash:8][ext]',
        manualChunks(id: string) {
          if (
            id.includes('node_modules/react/') ||
            id.includes('node_modules/react-dom/') ||
            id.includes('node_modules/react-router/') ||
            id.includes('node_modules/@azure/msal-react/') ||
            id.includes('node_modules/formik/') ||
            id.includes('node_modules/yup/') ||
            id.includes('node_modules/react-bootstrap/')
          ) {
            return 'vendor';
          }
          return undefined;
        },
      },
    },
  },
}));
