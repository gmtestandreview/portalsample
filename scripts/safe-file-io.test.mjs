import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { it } from 'node:test';
import {
  listDirectory,
  makeDirectory,
  pathExists,
  readTextFile,
  realPath,
  safePath,
  statPath,
  writeTextFile,
} from './safe-file-io.mjs';

it('constrains reads, writes, and traversal to the declared workspace', () => {
  const root = mkdtempSync(path.join(tmpdir(), 'safe-file-io-'));
  try {
    makeDirectory('nested', root);
    writeTextFile('nested/value.txt', 'safe', undefined, root);
    assert.equal(readTextFile('nested/value.txt', root), 'safe');
    assert.equal(pathExists('nested/value.txt', root), true);
    assert.equal(listDirectory('nested', undefined, root).length, 1);
    assert.equal(statPath('nested/value.txt', root).isFile(), true);
    assert.equal(
      realPath('nested/value.txt', root),
      path.join(root, 'nested', 'value.txt'),
    );
    assert.throws(
      () => safePath('../outside.txt', root),
      /outside workspace root/u,
    );
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

it('does not make an existing outside path safe', () => {
  const root = mkdtempSync(path.join(tmpdir(), 'safe-file-io-'));
  const outside = path.join(root, '..', 'outside.txt');
  writeTextFile(outside, 'outside', undefined, path.dirname(root));
  try {
    assert.throws(
      () => readTextFile('../outside.txt', root),
      /outside workspace root/u,
    );
  } finally {
    rmSync(root, { recursive: true, force: true });
    rmSync(outside, { force: true });
  }
});
