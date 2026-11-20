import type { readdirSync, statSync, writeFileSync } from 'node:fs';

export function safePath(candidate: string, root?: string): string;
export function readTextFile(candidate: string, root?: string): string;
export function readBinaryFile(candidate: string, root?: string): Buffer;
export function writeTextFile(
  candidate: string,
  contents: string,
  options?: Parameters<typeof writeFileSync>[2],
  root?: string,
): void;
export function makeDirectory(
  candidate: string,
  root?: string,
): string | undefined;
export function listDirectory(
  candidate: string,
  options?: Parameters<typeof readdirSync>[1],
  root?: string,
): ReturnType<typeof readdirSync>;
export function statPath(
  candidate: string,
  root?: string,
): ReturnType<typeof statSync>;
export function realPath(candidate: string, root?: string): string;
export function pathExists(candidate: string, root?: string): boolean;
