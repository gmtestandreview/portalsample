import { describe, expect, it, vi } from 'vitest';

import { onLog } from '../../../.storybook/rollupOnLog';

describe('storybook rollup onLog filter', () => {
  it('suppresses vendor INVALID_ANNOTATION originating in node_modules', () => {
    expect.assertions(1);
    const handler = vi.fn();

    onLog(
      'warn',
      {
        code: 'INVALID_ANNOTATION',
        message:
          'node_modules/@microsoft/applicationinsights-web/dist/es5/... pure annotation',
      },
      handler,
    );

    expect(handler).not.toHaveBeenCalled();
  });
});

describe('storybook rollup onLog filter', () => {
  it('suppresses PLUGIN_TIMINGS regardless of message', () => {
    expect.assertions(1);
    const handler = vi.fn();

    onLog(
      'info',
      { code: 'PLUGIN_TIMINGS', message: 'generate bundle 12ms' },
      handler,
    );

    expect(handler).not.toHaveBeenCalled();
  });
});

describe('storybook rollup onLog filter', () => {
  it('forwards a first-party INVALID_ANNOTATION untouched', () => {
    expect.assertions(1);
    const handler = vi.fn();
    const log = {
      code: 'INVALID_ANNOTATION',
      message:
        'ClientApp/src/instrumentation/AppInsightsService.ts bad annotation',
    };

    onLog('warn', log, handler);

    expect(handler).toHaveBeenCalledExactlyOnceWith('warn', log);
  });
});

describe('storybook rollup onLog filter', () => {
  it('forwards an INVALID_ANNOTATION with no message (nullish path)', () => {
    expect.assertions(1);
    const handler = vi.fn();
    const log = { code: 'INVALID_ANNOTATION' };

    onLog('warn', log, handler);

    expect(handler).toHaveBeenCalledExactlyOnceWith('warn', log);
  });
});

describe('storybook rollup onLog filter', () => {
  it.each([
    { code: 'CIRCULAR_DEPENDENCY', message: 'a -> b -> a' },
    { code: 'UNRESOLVED_IMPORT', message: 'cannot resolve ./missing' },
    { code: 'PLUGIN_WARNING', message: 'node_modules/some-plugin blew up' },
    { code: 'SOURCEMAP_ERROR', message: 'node_modules/x missing sourcemap' },
    {},
  ])('forwards other diagnostics untouched: %o', (log) => {
    expect.assertions(1);
    const handler = vi.fn();

    onLog('warn', log, handler);

    expect(handler).toHaveBeenCalledExactlyOnceWith('warn', log);
  });
});
