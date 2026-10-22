import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import type { Vitest } from 'vitest/node';
import type { Plugin } from 'vite';

type StorybookVitest = Pick<Vitest, 'standalone'> & {
  init: Vitest['standalone'];
  config: {
    coverage: {
      exclude: string[];
    };
  };
};

type StorybookVitestPlugin = Plugin & {
  configureVitest: (context: { vitest: StorybookVitest }) => void;
};

export const jsonCoverageExclusion = 'ClientApp/src/**/*.json';

const isInside = (root: string, candidate: string): boolean => {
  const relative = path.relative(root, candidate);
  return (
    relative === '' ||
    (!relative.startsWith('..') && !path.isAbsolute(relative))
  );
};

const writeClosureChildDiagnostic = (vitest: StorybookVitest): void => {
  const receiptDirectory = process.env['STORYBOOK_CLOSURE_RECEIPTS'];
  const freezeId = process.env['STORYBOOK_CLOSURE_FREEZE_ID'];
  if (receiptDirectory === undefined || freezeId === undefined) return;

  const cwd = process.cwd();
  const resolvedReceiptDirectory = path.resolve(receiptDirectory);
  const ownedReceiptRoot = path.resolve(cwd, 'reports', 'storybook-coverage');
  if (!isInside(ownedReceiptRoot, resolvedReceiptDirectory)) {
    throw new Error(
      'STORYBOOK_CLOSURE_RECEIPTS must be inside the owned reports/storybook-coverage directory'
    );
  }
  const selectedInputRoots = [
    path.resolve(cwd, 'ClientApp/src'),
    path.resolve(cwd, 'ClientApp/public'),
    path.resolve(cwd, '.storybook'),
    path.resolve(cwd, 'scripts'),
    path.resolve(cwd, 'tests'),
  ];
  if (
    selectedInputRoots.some((root) => isInside(root, resolvedReceiptDirectory))
  ) {
    throw new Error(
      'STORYBOOK_CLOSURE_RECEIPTS must be outside selected source inputs'
    );
  }

  mkdirSync(resolvedReceiptDirectory, { recursive: true });
  const diagnostic = {
    type: 'storybook-vitest-child',
    pid: process.pid,
    ppid: process.ppid,
    cwd,
    freezeId,
    project: {
      coverageExclusionPresent: vitest.config.coverage.exclude.includes(
        jsonCoverageExclusion
      ),
    },
  };
  const fileName = `child-${process.pid}-${Date.now()}-${process.hrtime.bigint()}.json`;
  writeFileSync(
    path.join(resolvedReceiptDirectory, fileName),
    `${JSON.stringify(diagnostic, null, 2)}\n`,
    { encoding: 'utf8', flag: 'wx' }
  );
};

/**
 * Compatibility policy for Test-panel runs owned by @storybook/addon-vitest.
 *
 * Storybook 10.5.10 calls Vitest's deprecated `init()` alias and replaces the
 * project's coverage options when its coverage toggle is enabled. Route the
 * dependency call to the supported API and keep JSON data out of V8 remapping.
 * Remove the init bridge after Storybook switches to `standalone()` upstream.
 */
export const storybookVitestRuntimePlugin: StorybookVitestPlugin = {
  name: 'nmi:storybook-vitest-runtime-policy',
  configureVitest({ vitest }) {
    if (!vitest.config.coverage.exclude.includes(jsonCoverageExclusion)) {
      vitest.config.coverage.exclude.push(jsonCoverageExclusion);
    }
    vitest.init = vitest.standalone.bind(vitest);
    writeClosureChildDiagnostic(vitest);
  },
};
