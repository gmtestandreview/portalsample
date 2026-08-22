import { beforeEach, describe, expect, it } from 'vitest';
import { AuthorizedApiBase } from '../../../ClientApp/src/api/web-api-client';

class TestClient extends AuthorizedApiBase {
    public exposeTransformOptions(options: any): Promise<any> {
        return this.transformOptions(options);
    }
}

describe('AuthorizedApiBase', () => {
    beforeEach(() => {
        globalThis.sessionStorage.clear();
    });

    it('captures TargetOrganisationAbn when each client is constructed', async () => {
        globalThis.sessionStorage.setItem(
            'targetOrganisation',
            JSON.stringify({ targetOrganisationAbn: '11111111111' }),
        );
        const client = new TestClient();
        client.setAuthToken('test-token');

        const firstOptions = await client.exposeTransformOptions({ headers: { Existing: 'header' } });

        expect(firstOptions.headers).toEqual({
            Existing: 'header',
            Authorization: 'Bearer test-token',
            TargetOrganisationAbn: '11111111111',
        });

        globalThis.sessionStorage.setItem(
            'targetOrganisation',
            JSON.stringify({ targetOrganisationAbn: '22222222222' }),
        );

        const secondOptions = await client.exposeTransformOptions({ headers: { Existing: 'header' } });

        expect(secondOptions.headers).toEqual({
            Existing: 'header',
            Authorization: 'Bearer test-token',
            TargetOrganisationAbn: '11111111111',
        });

        const nextClient = new TestClient();
        nextClient.setAuthToken('test-token');
        const nextClientOptions = await nextClient.exposeTransformOptions({ headers: { Existing: 'header' } });

        expect(nextClientOptions.headers).toEqual({
            Existing: 'header',
            Authorization: 'Bearer test-token',
            TargetOrganisationAbn: '22222222222',
        });
    });

    it('does not parse later sessionStorage changes when the client captured no target organisation', async () => {
        const client = new TestClient();
        client.setAuthToken('test-token');
        globalThis.sessionStorage.setItem('targetOrganisation', 'not-json{{{');

        await expect(client.exposeTransformOptions({ headers: { Existing: 'header' } })).resolves.toEqual({
            headers: {
                Existing: 'header',
                Authorization: 'Bearer test-token',
            },
        });
    });

});
