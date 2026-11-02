import { describe, expect, it } from 'vitest';

import {
  VITE_ENV_FIXTURES,
  VITE_ENV_KEYS,
} from '../../../runtime-env-fixtures';

describe('shared Vite environment fixtures', () => {
  it('provides every configured Vite variable for each consumer', () => {
    expect.assertions(3);

    const expectedKeys = [...VITE_ENV_KEYS].sort();

    for (const fixture of Object.values(VITE_ENV_FIXTURES)) {
      const fixtureKeys = Object.keys(fixture).sort();

      expect(fixtureKeys).toStrictEqual(expectedKeys);
    }
  });

  it('keeps runner-specific endpoint and telemetry contracts explicit', () => {
    expect.assertions(3);

    expect(VITE_ENV_FIXTURES.viteDevelopment).toMatchObject({
      VITE_B2C_REDIRECT_URL: 'http://localhost:3000/redirect.html',
      VITE_APPINSIGHTS_CONN_STRING: 'dummy-key',
    });
    expect(VITE_ENV_FIXTURES.vitest).toMatchObject({
      VITE_B2C_REDIRECT_URL: 'http://localhost:3000',
      VITE_APPINSIGHTS_CONN_STRING:
        'InstrumentationKey=test-instrumentation-key',
    });

    expect(VITE_ENV_FIXTURES.storybook).toMatchObject({
      VITE_B2C_REDIRECT_URL: 'http://localhost:6006',
      VITE_APPINSIGHTS_CONN_STRING: 'dummy-key',
    });
  });
});
