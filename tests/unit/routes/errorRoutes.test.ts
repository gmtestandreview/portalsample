import { describe, it, expect } from 'vitest';
import getUnexpectedErrorRoute from '../../../ClientApp/src/routes/common/errorRoutes';
import { HttpStatusCode } from '../../../ClientApp/src/types';

describe('getUnexpectedErrorRoute', () => {
    it('maps 403 Forbidden to /forbidden', () => {
        expect(getUnexpectedErrorRoute(HttpStatusCode.Forbidden)).toBe('/forbidden');
    });

    it('maps 409 Conflict to /conflict', () => {
        expect(getUnexpectedErrorRoute(HttpStatusCode.Conflict)).toBe('/conflict');
    });

    it('maps 410 Gone to /no-longer-available', () => {
        expect(getUnexpectedErrorRoute(HttpStatusCode.Gone)).toBe('/no-longer-available');
    });

    it('maps 412 PreconditionFailed to /precondition-failed', () => {
        expect(getUnexpectedErrorRoute(HttpStatusCode.PreconditionFailed)).toBe('/precondition-failed');
    });

    it('maps 422 UnprocessableEntity to /unprocessable', () => {
        expect(getUnexpectedErrorRoute(HttpStatusCode.UnprocessableEntity)).toBe('/unprocessable');
    });

    it('maps 500 InternalServerError to /server-error', () => {
        expect(getUnexpectedErrorRoute(HttpStatusCode.InternalServerError)).toBe('/server-error');
    });

    it('maps 503 ServiceUnavailable to /service-unavailable', () => {
        expect(getUnexpectedErrorRoute(HttpStatusCode.ServiceUnavailable)).toBe('/service-unavailable');
    });

    it('maps an unmapped status code (404) to /server-error (default)', () => {
        expect(getUnexpectedErrorRoute(HttpStatusCode.NotFound)).toBe('/server-error');
    });

    it('maps undefined to /server-error (default)', () => {
        expect(getUnexpectedErrorRoute(undefined)).toBe('/server-error');
    });
});
