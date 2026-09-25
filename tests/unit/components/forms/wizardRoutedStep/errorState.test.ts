import { describe, it, expect } from 'vitest';
import { resolveErrorState } from '../../../../../ClientApp/src/components/forms/WizardForm/errorState';
import { ErrorType } from '../../../../../ClientApp/src/components/forms/WizardForm/types';
import { AZURE_WAF_SERVER_PREFIX } from '../../../../../ClientApp/src/types/wafError';

function makeError(status: number, title?: string, headers?: Record<string, string>) {
    return { status, title: title ?? '', headers: headers ?? {} };
}

describe('resolveErrorState', () => {
    describe('Load errors — HttpStatus dispatch', () => {
        it('returns notFound for 404', () => {
            expect(resolveErrorState(makeError(404), undefined, ErrorType.Load))
                .toEqual({ kind: 'notFound' });
        });

        it('returns gone for 410', () => {
            expect(resolveErrorState(makeError(410), undefined, ErrorType.Load))
                .toEqual({ kind: 'gone' });
        });

        it('returns gone for 401', () => {
            expect(resolveErrorState(makeError(401), undefined, ErrorType.Load))
                .toEqual({ kind: 'gone' });
        });

        it('returns noThirdPartyAccess for 403 with third-party title', () => {
            expect(
                resolveErrorState(makeError(403, 'No third-party access to this resource'), undefined, ErrorType.Load),
            ).toEqual({ kind: 'noThirdPartyAccess' });
        });

        it('returns serverError for 403 without third-party title', () => {
            const result = resolveErrorState(makeError(403, 'Forbidden'), undefined, ErrorType.Load);
            expect(result.kind).toBe('serverError');
        });

        it('returns loading for unrecognised HTTP status — restores the previously silent failure', () => {
            expect(resolveErrorState(makeError(500), undefined, ErrorType.Load))
                .toEqual({ kind: 'loading' });
        });

        it('returns loading for a network error with no status property', () => {
            expect(resolveErrorState(new Error('fetch failed'), undefined, ErrorType.Load))
                .toEqual({ kind: 'loading' });
        });

        it('returns none for an aborted request — stays silent', () => {
            const abort = new DOMException('The operation was aborted.', 'AbortError');
            expect(resolveErrorState(abort, undefined, ErrorType.Load))
                .toEqual({ kind: 'none' });
        });
    });

    describe('Update errors — HttpStatus dispatch', () => {
        it('returns concurrency for 409', () => {
            const err = makeError(409);
            const result = resolveErrorState(err, undefined, ErrorType.Update);
            expect(result.kind).toBe('concurrency');
        });

        it('returns wafViolation for 403 with Azure App Gateway server header (Update only)', () => {
            const err = makeError(403, 'Forbidden', { server: `${AZURE_WAF_SERVER_PREFIX}/2.5` });
            const result = resolveErrorState(err, undefined, ErrorType.Update);
            expect(result.kind).toBe('wafViolation');
        });

        it('does NOT return wafViolation on a Load error even with WAF header', () => {
            const err = makeError(403, 'Forbidden', { server: `${AZURE_WAF_SERVER_PREFIX}/2.5` });
            const result = resolveErrorState(err, undefined, ErrorType.Load);
            expect(result.kind).toBe('serverError');
        });

        it('returns serverError for 500 on Update', () => {
            const result = resolveErrorState(makeError(500), undefined, ErrorType.Update);
            expect(result.kind).toBe('serverError');
        });
    });

    describe('Custom redirect callback — fixes stale-read bug', () => {
        it('returns redirect when callback provides a location', () => {
            const cb = (code: number) => (code === 404 ? '/custom-not-found' : undefined);
            expect(resolveErrorState(makeError(404), cb, ErrorType.Load))
                .toEqual({ kind: 'redirect', location: '/custom-not-found' });
        });

        it('falls through to default dispatch when callback returns undefined', () => {
            const cb = () => undefined;
            expect(resolveErrorState(makeError(404), cb, ErrorType.Load).kind)
                .toBe('notFound');
        });

        it('redirect takes precedence over all other error kinds — stale-read fix proof', () => {
            const cb = () => '/gone-somewhere';
            const result = resolveErrorState(makeError(404), cb, ErrorType.Load);
            expect(result).toEqual({ kind: 'redirect', location: '/gone-somewhere' });
        });
    });
});
