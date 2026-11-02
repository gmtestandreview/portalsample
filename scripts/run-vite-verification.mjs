import { spawnSync } from 'node:child_process';

const isWindows = process.platform === 'win32';
const command = isWindows ? process.env.ComSpec || 'cmd.exe' : 'npm';
const environment = {
  ...process.env,
  VITE_ENVIRONMENT: process.env.VITE_ENVIRONMENT || 'production',
};

for (const scriptName of ['verify:vite-build', 'verify:vite-runtime']) {
  const args = isWindows
    ? ['/d', '/s', '/c', `npm run ${scriptName}`]
    : ['run', scriptName];
  const result = spawnSync(command, args, {
    env: environment,
    stdio: 'inherit',
  });

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}
