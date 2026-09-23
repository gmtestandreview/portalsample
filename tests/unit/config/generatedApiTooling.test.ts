import { spawnSync } from 'node:child_process';
import {
  copyFileSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import process from 'node:process';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

const repoRoot = path.resolve(import.meta.dirname, '../../..');
const biomeCli = path.join(repoRoot, 'node_modules/@biomejs/biome/bin/biome');
let fixtureRoot: string;

beforeAll(() => {
  fixtureRoot = mkdtempSync(path.join(tmpdir(), 'nmi-api-analysis-'));
  const config = JSON.parse(
    readFileSync(path.join(repoRoot, 'biome.json'), 'utf8')
  );
  // The fixture has no Git repository; test analysis scope without Git ignores.
  config.vcs.enabled = false;
  writeFileSync(path.join(fixtureRoot, 'biome.json'), JSON.stringify(config));
  mkdirSync(path.join(fixtureRoot, 'ClientApp/src/api'), { recursive: true });
  copyFileSync(
    path.join(repoRoot, 'ClientApp/src/api/web-api-client.ts'),
    path.join(fixtureRoot, 'ClientApp/src/api/web-api-client.ts')
  );
  writeFileSync(
    path.join(fixtureRoot, 'ClientApp/src/api/invalid.ts'),
    'export interface Empty {}\n'
  );
  writeFileSync(
    path.join(fixtureRoot, 'ClientApp/src/api/warning.ts'),
    'export type Payload = any;\n'
  );
});

afterAll(() => {
  if (fixtureRoot) rmSync(fixtureRoot, { recursive: true, force: true });
});

function lint(args: string[]) {
  const result = spawnSync(
    process.execPath,
    [biomeCli, 'lint', '--reporter=json', '--no-errors-on-unmatched', ...args],
    {
      cwd: fixtureRoot,
      encoding: 'utf8',
      maxBuffer: 4 * 1024 * 1024,
    }
  );
  expect(result.error).toBeUndefined();
  const report = JSON.parse(result.stdout) as {
    summary: {
      unchanged: number;
      errors: number;
      warnings: number;
      infos: number;
    };
    diagnostics: Array<{ category: string }>;
  };
  return { status: result.status, report };
}

describe('generated API analysis boundary', () => {
  it('GREEN: excludes only the generated client from Biome processing', () => {
    const result = lint(['ClientApp/src/api/web-api-client.ts']);
    expect(result.status).toBe(0);
    expect(result.report.summary).toMatchObject({
      unchanged: 0,
      errors: 0,
      warnings: 0,
      infos: 0,
    });
  });

  it('RED: still rejects invalid handwritten API code beside the generated client', () => {
    const result = lint(['ClientApp/src/api/invalid.ts']);
    expect(result.status).toBe(1);
    expect(result.report.diagnostics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          category: 'lint/suspicious/noEmptyInterface',
        }),
      ])
    );
  });

  it('AMBER: still reports warnings in handwritten API code', () => {
    const result = lint(['ClientApp/src/api/warning.ts']);
    expect(result.status).toBe(0);
    expect(result.report.summary.warnings).toBeGreaterThan(0);
    expect(result.report.diagnostics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ category: 'lint/suspicious/noExplicitAny' }),
      ])
    );
  });
});
