import { describe, expect, it } from 'vitest';

import { resolveStorybookTestTarget } from '../../../.storybook/storybook-test-target';

describe('resolveStorybookTestTarget', () => {
  it('derives the managed default target on port 6006', () => {
    expect(resolveStorybookTestTarget({ ci: false })).toEqual({
      baseURL: 'http://localhost:6006',
      mcpURL: 'http://localhost:6006/mcp',
      command:
        'node --max-old-space-size=8192 ./node_modules/storybook/dist/bin/dispatcher.js dev --host localhost -p 6006 --no-open',
      webServer: {
        command:
          'node --max-old-space-size=8192 ./node_modules/storybook/dist/bin/dispatcher.js dev --host localhost -p 6006 --no-open',
        url: 'http://localhost:6006',
        reuseExistingServer: true,
        timeout: 120_000,
      },
    });
  });

  it('derives an external CI target without a Playwright web server', () => {
    expect(
      resolveStorybookTestTarget({
        url: 'http://127.0.0.1:6007',
        serverMode: 'external',
        ci: true,
      })
    ).toEqual({
      baseURL: 'http://127.0.0.1:6007',
      mcpURL: 'http://127.0.0.1:6007/mcp',
      command:
        'node --max-old-space-size=8192 ./node_modules/storybook/dist/bin/dispatcher.js dev --host 127.0.0.1 -p 6007 --no-open',
      webServer: undefined,
    });
  });

  it.each([
    ['https://localhost:6006', 'only http URLs are supported'],
    ['http://example.test:6006', 'only loopback hosts are supported'],
    ['http://localhost', 'an explicit port is required'],
    ['http://localhost:0', 'the port must be in the valid range'],
    ['http://localhost:65536', 'the port must be in the valid range'],
    ['http://user:pass@localhost:6006', 'credentials are not allowed'],
    ['http://localhost:6006/mcp', 'paths are not allowed'],
    ['http://localhost:6006?query=1', 'queries are not allowed'],
    ['http://localhost:6006#hash', 'hashes are not allowed'],
  ])('rejects %s because %s', (url, reason) => {
    expect(() => resolveStorybookTestTarget({ url })).toThrow(reason);
  });

  it('rejects an unsupported server mode', () => {
    expect(() =>
      resolveStorybookTestTarget({ serverMode: 'managed-by-someone-else' })
    ).toThrow('serverMode must be managed or external');
  });
});
