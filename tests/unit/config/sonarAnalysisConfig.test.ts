import fs from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

const workspaceSettingsPath = path.resolve('.vscode/settings.json');

describe('Sonar analysis configuration', () => {
    it('excludes the generated NSwag client from standalone analysis', () => {
        const workspaceSettings = JSON.parse(
            fs.readFileSync(workspaceSettingsPath, 'utf8'),
        ) as {
            'sonarlint.analysisExcludesStandalone'?: string;
        };

        expect(workspaceSettings['sonarlint.analysisExcludesStandalone'])
            .toContain('ClientApp/src/api/web-api-client.ts');
    });
});
