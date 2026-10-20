import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const repositoryRoot = path.dirname(
  path.dirname(fileURLToPath(import.meta.url))
);
const dispatcherPath = path.join(
  repositoryRoot,
  'node_modules',
  'storybook',
  'dist',
  'bin',
  'dispatcher.js'
);

process.argv = [process.argv[0], dispatcherPath, ...process.argv.slice(2)];

await import(pathToFileURL(dispatcherPath).href);
