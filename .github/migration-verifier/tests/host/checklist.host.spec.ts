import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { classifyDotnetScript } from '../support/verifierDetectors';

const currentFilePath = fileURLToPath(import.meta.url);
const currentDir = path.dirname(currentFilePath);
const repoRoot = path.resolve(currentDir, '../../../../');

const readRepoFile = (relativePath: string) => fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');

describe('migration checklist host verifier', () => {
    it('pins the real .NET 10 verification script to the merged checklist gates', () => {
        const script = readRepoFile('.github/migration-verifier/scripts/verify-dotnet10.ps1');
        const classified = classifyDotnetScript(script);

        expect(classified.hasInfo).toBe(true);
        expect(classified.hasRestore).toBe(true);
        expect(classified.hasBuild).toBe(true);
        expect(classified.hasTest).toBe(true);
        expect(classified.hasPublish).toBe(true);
        expect(classified.mentionsAuth).toBe(true);
        expect(classified.mentionsStaticAssets).toBe(true);
        expect(classified.mentionsSsr).toBe(true);
        expect(classified.mentionsCiCd).toBe(true);
    });

    it('accepts the green host fixture and rejects the red and edge host regressions', () => {
        const green = classifyDotnetScript(readRepoFile('.github/migration-verifier/fixtures/green/dotnet10-clean/verify-dotnet10.clean.ps1'));
        const red = classifyDotnetScript(readRepoFile('.github/migration-verifier/fixtures/red/dotnet10-host-regression/verify-dotnet10.missing-steps.ps1'));
        const edge = classifyDotnetScript(readRepoFile('.github/migration-verifier/fixtures/edge/publish-only-host-failure/verify-dotnet10.publish-only.ps1'));

        expect(green.hasRestore && green.hasBuild && green.hasTest && green.hasPublish).toBe(true);
        expect(red.hasRestore).toBe(false);
        expect(red.hasTest).toBe(false);
        expect(edge.hasPublish).toBe(true);
        expect(edge.hasRestore).toBe(false);
        expect(edge.hasTest).toBe(false);
    });
});
