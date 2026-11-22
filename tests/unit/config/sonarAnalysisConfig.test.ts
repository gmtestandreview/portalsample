import fs from 'node:fs';

import { describe, expect, it } from 'vitest';

describe('sonar analysis configuration', () => {
  it('excludes the generated NSwag client from standalone analysis', () => {
    expect.hasAssertions();

    const workspaceSettings = JSON.parse(
      fs.readFileSync('.vscode/settings.json', 'utf8'),
    ) as {
      'sonarlint.analysisExcludesStandalone'?: string;
    };

    expect(workspaceSettings['sonarlint.analysisExcludesStandalone']).toContain(
      'ClientApp/src/api/web-api-client.ts',
    );
  });
});
