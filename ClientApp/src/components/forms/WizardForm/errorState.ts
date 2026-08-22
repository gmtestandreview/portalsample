import type { ProblemDetails } from '../../../api/web-api-client';
import { HttpStatusCode } from '../../../types';
import { isWafError } from '../../../types/wafError';
import { ErrorType } from './types';
import type { WizardStepError } from './types';

/**
 * Classifies a 403 Forbidden error into the appropriate WizardStepError variant.
 * Extracted from resolveErrorState to reduce its cognitive complexity (SonarLint S3776).
 */
function resolveForbiddenState(
    error: unknown,
    serverError: ProblemDetails,
    errorType: ErrorType,
): WizardStepError {
    if (serverError.title?.includes('No third-party access')) return { kind: 'noThirdPartyAccess' };
    if (errorType === ErrorType.Update && isWafError(error)) {
        return { kind: 'wafViolation', details: serverError };
    }
    return { kind: 'serverError', details: serverError };
}

/**
 * Pure function: maps a caught error to a WizardStepError discriminant.
 * Called once per catch block; returns a single value so setState is called
 * once, eliminating the stale-read class of bug present when checking state
 * immediately after calling setState.
 */
export function resolveErrorState(
    error: unknown,
    getRedirectionLocationOnError: ((errorCode: number, errorType: ErrorType) => string | undefined) | undefined,
    errorType: ErrorType,
): WizardStepError {
    const serverError = error as ProblemDetails;

    // Custom redirect is checked FIRST using the local return value — not the
    // React state variable (which would be stale at this point in the event loop).
    if (getRedirectionLocationOnError && serverError?.status) {
        const location = getRedirectionLocationOnError(serverError.status, errorType);
        if (location) return { kind: 'redirect', location };
    }

    if (serverError?.status === HttpStatusCode.NotFound) return { kind: 'notFound' };
    if (serverError?.status === 401) return { kind: 'gone' };
    if (serverError?.status === HttpStatusCode.Gone) return { kind: 'gone' };
    if (serverError?.status === HttpStatusCode.Forbidden) return resolveForbiddenState(error, serverError, errorType);
    if (serverError?.status === HttpStatusCode.Conflict) return { kind: 'concurrency', details: serverError };

    // Load path: abort stays silent; every other unhandled error now surfaces as
    // a loading error. This restores the previously commented-out setLoadingError
    // branch that was suppressing all unrecognised network failures silently.
    if (errorType === ErrorType.Load) {
        if ((error as DOMException)?.name === 'AbortError') return { kind: 'none' };
        return { kind: 'loading' };
    }

    return { kind: 'serverError', details: serverError };
}
