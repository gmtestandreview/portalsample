import { describe, expect, it } from 'vitest';

import { resolveStorybookTestTarget } from '../../../.storybook/storybook-test-target';
import { resolveStorybookTestTargetImplementation } from '../../../.storybook/storybook-test-target.mjs';

// eslint-disable-next-line vitest/valid-title -- function suite titles are required by vitest/prefer-describe-function-title.
describe(resolveStorybookTestTarget, () => {
  it('derives the managed default target on port 6006', () => {
    expect.assertions(1);
    expect(resolveStorybookTestTarget({ ci: false })).toStrictEqual({
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
    expect.assertions(1);
    expect(
      resolveStorybookTestTarget({
        url: 'http://127.0.0.1:6007',
        serverMode: 'external',
        ci: true,
      }),
    ).toStrictEqual({
      baseURL: 'http://127.0.0.1:6007',
      mcpURL: 'http://127.0.0.1:6007/mcp',
      command:
        'node --max-old-space-size=8192 ./node_modules/storybook/dist/bin/dispatcher.js dev --host 127.0.0.1 -p 6007 --no-open',
      webServer: undefined,
    });
  });

  it('supports an external HTTPS target on a remote host', () => {
    expect.assertions(1);
    expect(
      resolveStorybookTestTarget({
        url: 'https://storybook.example.test:8443',
        serverMode: 'external',
        ci: true,
      }),
    ).toStrictEqual({
      baseURL: 'https://storybook.example.test:8443',
      mcpURL: 'https://storybook.example.test:8443/mcp',
      command:
        'node --max-old-space-size=8192 ./node_modules/storybook/dist/bin/dispatcher.js dev --host storybook.example.test -p 8443 --no-open',
      webServer: undefined,
    });
  });

  it.each([
    {
      url: 'http://localhost:6006',
      serverMode: 'managed' as const,
      ci: false,
    },
    {
      url: 'http://127.0.0.1:6007',
      serverMode: 'external' as const,
      ci: true,
    },
    {
      url: 'https://storybook.example.test:8443',
      serverMode: 'external' as const,
      ci: true,
    },
  ])(
    'keeps the TypeScript adapter in parity with the runtime resolver',
    (options) => {
      expect.assertions(1);
      expect(resolveStorybookTestTarget(options)).toStrictEqual(
        resolveStorybookTestTargetImplementation(options),
      );
    },
  );

  it.each([
    ['https://localhost:6006', 'managed targets must use http', 'managed'],
    [
      'http://example.test:6006',
      'only loopback hosts are supported',
      'managed',
    ],
    [
      'http://example.test:6006',
      'only loopback hosts are supported',
      'external',
    ],
    ['http://localhost', 'an explicit port is required', 'managed'],
    ['http://localhost:0', 'the port must be in the valid range', 'managed'],
    [
      'http://localhost:65536',
      'the port must be in the valid range',
      'managed',
    ],
    [
      'http://user:pass@localhost:6006',
      'credentials are not allowed',
      'managed',
    ],
    ['http://localhost:6006/mcp', 'paths are not allowed', 'managed'],
    ['http://localhost:6006?query=1', 'queries are not allowed', 'managed'],
    ['http://localhost:6006#hash', 'hashes are not allowed', 'managed'],
  ])('rejects %s because %s', (url, reason, serverMode) => {
    expect.assertions(1);
    expect(() => resolveStorybookTestTarget({ url, serverMode })).toThrow(
      reason,
    );
  });

  it('rejects an unsupported server mode', () => {
    expect.assertions(1);
    expect(() =>
      resolveStorybookTestTarget({ serverMode: 'managed-by-someone-else' }),
    ).toThrow('serverMode must be managed or external');
  });
});
