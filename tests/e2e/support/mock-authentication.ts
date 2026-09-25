import type { Page } from '@playwright/test';
import type { ScenarioState } from './scenario-state';

const AUTH_DISABLED_KEY = 'e2e-auth-disabled';

const seedMsalCache = ({ email, disabledKey }: { email: string, disabledKey: string }) => {
    if (localStorage.getItem(disabledKey) === 'true') {
        return;
    }

    const clientId = 'dev-client-id';
    const makeJwt = (claims: Record<string, unknown>) => {
        const encode = (value: Record<string, unknown>) => btoa(JSON.stringify(value))
            .replaceAll('+', '-')
            .replaceAll('/', '_')
            .replace(/=+$/, '');
        return `${encode({ alg: 'none', typ: 'JWT' })}.${encode(claims)}.mock-signature`;
    };
    const mockAccount = {
        homeAccountId: 'mock-oid.mock-tid',
        environment: 'login.microsoftonline.com',
        realm: 'mock-tid',
        username: email,
        localAccountId: 'mock-oid',
        authorityType: 'MSSTS',
        name: 'Test User',
        idTokenClaims: {
            given_name: 'Test',
            family_name: 'User',
            email,
            emails: [email],
            oid: 'mock-oid',
        },
    };
    const accountKey = `${mockAccount.homeAccountId}-${mockAccount.environment}-${mockAccount.realm}`;
    const tokenTarget = 'openid profile offline_access';
    const idTokenKey = `${mockAccount.homeAccountId}-${mockAccount.environment}-idtoken-${clientId}-${mockAccount.realm}--`;
    const accessTokenKey = `${mockAccount.homeAccountId}-${mockAccount.environment}-accesstoken-${clientId}-${mockAccount.realm}-${tokenTarget}--`;
    const nowSeconds = Math.floor(Date.now() / 1000);
    const mockIdToken = makeJwt({
        aud: clientId,
        iss: `https://${mockAccount.environment}/${mockAccount.realm}/v2.0`,
        iat: nowSeconds,
        nbf: nowSeconds,
        exp: nowSeconds + 3600,
        oid: mockAccount.localAccountId,
        tid: mockAccount.realm,
        given_name: 'Test',
        family_name: 'User',
        email,
        emails: [email],
        preferred_username: email,
    });
    const mockAccessToken = makeJwt({
        aud: clientId,
        iss: `https://${mockAccount.environment}/${mockAccount.realm}/v2.0`,
        iat: nowSeconds,
        nbf: nowSeconds,
        exp: nowSeconds + 3600,
        oid: mockAccount.localAccountId,
        tid: mockAccount.realm,
        scp: tokenTarget,
    });
    const idTokenEntity = {
        credentialType: 'IdToken',
        homeAccountId: mockAccount.homeAccountId,
        environment: mockAccount.environment,
        clientId,
        secret: mockIdToken,
        realm: mockAccount.realm,
    };
    const accessTokenEntity = {
        credentialType: 'AccessToken',
        homeAccountId: mockAccount.homeAccountId,
        environment: mockAccount.environment,
        clientId,
        secret: mockAccessToken,
        realm: mockAccount.realm,
        target: tokenTarget,
        cachedAt: nowSeconds.toString(),
        expiresOn: (nowSeconds + 3600).toString(),
        extendedExpiresOn: (nowSeconds + 7200).toString(),
        tokenType: 'Bearer',
    };

    sessionStorage.setItem('msal.account.keys', JSON.stringify([accountKey]));
    sessionStorage.setItem(accountKey, JSON.stringify(mockAccount));
    sessionStorage.setItem(idTokenKey, JSON.stringify(idTokenEntity));
    sessionStorage.setItem(accessTokenKey, JSON.stringify(accessTokenEntity));
    sessionStorage.setItem(`msal.token.keys.${clientId}`, JSON.stringify({
        idToken: [idTokenKey],
        accessToken: [accessTokenKey],
        refreshToken: [],
    }));
    sessionStorage.setItem(`msal.${clientId}.active-account`, mockAccount.localAccountId);
    sessionStorage.setItem(`msal.${clientId}.active-account-filters`, JSON.stringify({
        homeAccountId: mockAccount.homeAccountId,
        localAccountId: mockAccount.localAccountId,
        tenantId: mockAccount.realm,
        lastUpdatedAt: Date.now().toString(),
    }));
};

export async function installMockAuthentication(
    page: Page,
    state: ScenarioState,
): Promise<void> {
    const seedArgs = { email: state.email, disabledKey: AUTH_DISABLED_KEY };
    await page.addInitScript(seedMsalCache, seedArgs);
    await page.route('**/oauth2/v2.0/token', async (route) => {
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
                access_token: 'mock-access-token',
                token_type: 'Bearer',
                expires_in: 3600,
                id_token: 'mock-id-token',
                scope: 'openid profile offline_access',
            }),
        });
    });
    await page.route('**/oauth2/v2.0/logout**', async (route) => {
        await route.fulfill({
            status: 302,
            headers: { location: 'http://localhost:3000/' },
        });
    });

    if (page.url() !== 'about:blank') {
        await page.evaluate(seedMsalCache, seedArgs);
    }
}

export async function expireMockAuthentication(page: Page): Promise<void> {
    await page.evaluate((disabledKey) => {
        sessionStorage.clear();
        localStorage.clear();
        localStorage.setItem(disabledKey, 'true');
    }, AUTH_DISABLED_KEY);
}

export async function disableMockAuthenticationReseed(page: Page): Promise<void> {
    await page.evaluate((disabledKey) => {
        localStorage.setItem(disabledKey, 'true');
    }, AUTH_DISABLED_KEY);
}
