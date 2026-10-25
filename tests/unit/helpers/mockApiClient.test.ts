import { describe, expect, it, vi } from 'vitest';

import type * as WebApiClient from '../../../ClientApp/src/api/web-api-client';

import {
  createClientMock,
  createClientMockFor,
  resetClientMock,
  webApiClientModuleMock,
} from './mockApiClient';

describe('generated API client harness', () => {
  it('returns one instance however many times the client is constructed', () => {
    expect.assertions(3);
    const client = createClientMockFor('getStepStatuses');

    const first = new (client.constructor as unknown as new () => unknown)();
    const second = new (client.constructor as unknown as new () => unknown)();

    // Components build a client per effect run. A fresh instance per construction would scatter
    // call records across objects the test never holds a reference to.
    expect(first).toBe(second);
    expect(first).toBe(client.instance);
    expect(client.constructor).toHaveBeenCalledTimes(2);
  });
});

describe('generated API client harness', () => {
  it('records the auth token the component sets', () => {
    expect.assertions(1);
    const client = createClientMockFor('getStepStatuses');

    client.instance.setAuthToken('access-token');

    expect(client.setAuthToken).toHaveBeenCalledWith('access-token');
  });
});
