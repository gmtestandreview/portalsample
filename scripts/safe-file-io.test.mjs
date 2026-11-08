import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { it } from 'node:test';
import {
  listDirectory,
  makeDirectory,
  pathExists,
  readBinaryFile,
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

it('keeps absolute output paths inside the declared output root', () => {
  const root = mkdtempSync(path.join(tmpdir(), 'safe-file-io-'));
  const outputRoot = path.join(root, 'output');
  try {
    makeDirectory(outputRoot, root);
    const outputFile = path.join(outputRoot, 'result.txt');
    writeTextFile(outputFile, 'output', undefined, root);
    assert.equal(readTextFile(outputFile, root), 'output');
    assert.equal(realPath(outputFile, root), outputFile);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

it('rejects traversal for every filesystem wrapper', () => {
  const root = mkdtempSync(path.join(tmpdir(), 'safe-file-io-'));
  try {
    const rejectedOperations = [
      () => readTextFile('../outside.txt', root),
      () => readBinaryFile('../outside.bin', root),
      () => writeTextFile('../outside.txt', 'outside', undefined, root),
      () => makeDirectory('../outside-directory', root),
      () => listDirectory('../outside-directory', undefined, root),
      () => statPath('../outside.txt', root),
      () => realPath('../outside.txt', root),
      () => pathExists('../outside.txt', root),
    ];

    for (const operation of rejectedOperations) {
      assert.throws(operation, /outside workspace root/u);
    }
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

it('rejects symlink escapes for reads, writes, and path inspection', () => {
  const root = mkdtempSync(path.join(tmpdir(), 'safe-file-io-'));
  const outside = mkdtempSync(path.join(tmpdir(), 'safe-file-io-outside-'));
  const link = path.join(root, 'linked');
  try {
    writeFileSync(path.join(outside, 'value.txt'), 'outside');
    symlinkSync(
      outside,
      link,
      process.platform === 'win32' ? 'junction' : 'dir',
    );

    const rejectedOperations = [
      () => readTextFile('linked/value.txt', root),
      () => readBinaryFile('linked/value.txt', root),
      () => writeTextFile('linked/new.txt', 'outside', undefined, root),
      () => makeDirectory('linked/new-directory', root),
      () => listDirectory('linked', undefined, root),
      () => statPath('linked/value.txt', root),
      () => realPath('linked/value.txt', root),
      () => pathExists('linked/value.txt', root),
    ];

    for (const operation of rejectedOperations) {
      assert.throws(operation, /outside workspace root/u);
    }
    assert.equal(pathExists(path.join(outside, 'new.txt'), outside), false);
  } finally {
    rmSync(root, { recursive: true, force: true });
    rmSync(outside, { recursive: true, force: true });
  }
});
