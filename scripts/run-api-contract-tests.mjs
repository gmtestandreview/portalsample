import { spawn } from 'node:child_process';
import path from 'node:path';
import process from 'node:process';

const deleteEnvironmentKey = (environment, key) => {
  for (const environmentKey of Object.keys(environment)) {
    if (environmentKey.toUpperCase() === key) {
      delete environment[environmentKey];
    }
  }
};

const env = { ...process.env };

deleteEnvironmentKey(process.env, 'NO_COLOR');
deleteEnvironmentKey(env, 'NO_COLOR');

const playwrightCli = path.join(
  process.cwd(),
  'node_modules',
  '@playwright',
  'test',
  'cli.js',
);

const child = spawn(
  process.execPath,
  [playwrightCli, 'test', '-c', 'playwright.api.config.ts', ...process.argv.slice(2)],
  {
    env,
    stdio: 'inherit',
    shell: false,
  },
);

child.on('exit', (code, signal) => {
  if (signal !== null) {
    process.kill(process.pid, signal);
    return;
  }

  process.exitCode = code ?? 1;
});

child.on('error', (error) => {
  process.stderr.write(`Failed to start Playwright API contract tests: ${error.message}\n`);
  process.exitCode = 1;
});
