import { rm } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const outputDirName = 'storybook-static';
const cwd = process.cwd();
const outputDir = path.resolve(cwd, outputDirName);
const expectedOutputDir = path.join(cwd, outputDirName);

if (outputDir !== expectedOutputDir || !outputDir.startsWith(`${cwd}${path.sep}`)) {
    throw new Error(`Refusing to clean unexpected Storybook output path: ${outputDir}`);
}

await rm(outputDir, {
    recursive: true,
    force: true,
    maxRetries: 5,
    retryDelay: 250,
});
