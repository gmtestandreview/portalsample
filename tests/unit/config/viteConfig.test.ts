import { vi } from 'vitest';

interface VitePlugin {
  name: string;
  transformIndexHtml?: (html: string) => string;
  configureServer?: (server: unknown) => void;
}

interface ViteConfig {
  publicDir: string;
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
    sourcemap: boolean;
    rolldownOptions: {
      input: Record<string, string>;
      output: {
        entryFileNames: string;
        chunkFileNames: string;
        assetFileNames: string;
        manualChunks: (id: string) => string | undefined;
      };
    };
  };
}

let config: ViteConfig;
const CLIENT_ID_WITH_REPLACEMENT_TOKENS = "literal-$&-$'-$`";
const ESCAPED_CLIENT_ID = "literal-$\\u0026-$\\'-$`";
const TEST_ENVIRONMENT = {
  REACT_APP_B2C_CLIENTID: CLIENT_ID_WITH_REPLACEMENT_TOKENS,
  REACT_APP_B2C_AUTHORITY: 'test-authority',
  REACT_APP_B2C_KNOWN_AUTHORITIES: 'test-known',
  REACT_APP_B2C_POST_LOGOUT_REDIRECT_URL: 'test-logout',
  REACT_APP_B2C_READ_SCOPE: 'test-read',
  REACT_APP_B2C_USER_IMPERSONATION_SCOPE: 'test-impersonation',
  REACT_APP_B2C_REDIRECT_URL: 'test-redirect',
  EXTERNAL_REDIRECT_URL: 'test-external',
  REACT_APP_APPINSIGHTS_INSTRUMENTATIONKEY: 'test-insights',
  REACT_APP_APPINSIGHTS_CONN_STRING: 'test-conn',
  REACT_APP_GA_TRACKINGID: 'test-ga',
};
const ENVIRONMENT_TEMPLATE_HTML = [
  '<%= REACT_APP_B2C_CLIENTID %>',
  '<%= REACT_APP_B2C_AUTHORITY %>',
  '<%= REACT_APP_B2C_KNOWN_AUTHORITIES %>',
  '<%= REACT_APP_B2C_POST_LOGOUT_REDIRECT_URL %>',
  '<%= REACT_APP_B2C_READ_SCOPE %>',
  '<%= REACT_APP_B2C_USER_IMPERSONATION_SCOPE %>',
  '<%= REACT_APP_B2C_REDIRECT_URL %>',
  '<%= EXTERNAL_REDIRECT_URL %>',
  '<%= REACT_APP_APPINSIGHTS_INSTRUMENTATIONKEY %>',
  '<%= REACT_APP_APPINSIGHTS_CONN_STRING %>',
  '<%= REACT_APP_GA_TRACKINGID %>',
].join('\n');

beforeAll(async () => {
  for (const [key, value] of Object.entries(TEST_ENVIRONMENT)) {
    vi.stubEnv(key, value);
  }
  const mod = await import('../../../vite.config.ts');
  const configFn = mod.default as (env: {
    command: string;
    mode: string;
  }) => ViteConfig;
  config = configFn({ command: 'serve', mode: 'development' });
});

afterAll(() => {
  vi.unstubAllEnvs();
});

describe('vite config', () => {
  it('serves static assets from ClientApp/public', () => {
    expect(config.publicDir).toBe('ClientApp/public');
  });

  it('resolves the @ alias to ClientApp/src', () => {
    expect(config.resolve.alias['@']).toMatch(/ClientApp[\\/]src$/);
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

  it('produces hashed output in the js/ and assets/ directories', () => {
    const output = config.build.rolldownOptions.output;

    expect(output.entryFileNames).toContain('[hash');
    expect(output.chunkFileNames).toContain('[hash');
    expect(output.assetFileNames).toContain('[hash');
  });

  it('generates source maps for production builds', () => {
    expect(config.build.sourcemap).toBe(true);
  });

  it('splits vendor dependencies into a dedicated chunk', () => {
    const manualChunks = config.build.rolldownOptions.output.manualChunks;

    expect(typeof manualChunks).toBe('function');
    expect(manualChunks('/node_modules/react/index.js')).toBe('vendor');
    expect(manualChunks('/node_modules/react-dom/client.js')).toBe('vendor');
    expect(manualChunks('/node_modules/react-router/index.js')).toBe('vendor');
    expect(manualChunks('/node_modules/@azure/msal-react/index.js')).toBe(
      'vendor'
    );
    expect(manualChunks('/node_modules/formik/index.js')).toBe('vendor');
    expect(manualChunks('/node_modules/yup/index.js')).toBe('vendor');
    expect(manualChunks('/node_modules/react-bootstrap/index.js')).toBe(
      'vendor'
    );
    expect(manualChunks('/ClientApp/src/App.tsx')).toBeUndefined();
  });

  it('includes the env template plugin for EJS variable injection', () => {
    const envPlugin = config.plugins.find(
      (plugin) => plugin.name === 'env-template'
    );

    expect(envPlugin).toBeDefined();
    expect(envPlugin?.transformIndexHtml).toEqual(expect.any(Function));

    const result = envPlugin?.transformIndexHtml?.(
      '<%= REACT_APP_B2C_CLIENTID %>'
    );
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
        key === 'REACT_APP_B2C_CLIENTID' ? ESCAPED_CLIENT_ID : value;
      const containsConfiguredValue =
        transformedHtml?.includes(expectedValue) ?? false;

      expect(containsPlaceholder).toBe(false);
      expect(containsConfiguredValue).toBe(true);
    }
  });

  it('sets the MSAL redirect bridge CSP headers for redirect.html requests', () => {
    const cspPlugin = config.plugins.find(
      (plugin) => plugin.name === 'msal-redirect-csp'
    );

    const response = {
      setHeader: vi.fn(),
      removeHeader: vi.fn(),
    };
    const next = vi.fn();

    const middlewares = {
      use: vi.fn(),
    };
    const server = { middlewares };

    cspPlugin?.configureServer?.(server);

    expect(middlewares.use).toHaveBeenCalledWith(expect.any(Function));

    const middleware = middlewares.use.mock.calls[0]?.[0] as (
      req: { url?: string },
      res: typeof response,
      cb: typeof next
    ) => void;

    middleware({ url: '/redirect.html?code=redacted' }, response, next);

    expect(response.setHeader).toHaveBeenCalledWith(
      'Cache-Control',
      'no-store'
    );
    expect(response.setHeader).toHaveBeenCalledWith(
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
    middleware({ url: '/index.html' }, response, next);

    expect(response.setHeader).not.toHaveBeenCalled();
    expect(response.removeHeader).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledTimes(1);
  });
});
