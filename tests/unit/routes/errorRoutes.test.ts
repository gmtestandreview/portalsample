import { describe, it, expect } from 'vitest';

import getUnexpectedErrorRoute from '../../../ClientApp/src/routes/common/errorRoutes';

import { HttpStatusCode } from '../../../ClientApp/src/types';

describe(getUnexpectedErrorRoute, () => {
  it('maps 403 Forbidden to /forbidden', () => {
    expect.assertions(1);
    expect(getUnexpectedErrorRoute(HttpStatusCode.Forbidden)).toBe(
      '/forbidden',
    );
  });
});

describe(getUnexpectedErrorRoute, () => {
  it('maps 409 Conflict to /conflict', () => {
    expect.assertions(1);
    expect(getUnexpectedErrorRoute(HttpStatusCode.Conflict)).toBe('/conflict');
  });
});

describe(getUnexpectedErrorRoute, () => {
  it('maps 410 Gone to /no-longer-available', () => {
    expect.assertions(1);
    expect(getUnexpectedErrorRoute(HttpStatusCode.Gone)).toBe(
      '/no-longer-available',
    );
  });
});

describe(getUnexpectedErrorRoute, () => {
  it('maps 412 PreconditionFailed to /precondition-failed', () => {
    expect.assertions(1);
    expect(getUnexpectedErrorRoute(HttpStatusCode.PreconditionFailed)).toBe(
      '/precondition-failed',
    );
  });
});

describe(getUnexpectedErrorRoute, () => {
  it('maps 422 UnprocessableEntity to /unprocessable', () => {
    expect.assertions(1);
    expect(getUnexpectedErrorRoute(HttpStatusCode.UnprocessableEntity)).toBe(
      '/unprocessable',
    );
  });
});
