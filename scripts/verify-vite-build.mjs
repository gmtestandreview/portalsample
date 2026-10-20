import { readdir, readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadEnv } from 'vite';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(root, 'dist');

const fail = (message) => {
  throw new Error(`[vite-build] ${message}`);
};

const assert = (condition, message) => {
  if (!condition) fail(message);
};

async function exists(filePath) {
  try {
    await stat(filePath);
    return true;
  } catch {
    return false;
  }
}

async function filesIn(directory) {
  if (!(await exists(directory))) return [];

  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(
    entries.map(async (entry) => {
      const entryPath = path.join(directory, entry.name);
      return entry.isDirectory() ? filesIn(entryPath) : [entryPath];
    })
  );

  return nested.flat();
}

function htmlScriptSources(html) {
  return [...html.matchAll(/<script[^>]+src="([^"]+)"/gu)].map(
    ([, source]) => source.split(/[?#]/u, 1)[0]
  );
}

function htmlJavaScriptReferences(html) {
  return [...html.matchAll(/<(?:script[^>]+src|link[^>]+href)="([^"]+)"/gu)]
    .map(([, source]) => source.split(/[?#]/u, 1)[0])
    .filter((source) => source.endsWith('.js'));
}

const htmlAttributeEscapes = {
  '&': '&amp;',
  '"': '&quot;',
  "'": '&#39;',
  '<': '&lt;',
  '>': '&gt;',
};

const escapeHtmlAttributeValue = (value) =>
  value.replace(/[&"'<>]/gu, (character) => htmlAttributeEscapes[character]);

async function verifyHtmlEntry(fileName, expectedEntryName) {
  const htmlPath = path.join(dist, fileName);
  assert(await exists(htmlPath), `${fileName} was not emitted`);

  const html = await readFile(htmlPath, 'utf8');
  assert(
    !html.includes('<%='),
    `${fileName} still contains an HTML template placeholder`
  );

  const scripts = htmlScriptSources(html);
  assert(scripts.length > 0, `${fileName} has no emitted script entry`);
  assert(
    scripts.some((source) => source.includes(`/${expectedEntryName}.`)),
    `${fileName} does not reference the ${expectedEntryName} entry`
  );

  for (const source of scripts) {
    const scriptPath = path.join(dist, source.replace(/^\/+/, ''));
    assert(
      await exists(scriptPath),
      `${fileName} references missing script ${source}`
    );
  }
}

async function readJavaScript(filePath) {
  return readFile(filePath, 'utf8');
}

const requiredRootAssets = ['favicon.ico', 'NMI-tile.png'];
for (const asset of requiredRootAssets) {
  assert(
    await exists(path.join(dist, asset)),
    `${asset} was not copied to dist`
  );
}

await verifyHtmlEntry('index.html', 'main');
await verifyHtmlEntry('redirect.html', 'redirect');

const indexHtml = await readFile(path.join(dist, 'index.html'), 'utf8');
const expectedEnvironment =
  process.env.VITE_ENVIRONMENT ??
  loadEnv('production', root, '').VITE_ENVIRONMENT;
const environmentMeta = indexHtml.match(
  /<meta[^>]+name="nmi-environment"[^>]+content="([^"]+)"/u
);
assert(
  expectedEnvironment,
  'VITE_ENVIRONMENT was not available to the verifier'
);
const expectedEnvironmentInHtml = escapeHtmlAttributeValue(expectedEnvironment);
assert(
  environmentMeta?.[1],
  'index.html is missing a resolved VITE_ENVIRONMENT value'
);
assert(
  environmentMeta?.[1] === expectedEnvironmentInHtml,
  `index.html VITE_ENVIRONMENT does not match the build input (${expectedEnvironment})`
);
assert(
  !indexHtml.includes('globalThis.REACT_APP_') &&
    !indexHtml.includes('globalThis.EXTERNAL_REDIRECT_URL') &&
    !indexHtml.includes('process.env.'),
  'index.html still contains the legacy runtime environment bridge'
);
assert(
  !indexHtml.includes('import.meta.env.'),
  'index.html must not contain unresolved import.meta.env expressions'
);

const allFiles = await filesIn(dist);
const jsFiles = allFiles.filter((file) => file.endsWith('.js'));
const cssFiles = allFiles.filter((file) => file.endsWith('.css'));
const sourceMaps = allFiles.filter((file) => file.endsWith('.js.map'));
const fontFiles = allFiles.filter((file) =>
  /\.(woff2?|eot|ttf|otf)$/iu.test(file)
);
const svgFiles = allFiles.filter((file) => file.endsWith('.svg'));
const publicCssFiles = new Set(['fonts/fonts.css', 'fonts/nmi-iconfonts.css']);
const isMaplessRuntimeFile = (file) => {
  const fileName = path.basename(file);
  return (
    fileName.startsWith('modulepreload-polyfill.') ||
    fileName.startsWith('rolldown-runtime.') ||
    fileName === 'mockServiceWorker.js'
  );
};
const maplessJavaScript = jsFiles.filter(
  (file) => !sourceMaps.includes(`${file}.map`) && !isMaplessRuntimeFile(file)
);
const javaScriptSources = await Promise.all(jsFiles.map(readJavaScript));
const applicationJavaScript = javaScriptSources.join('\n');
const vendorChunkNames = ['react-runtime', 'auth', 'forms', 'ui', 'utilities'];

assert(jsFiles.length > 0, 'no JavaScript files were emitted');
assert(cssFiles.length > 0, 'no compiled CSS files were emitted');
assert(fontFiles.length > 0, 'no font files were emitted');
assert(svgFiles.length > 0, 'no SVG files were emitted');
for (const publicCssFile of publicCssFiles) {
  assert(
    await exists(path.join(dist, publicCssFile)),
    `${publicCssFile} was not copied to dist`
  );
}
assert(
  !/\b(?:REACT_APP_[A-Z0-9_]+|EXTERNAL_REDIRECT_URL)\b/u.test(
    applicationJavaScript
  ),
  'application JavaScript still contains legacy environment names'
);
assert(
  !/\bprocess\.env(?:\.|\[)/u.test(applicationJavaScript),
  'application JavaScript still contains custom process.env access'
);
assert(
  !/import\.meta\.env\./u.test(applicationJavaScript),
  'application JavaScript contains unresolved import.meta.env access'
);
assert(
  maplessJavaScript.length === 0,
  `application JavaScript files without source maps: ${maplessJavaScript.join(', ')}`
);
assert(
  vendorChunkNames.some((name) =>
    jsFiles.some((file) => path.basename(file).includes(name))
  ),
  'code splitting did not emit a named application vendor chunk'
);
const redirectHtml = await readFile(path.join(dist, 'redirect.html'), 'utf8');
const redirectEntryScripts = htmlScriptSources(redirectHtml);
const redirectScripts = htmlJavaScriptReferences(redirectHtml);
const redirectPreloads = redirectScripts.filter(
  (source) => !redirectEntryScripts.includes(source)
);
const redirectAllowedPreloads =
  /\/(?:auth|react-runtime|rolldown-runtime|modulepreload-polyfill)\.[^/]+\.js$/u;
assert(
  redirectEntryScripts.length === 1 &&
    /\/redirect\.[^/]+\.js$/u.test(redirectEntryScripts[0] ?? ''),
  `redirect.html must have exactly one redirect entry script: ${redirectEntryScripts.join(', ')}`
);
for (const source of redirectScripts) {
  assert(
    await exists(path.join(dist, source.replace(/^\/+/, ''))),
    `redirect.html references missing JavaScript ${source}`
  );
}
const redirectEntrySource = await readJavaScript(
  path.join(dist, redirectEntryScripts[0].replace(/^\/+/, ''))
);
const authPreload = redirectPreloads.find((source) =>
  /\/auth\.[^/]+\.js$/u.test(source)
);
assert(
  authPreload &&
    redirectEntrySource.includes(`./${path.basename(authPreload)}`),
  'redirect.html auth preload is not a dependency of the redirect entry'
);
assert(
  redirectPreloads.every((source) => redirectAllowedPreloads.test(source)),
  `redirect.html preloads an application chunk: ${redirectPreloads.join(', ')}`
);
assert(
  cssFiles
    .filter((file) => {
      const relativePath = path.relative(dist, file).replaceAll('\\', '/');
      return !publicCssFiles.has(relativePath);
    })
    .every((file) => path.dirname(file) === path.join(dist, 'css')),
  'compiled CSS files must be emitted under dist/css'
);
assert(
  fontFiles.every((file) => path.dirname(file) === path.join(dist, 'fonts')),
  'font files must be emitted under dist/fonts'
);
assert(
  svgFiles.every((file) => path.dirname(file) === path.join(dist, 'images')),
  'SVG files must be emitted under dist/images'
);

process.stdout.write(
  `[vite-build] passed: ${jsFiles.length} JS, ${cssFiles.length} CSS, ${sourceMaps.length} JS maps`
);
