import { describe, it, expect, beforeEach } from 'vitest';
import SessionStorageCache from '../../../ClientApp/src/storage/sessionStorageCache';

describe('SessionStorageCache', () => {
    beforeEach(() => {
        globalThis.sessionStorage.clear();
    });

    describe('getItem', () => {
        it('returns undefined for a missing key', () => {
            expect(SessionStorageCache().getItem('missing-key')).toBeUndefined();
        });

        it('returns the parsed value for a valid JSON entry', () => {
            globalThis.sessionStorage.setItem('test-key', JSON.stringify({ id: 42 }));
            expect(SessionStorageCache().getItem<{ id: number }>('test-key')).toEqual({ id: 42 });
        });

        it('returns undefined and removes the key for malformed JSON (fail-soft)', () => {
            globalThis.sessionStorage.setItem('bad-key', 'not-json{{{');
            const result = SessionStorageCache().getItem('bad-key');
            expect(result).toBeUndefined();
            expect(globalThis.sessionStorage.getItem('bad-key')).toBeNull();
        });

        it('returns undefined for an empty string value', () => {
            globalThis.sessionStorage.setItem('empty-key', '');
            expect(SessionStorageCache().getItem('empty-key')).toBeUndefined();
        });
    });

    describe('setItem', () => {
        it('stores a value as JSON-serialised string', () => {
            SessionStorageCache().setItem({ name: 'Acme' }, 'org');
            expect(globalThis.sessionStorage.getItem('org')).toBe(JSON.stringify({ name: 'Acme' }));
        });

        it('stored value is retrievable via getItem', () => {
            SessionStorageCache().setItem([1, 2, 3], 'list');
            expect(SessionStorageCache().getItem<number[]>('list')).toEqual([1, 2, 3]);
        });
    });

    describe('removeItem', () => {
        it('removes an existing key', () => {
            globalThis.sessionStorage.setItem('to-remove', '"value"');
            SessionStorageCache().removeItem('to-remove');
            expect(globalThis.sessionStorage.getItem('to-remove')).toBeNull();
        });

        it('does not throw when removing a non-existent key', () => {
            expect(() => SessionStorageCache().removeItem('ghost-key')).not.toThrow();
        });
    });

    describe('clear', () => {
        it('removes all entries from sessionStorage', () => {
            globalThis.sessionStorage.setItem('a', '"1"');
            globalThis.sessionStorage.setItem('b', '"2"');
            SessionStorageCache().clear();
            expect(globalThis.sessionStorage.length).toBe(0);
        });
    });
});
