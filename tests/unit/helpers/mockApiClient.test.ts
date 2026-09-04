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
        const client = createClientMockFor('getStepStatuses');

        const first = new (client.constructor as unknown as new () => unknown)();
        const second = new (client.constructor as unknown as new () => unknown)();

        // Components build a client per effect run. A fresh instance per construction would scatter
        // call records across objects the test never holds a reference to.
        expect(first).toBe(second);
        expect(first).toBe(client.instance);
        expect(client.constructor).toHaveBeenCalledTimes(2);
    });

    it('records the auth token the component sets', () => {
        const client = createClientMockFor('getStepStatuses');

        client.instance.setAuthToken('access-token');

        expect(client.setAuthToken).toHaveBeenCalledWith('access-token');
    });

    it('exposes each named method as an independently configurable mock', async () => {
        const client = createClientMockFor('getStepStatuses', 'getDocuments');

        client.methods.getStepStatuses.mockResolvedValue([{ name: 'step' }]);
        client.methods.getDocuments.mockRejectedValue(new Error('nope'));

        await expect(client.instance.getStepStatuses()).resolves.toEqual([{ name: 'step' }]);
        await expect(client.instance.getDocuments()).rejects.toThrow('nope');
    });

    it('accepts pre-built method mocks', () => {
        const getStepStatuses = vi.fn().mockReturnValue('value');
        const client = createClientMock({ getStepStatuses });

        expect(client.instance.getStepStatuses()).toBe('value');
    });

    it('keeps every non-client export in place when building the module mock', () => {
        const original = {
            ApplicationType: { QuoteRequest: 'QuoteRequest' },
            ApplicationClient: class Real {},
        } as unknown as typeof WebApiClient;
        const client = createClientMockFor('getApplications');

        const moduleMock = webApiClientModuleMock(original, { ApplicationClient: client });

        // The generated module also exports the enums components compare against. Replacing the
        // whole module with a bare object turns those into undefined, and the component then fails
        // an equality check for a reason that looks nothing like the cause.
        expect(moduleMock.ApplicationType).toEqual({ QuoteRequest: 'QuoteRequest' });
        expect(moduleMock.ApplicationClient).toBe(client.constructor);
    });

    it('clears constructor, token and method records on reset', () => {
        const client = createClientMockFor('getStepStatuses');

        new (client.constructor as unknown as new () => unknown)();
        client.instance.setAuthToken('access-token');
        client.instance.getStepStatuses();

        resetClientMock(client);

        expect(client.constructor).not.toHaveBeenCalled();
        expect(client.setAuthToken).not.toHaveBeenCalled();
        expect(client.methods.getStepStatuses).not.toHaveBeenCalled();
    });
});
