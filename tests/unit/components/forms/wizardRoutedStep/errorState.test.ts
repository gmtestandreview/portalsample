import { describe, it, expect } from 'vitest';

import { resolveErrorState } from '../../../../../ClientApp/src/components/forms/WizardForm/errorState';

import { ErrorType } from '../../../../../ClientApp/src/components/forms/WizardForm/types';

import { AZURE_WAF_SERVER_PREFIX } from '../../../../../ClientApp/src/types/wafError';

function makeError(
  status: number,
  title?: string,
  headers?: Record<string, string>,
) {
  return { status, title: title ?? '', headers: headers ?? {} };
}

describe(resolveErrorState, () => {
  describe('load errors — HttpStatus dispatch', () => {
    it('returns notFound for 404', () => {
      expect.assertions(1);
      expect(
        resolveErrorState(makeError(404), undefined, ErrorType.Load),
      ).toEqual({ kind: 'notFound' });
    });
  });
});

describe(resolveErrorState, () => {
  describe('load errors — HttpStatus dispatch', () => {
    it('returns gone for 410', () => {
      expect.assertions(1);
      expect(
        resolveErrorState(makeError(410), undefined, ErrorType.Load),
      ).toEqual({ kind: 'gone' });
    });
  });
});

describe(resolveErrorState, () => {
  describe('load errors — HttpStatus dispatch', () => {
    it('returns gone for 401', () => {
      expect.assertions(1);
      expect(
        resolveErrorState(makeError(401), undefined, ErrorType.Load),
      ).toEqual({ kind: 'gone' });
    });
  });
});

describe(resolveErrorState, () => {
  describe('load errors — HttpStatus dispatch', () => {
    it('returns noThirdPartyAccess for 403 with third-party title', () => {
      expect.assertions(1);
      expect(
        resolveErrorState(
          makeError(403, 'No third-party access to this resource'),
          undefined,
          ErrorType.Load,
        ),
      ).toEqual({ kind: 'noThirdPartyAccess' });
    });
  });
});

describe(resolveErrorState, () => {
  describe('load errors — HttpStatus dispatch', () => {
    it('returns serverError for 403 without third-party title', () => {
      expect.assertions(1);
      const result = resolveErrorState(
        makeError(403, 'Forbidden'),
        undefined,
        ErrorType.Load,
      );

      expect(result.kind).toBe('serverError');
    });
  });
});
