export const AZURE_WAF_SERVER_PREFIX = 'Microsoft-Azure-Application-Gateway';

export interface WafErrorShape {
    headers: {
        server: string;
    };
}

/**
 * Type predicate: returns true when `error` carries an Azure Application
 * Gateway server header, indicating the request was blocked by the WAF.
 *
 * Works for any HTTP status code — the detection heuristic is the server
 * header, not the status code. Accepts `unknown` so callers need no cast.
 */
export function isWafError(error: unknown): error is WafErrorShape {
    if (error === null || typeof error !== 'object') return false;
    const candidate = error as Record<string, unknown>;
    if (candidate.headers === null || typeof candidate.headers !== 'object') return false;
    const headers = candidate.headers as Record<string, unknown>;
    return (
        typeof headers.server === 'string' &&
        headers.server.startsWith(AZURE_WAF_SERVER_PREFIX)
    );
}
