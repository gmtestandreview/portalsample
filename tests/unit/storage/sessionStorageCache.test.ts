import { describe, it, expect, beforeEach } from 'vitest';

import SessionStorageCache from '../../../ClientApp/src/storage/sessionStorageCache';

describe(SessionStorageCache, () => {
  beforeEach(() => {
    globalThis.sessionStorage.clear();
  });
  describe('getItem', () => {
    it('returns undefined for a missing key', () => {
      expect.assertions(1);
      expect(SessionStorageCache().getItem('missing-key')).toBeUndefined();
    });
  });
});

describe(SessionStorageCache, () => {
  beforeEach(() => {
    globalThis.sessionStorage.clear();
  });
  describe('getItem', () => {
    it('returns the parsed value for a valid JSON entry', () => {
      expect.assertions(1);
      globalThis.sessionStorage.setItem('test-key', JSON.stringify({ id: 42 }));

      expect(SessionStorageCache().getItem<{ id: number }>('test-key')).toEqual(
        { id: 42 },
      );
    });
  });
});

describe(SessionStorageCache, () => {
  beforeEach(() => {
    globalThis.sessionStorage.clear();
  });
  describe('getItem', () => {
    it('returns undefined and removes the key for malformed JSON (fail-soft)', () => {
      expect.assertions(2);
      globalThis.sessionStorage.setItem('bad-key', 'not-json{{{');
      const result = SessionStorageCache().getItem('bad-key');

      expect(result).toBeUndefined();
      expect(globalThis.sessionStorage.getItem('bad-key')).toBeNull();
    });
  });
});

describe(SessionStorageCache, () => {
  beforeEach(() => {
    globalThis.sessionStorage.clear();
  });
  describe('getItem', () => {
    it('returns undefined for an empty string value', () => {
      expect.assertions(1);
      globalThis.sessionStorage.setItem('empty-key', '');

      expect(SessionStorageCache().getItem('empty-key')).toBeUndefined();
    });
  });
});
