import { describe, it, expect } from 'vitest';
import SessionStorageCache from '../../../ClientApp/src/storage/sessionStorageCache';

// eslint-disable-next-line vitest/valid-title -- function suite titles are required by vitest/prefer-describe-function-title.
describe(SessionStorageCache, () => {
  const clearSessionStorage = () => globalThis.sessionStorage.clear();

  describe('getItem', () => {
    it('returns undefined for a missing key', () => {
      expect.hasAssertions();

      clearSessionStorage();

      expect(SessionStorageCache().getItem('missing-key')).toBeUndefined();
    });

    it('returns the parsed value for a valid JSON entry', () => {
      expect.hasAssertions();

      clearSessionStorage();

      globalThis.sessionStorage.setItem('test-key', JSON.stringify({ id: 42 }));

      expect(
        SessionStorageCache().getItem<{ id: number }>('test-key'),
      ).toStrictEqual({ id: 42 });
    });

    it('returns undefined and removes the key for malformed JSON (fail-soft)', () => {
      expect.hasAssertions();

      clearSessionStorage();

      globalThis.sessionStorage.setItem('bad-key', 'not-json{{{');
      const result = SessionStorageCache().getItem('bad-key');

      expect(result).toBeUndefined();
      expect(globalThis.sessionStorage.getItem('bad-key')).toBeNull();
    });

    it('returns undefined for an empty string value', () => {
      expect.hasAssertions();

      clearSessionStorage();

      globalThis.sessionStorage.setItem('empty-key', '');

      expect(SessionStorageCache().getItem('empty-key')).toBeUndefined();
    });
  });

  describe('setItem', () => {
    it('stores a value as JSON-serialised string', () => {
      expect.hasAssertions();

      clearSessionStorage();

      SessionStorageCache().setItem({ name: 'Acme' }, 'org');

      expect(globalThis.sessionStorage.getItem('org')).toBe(
        JSON.stringify({ name: 'Acme' }),
      );
    });

    it('stored value is retrievable via getItem', () => {
      expect.hasAssertions();

      clearSessionStorage();

      SessionStorageCache().setItem([1, 2, 3], 'list');

      expect(SessionStorageCache().getItem<number[]>('list')).toStrictEqual([
        1, 2, 3,
      ]);
    });
  });

  describe('removeItem', () => {
    it('removes an existing key', () => {
      expect.hasAssertions();

      clearSessionStorage();

      globalThis.sessionStorage.setItem('to-remove', '"value"');
      SessionStorageCache().removeItem('to-remove');

      expect(globalThis.sessionStorage.getItem('to-remove')).toBeNull();
    });

    it('does not throw when removing a non-existent key', () => {
      expect.hasAssertions();

      clearSessionStorage();

      expect(() => SessionStorageCache().removeItem('ghost-key')).not.toThrow();
    });
  });

  describe('clear', () => {
    it('removes all entries from sessionStorage', () => {
      expect.hasAssertions();

      clearSessionStorage();

      globalThis.sessionStorage.setItem('a', '"1"');
      globalThis.sessionStorage.setItem('b', '"2"');
      SessionStorageCache().clear();

      expect(globalThis.sessionStorage).toHaveLength(0);
    });
  });
});
