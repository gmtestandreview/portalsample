import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import type { Dirent, Stats } from 'node:fs';
import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import path from 'node:path';

type DirectoryEntries = Dirent[];

// security/detect-non-literal-fs-filename fires on every fs call below because
// the path argument is a variable. The rule stays a reviewable warning by repo
// policy (eslint.config.mjs: noInlineConfig forbids inline suppression), so the
// mitigation is structural: every public helper routes its path through
// resolveWithinRoot, which rejects anything outside the caller-provided test
// root before the fs call runs. Triage verdict: accepted hotspots, mitigated.
const resolveWithinRoot = (filePath: string, root: string): string => {
  const resolvedRoot = path.resolve(root);
  const resolvedPath = path.resolve(filePath);
  const relativePath = path.relative(resolvedRoot, resolvedPath);

  if (relativePath.startsWith('..') || path.isAbsolute(relativePath)) {
    throw new Error(`Path is outside the allowed root: ${filePath}`);
  }

  return resolvedPath;
};

export const readTextFile = async (
  filePath: string,
  root: string,
): Promise<string> => {
  const safePath = resolveWithinRoot(filePath, root);
  return readFile(safePath, 'utf8');
};

export const readTextFileSync = (filePath: string, root: string): string => {
  const safePath = resolveWithinRoot(filePath, root);
  return readFileSync(safePath, 'utf8');
};

export const writeTextFile = async (
  filePath: string,
  contents: string,
  root: string,
): Promise<void> => {
  const safePath = resolveWithinRoot(filePath, root);
  await writeFile(safePath, contents);
};

export const writeTextFileSync = (
  filePath: string,
  contents: string,
  root: string,
): void => {
  const safePath = resolveWithinRoot(filePath, root);
  writeFileSync(safePath, contents);
};

export const readDirectory = async (
  directory: string,
  root: string,
): Promise<DirectoryEntries> => {
  const safePath = resolveWithinRoot(directory, root);
  return readdir(safePath, { withFileTypes: true });
};

export const readDirectorySync = (
  directory: string,
  root: string,
): DirectoryEntries => {
  const safePath = resolveWithinRoot(directory, root);
  return readdirSync(safePath, { withFileTypes: true });
};

export const makeDirectory = async (
  directory: string,
  root: string,
): Promise<void> => {
  const safePath = resolveWithinRoot(directory, root);
  await mkdir(safePath, { recursive: true });
};

export const makeDirectorySync = (directory: string, root: string): void => {
  const safePath = resolveWithinRoot(directory, root);
  mkdirSync(safePath, { recursive: true });
};

export const pathExists = (filePath: string, root: string): boolean => {
  const safePath = resolveWithinRoot(filePath, root);
  return existsSync(safePath);
};

export const statPath = (filePath: string, root: string): Stats => {
  const safePath = resolveWithinRoot(filePath, root);
  return statSync(safePath);
};
