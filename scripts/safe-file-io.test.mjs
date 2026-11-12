import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { it } from 'node:test';
import {
  listDirectory,
  makeDirectory,
  makeExternalDirectory,
  pathExists,
  readBinaryFile,
  readTextFile,
  realFilePath,
  realPath,
  safePath,
  statPath,
  writeTextFile,
  writeExternalTextFile,
} from './safe-file-io.mjs';

const unsafePathCases = [
  ['parent traversal', (root) => path.join(root, '..', 'outside.txt')],
  [
    'absolute outside path',
    (root) => path.join(path.dirname(root), 'outside.txt'),
  ],
  ['sibling prefix', (root) => `${root}-sibling`],
];

it('keeps filesystem operations behind immediate canonical path validation', () => {
  const canonicalPathWrappers = [
    readTextFile,
    readBinaryFile,
    writeTextFile,
    makeDirectory,
    listDirectory,
    statPath,
    pathExists,
  ];

  for (const wrapper of canonicalPathWrappers) {
    assert.match(wrapper.toString(), /safeOperationPath\(candidate, root\)/u);
  }
  assert.match(realPath.toString(), /safePath\(candidate, root\)/u);
  assert.match(realPath.toString(), /outsideRoot/u);
});

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

it('requires an absolute regular file for executable paths', () => {
  const root = mkdtempSync(path.join(tmpdir(), 'safe-file-io-executable-'));
  const executable = path.join(root, 'git.exe');
  try {
    writeFileSync(executable, 'binary');
    assert.equal(realFilePath(executable), executable);
    assert.throws(() => realFilePath('git'), /must be absolute/u);
    assert.throws(() => realFilePath(root), /not a regular file/u);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

it('rejects symlinked ancestors for intentionally external output', () => {
  const tempParent = mkdtempSync(path.join(tmpdir(), 'safe-file-io-external-'));
  const actualOutput = path.join(tempParent, 'actual-output');
  const linkedOutput = path.join(tempParent, 'linked-output');
  try {
    makeExternalDirectory(actualOutput);
    symlinkSync(
      actualOutput,
      linkedOutput,
      process.platform === 'win32' ? 'junction' : 'dir',
    );

    assert.throws(
      () => makeExternalDirectory(path.join(linkedOutput, 'nested')),
      /symlinked filesystem path/u,
    );
    assert.throws(
      () =>
        writeExternalTextFile(
          path.join(linkedOutput, 'nested', 'result.txt'),
          'unsafe',
        ),
      /symlinked filesystem path/u,
    );
  } finally {
    rmSync(tempParent, { recursive: true, force: true });
  }
});

it('creates nested paths when the declared root does not exist yet', () => {
  const tempParent = mkdtempSync(path.join(tmpdir(), 'safe-file-io-parent-'));
  const root = path.join(tempParent, 'new-root');
  try {
    makeDirectory('nested', root);
    writeTextFile('nested/value.txt', 'safe', undefined, root);
    assert.equal(readTextFile('nested/value.txt', root), 'safe');
  } finally {
    rmSync(tempParent, { recursive: true, force: true });
  }
});

it('permits absolute nested paths, including names beginning with two dots', () => {
  const root = mkdtempSync(path.join(tmpdir(), 'safe-file-io-'));
  const nestedDirectory = path.join(root, '..allowed', 'nested');
  const nestedFile = path.join(nestedDirectory, 'value.txt');
  try {
    makeDirectory(nestedDirectory, root);
    writeTextFile(nestedFile, 'nested', undefined, root);

    assert.equal(readTextFile(nestedFile, root), 'nested');
    assert.equal(readBinaryFile(nestedFile, root).toString(), 'nested');
    assert.equal(pathExists(nestedFile, root), true);
    assert.equal(statPath(nestedFile, root).isFile(), true);
    assert.equal(listDirectory(nestedDirectory, undefined, root).length, 1);
    assert.equal(realPath(nestedFile, root), nestedFile);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

for (const [label, getUnsafePath] of unsafePathCases) {
  it(`rejects ${label} for every filesystem wrapper`, () => {
    const root = mkdtempSync(path.join(tmpdir(), 'safe-file-io-'));
    const unsafePath = getUnsafePath(root);
    try {
      const rejectedOperations = [
        () => readTextFile(unsafePath, root),
        () => readBinaryFile(unsafePath, root),
        () => writeTextFile(unsafePath, 'outside', undefined, root),
        () => makeDirectory(unsafePath, root),
        () => listDirectory(unsafePath, undefined, root),
        () => statPath(unsafePath, root),
        () => realPath(unsafePath, root),
        () => pathExists(unsafePath, root),
      ];

      for (const operation of rejectedOperations) {
        assert.throws(operation, /outside workspace root/u);
      }
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
}

it('does not make an existing outside path safe', () => {
  const tempParent = mkdtempSync(path.join(tmpdir(), 'safe-file-io-parent-'));
  try {
    const root = mkdtempSync(path.join(tempParent, 'root-'));
    const outside = path.join(tempParent, 'outside.txt');
    writeTextFile(outside, 'outside', undefined, tempParent);
    assert.throws(
      () => readTextFile('../outside.txt', root),
      /outside workspace root/u,
    );
  } finally {
    rmSync(tempParent, { recursive: true, force: true });
  }
});

it('accepts nested paths when the declared root is a symlink', () => {
  const tempParent = mkdtempSync(path.join(tmpdir(), 'safe-file-io-root-'));
  try {
    const actualRoot = mkdtempSync(path.join(tempParent, 'actual-'));
    const linkedRoot = path.join(tempParent, 'linked-root');
    symlinkSync(
      actualRoot,
      linkedRoot,
      process.platform === 'win32' ? 'junction' : 'dir',
    );
    makeDirectory('nested', linkedRoot);
    writeTextFile('nested/value.txt', 'safe', undefined, linkedRoot);
    assert.equal(
      safePath('nested/value.txt', linkedRoot),
      path.join(linkedRoot, 'nested', 'value.txt'),
    );
    assert.equal(readTextFile('nested/value.txt', linkedRoot), 'safe');
    assert.equal(
      realPath('nested/value.txt', linkedRoot),
      path.join(actualRoot, 'nested', 'value.txt'),
    );
  } finally {
    rmSync(tempParent, { recursive: true, force: true });
  }
});

it('uses the output root as the declared filesystem boundary', () => {
  const root = mkdtempSync(path.join(tmpdir(), 'safe-file-io-'));
  const outputRoot = path.join(root, 'output');
  try {
    makeDirectory(outputRoot, root);
    makeDirectory('nested', outputRoot);
    const outputFile = path.join(outputRoot, 'nested', 'result.txt');
    writeTextFile('nested/result.txt', 'output', undefined, outputRoot);
    assert.equal(readTextFile('nested/result.txt', outputRoot), 'output');
    assert.equal(realPath('nested/result.txt', outputRoot), outputFile);

    const rejectedPaths = ['../parent.txt', path.join(root, 'sibling.txt')];
    for (const rejectedPath of rejectedPaths) {
      const rejectedOperations = [
        () => readTextFile(rejectedPath, outputRoot),
        () => readBinaryFile(rejectedPath, outputRoot),
        () => writeTextFile(rejectedPath, 'outside', undefined, outputRoot),
        () => makeDirectory(rejectedPath, outputRoot),
        () => listDirectory(rejectedPath, undefined, outputRoot),
        () => statPath(rejectedPath, outputRoot),
        () => realPath(rejectedPath, outputRoot),
        () => pathExists(rejectedPath, outputRoot),
      ];

      for (const operation of rejectedOperations) {
        assert.throws(operation, /outside workspace root/u);
      }
    }
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
    assert.equal(
      pathExists(path.join(outside, 'new-directory'), outside),
      false,
    );
  } finally {
    rmSync(root, { recursive: true, force: true });
    rmSync(outside, { recursive: true, force: true });
  }
});
