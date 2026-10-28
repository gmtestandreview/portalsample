import process from 'node:process';

import { computeIndexDigest } from '../storybook-coverage.mjs';

import { runCommand } from './commands.mjs';
import { assertGate, throwIfAborted } from './contracts.mjs';
import { readOwnedJson } from './owned-fs.mjs';
import { writeReceiptJson } from './receipt-store.mjs';

const BUILD_GATE = 'gate-5-storybook-build';
const DOCS_GATE = 'gate-8-docs';
const BDD_GATE = 'gate-7-storybook-bdd';
const STORYBOOK_INDEX_PATH = 'storybook-static/index.json';

export const GATES = [
  ['gate-1-type-check', ['npm', 'run', 'type-check']],
  ['gate-2-lint', ['npm', 'run', 'lint']],
  [
    'gate-3-unit',
    [
      'npm',
      'run',
      'test:unit',
      '--',
      'tests/unit/storybook',
      'tests/unit/config/vitestTopology.test.ts',
      'tests/unit/config/storybookRuntimePolicy.test.ts',
    ],
  ],
  [
    'gate-4-source',
    ['node', 'scripts/storybook-coverage.mjs', '--mode', 'source'],
  ],
  [BUILD_GATE, ['npm', 'run', 'build-storybook']],
  [
    'gate-6-references',
    [
      'node',
      'scripts/storybook-coverage.mjs',
      '--mode',
      'references',
      '--index',
      'storybook-static/index.json',
    ],
  ],
  [BDD_GATE, ['npm', 'run', 'test:e2e:storybook', '--', '--workers=1']],
  [DOCS_GATE, ['npm', 'run', 'storybook:verify:docs']],
  [
    'gate-9-closure',
    [
      'node',
      'scripts/storybook-coverage.mjs',
      '--mode',
      'closure',
      '--index',
      'reports/storybook-coverage/frozen-full-index.json',
      '--docs-index',
      'reports/storybook-coverage/frozen-docs-index.json',
      '--receipts',
      'reports/storybook-coverage/closure-run',
    ],
  ],
];

export const runGateSequence = async (gates, context, phases, adapters) => {
  for (const [name] of gates) {
    throwIfAborted(context.signal);
    const gate = await adapters.runGate(name, context);
    phases.push(name);
    assertGate(gate, { ...context, name });
    await adapters.assertStableIdentity(context);
  }
};

const gateEnvironment = (name, context) =>
  name === BDD_GATE
    ? {
        ...process.env,
        STORYBOOK_TEST_URL: context.target.baseURL,
        STORYBOOK_TEST_SERVER_MODE: 'external',
        STORYBOOK_CLOSURE_FREEZE_ID: context.freezeId,
        STORYBOOK_CLOSURE_PRODUCER_ID: context.producerId,
        STORYBOOK_CLOSURE_INPUT_DIGEST: context.inputDigest,
        STORYBOOK_CLOSURE_PRODUCER_IDENTITY_DIGEST:
          context.producerIdentityDigest,
        STORYBOOK_CLOSURE_CHILD_PID: String(context.childEpoch.pid),
        STORYBOOK_CLOSURE_CHILD_CREATED_AT: context.childEpoch.createdAt,
      }
    : process.env;

// Only the build and docs gates snapshot the Storybook index, each into its
// own fixed receipt file and its own named freeze digest field.
const snapshotStorybookIndex = async (paths, name, context) => {
  const index = await readOwnedJson(context.checkout, STORYBOOK_INDEX_PATH);
  const digest = computeIndexDigest(index);
  if (name === BUILD_GATE) {
    context.freeze.fullIndexDigest = digest;
    await writeReceiptJson(paths, 'frozen-full-index.json', index);
  } else {
    context.freeze.docsIndexDigest = digest;
    await writeReceiptJson(paths, 'frozen-docs-index.json', index);
  }
  await writeReceiptJson(paths, 'freeze.json', context.freeze);
};

export const runGate = async (paths, name, context) => {
  const definition = GATES.find(([gateName]) => gateName === name);
  if (!definition) throw new Error(`unknown closure gate: ${name}`);
  await runCommand(
    definition[1],
    context.checkout ?? process.cwd(),
    context.signal,
    gateEnvironment(name, context),
  );
  if (name === BUILD_GATE || name === DOCS_GATE) {
    await snapshotStorybookIndex(paths, name, context);
  }
  return {
    name,
    ok: true,
    inputDigest: context.inputDigest,
    producerIdentityDigest: context.producerIdentityDigest,
    freezeId: context.freezeId,
  };
};
