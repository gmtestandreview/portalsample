import path from 'node:path';
import process from 'node:process';
import { pathToFileURL } from 'node:url';

import { createProductionAdapters } from './storybook-closure/adapters.mjs';
import { parseArguments } from './storybook-closure/cli.mjs';
import { FAILURE_CODES, failure } from './storybook-closure/contracts.mjs';
import { runClosure } from './storybook-closure/orchestrator.mjs';

export { runClosure };

export async function main(argv = process.argv.slice(2), runtime = {}) {
  const parsed = parseArguments(argv);
  if (!parsed.ok)
    return failure(FAILURE_CODES.INVALID_INVOCATION, parsed.message, []);
  const adapters = await createProductionAdapters();
  return runClosure({ ...parsed.options, signal: runtime.signal }, adapters);
}

const isEntrypoint =
  process.argv[1] &&
  import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href;

if (isEntrypoint) {
  const abortController = new AbortController();
  const onSignal = (signal) => {
    if (!abortController.signal.aborted) {
      abortController.abort(new Error(`closure interrupted by ${signal}`));
    }
  };
  const onSigint = () => onSignal('SIGINT');
  const onSigterm = () => onSignal('SIGTERM');
  process.once('SIGINT', onSigint);
  process.once('SIGTERM', onSigterm);
  let result;
  try {
    result = await main(process.argv.slice(2), {
      signal: abortController.signal,
    });
  } finally {
    process.removeListener('SIGINT', onSigint);
    process.removeListener('SIGTERM', onSigterm);
  }
  if (!result.ok) console.error(`${result.code}: ${result.message}`);
  process.exitCode = result.ok ? 0 : 1;
}
