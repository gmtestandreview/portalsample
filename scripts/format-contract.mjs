import { spawnSync } from 'node:child_process';
import path from 'node:path';

const mode = process.argv[2];

if (mode !== '--write' && mode !== '--check') {
  process.stderr.write(
    'Usage: node scripts/format-contract.mjs --write|--check\n',
  );
  process.exitCode = 2;
} else {
  const prettierCli = path.resolve(
    'node_modules',
    'prettier',
    'bin',
    'prettier.cjs',
  );

  const contractPatterns = [
    'ClientApp/**/*.{js,jsx,ts,tsx,mjs,mts,scss,mdx,json}',
    '.storybook/**/*.{js,jsx,ts,tsx,mjs,mts,mdx,json}',
    'tests/**/*.{js,jsx,ts,tsx,mjs,mts,json}',
    'scripts/**/*.{js,jsx,ts,tsx,mjs,mts,json}',
    'quality/**/*.{js,jsx,ts,tsx,mjs,mts,json}',
    '*.{js,jsx,ts,tsx,mjs,mts,cjs,json}',
    '*.md',
    'docs/**/*.{md,mdx}',
    '.github/**/*.{md,mdx}',
    'vitest.shims.d.ts',
  ];

  const result = spawnSync(
    process.execPath,
    [prettierCli, mode, ...contractPatterns],
    {
      cwd: process.cwd(),
      stdio: 'inherit',
    },
  );

  if (result.error) {
    process.stderr.write(`${result.error.message}\n`);
    process.exitCode = 1;
  } else {
    process.exitCode = result.status ?? 1;
  }
}
