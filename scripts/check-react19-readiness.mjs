// Guard for the Formik to React Hook Form migration: new RHF code must not use
// APIs that React 19 removes. Run: node scripts/check-react19-readiness.mjs
import { join, relative, sep } from 'node:path';
import { listDirectory, readTextFile, statPath } from './safe-file-io.mjs';

const ROOT = process.cwd();
const SCAN_ROOTS = [
  join('ClientApp', 'src', 'components', 'forms'),
  join('ClientApp', 'src', 'components', 'Inputs'),
];
// Only the RHF-native surface is held to the rule; legacy Formik inputs are
// deleted in phase Z, not rewritten.
const IN_SCOPE = (path) =>
  path.includes(`${sep}forms${sep}`) || /[\\/]Rhf[^\\/]*[\\/]/.test(path);
const EXTENSIONS = new Set(['.ts', '.tsx']);
const FORBIDDEN = [
  { name: 'defaultProps', pattern: /\bdefaultProps\b/ },
  { name: 'findDOMNode', pattern: /\bfindDOMNode\b/ },
  { name: 'react-dom/test-utils', pattern: /react-dom\/test-utils/ },
  { name: 'propTypes', pattern: /\bpropTypes\b/ },
  { name: 'ReactDOM.render/hydrate', pattern: /ReactDOM\.(render|hydrate)\b/ },
  { name: 'legacy context', pattern: /\b(contextTypes|childContextTypes)\b/ },
];

const walk = (dir) =>
  listDirectory(dir).flatMap((entry) => {
    const full = join(dir, entry);
    if (entry === 'node_modules') return [];
    return statPath(full).isDirectory() ? walk(full) : [full];
  });

const violations = SCAN_ROOTS.flatMap((scanRoot) =>
  walk(join(ROOT, scanRoot))
    .filter((file) => EXTENSIONS.has(file.slice(file.lastIndexOf('.'))))
    .filter(IN_SCOPE)
    .flatMap((file) =>
      readTextFile(file)
        .split(/\r?\n/)
        .flatMap((line, index) =>
          FORBIDDEN.filter(({ pattern }) => pattern.test(line)).map(
            ({ name }) => `${relative(ROOT, file)}:${index + 1}  ${name}`,
          ),
        ),
    ),
);

if (violations.length > 0) {
  console.error('React 19 readiness violations:');
  violations.forEach((violation) => console.error(`  ${violation}`));
  process.exit(1);
}
console.log('React 19 readiness: no violations.');
