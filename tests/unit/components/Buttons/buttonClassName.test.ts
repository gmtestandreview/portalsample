import { describe, expect, it } from 'vitest';
import { getButtonClassName } from '@/components/Buttons/buttonClassName';

describe('getButtonClassName', () => {
    it('builds the default primary Bootstrap button class without an extra class', () => {
        expect(getButtonClassName()).toBe('btn btn-primary');
    });

    it('prefixes a variant and appends an optional class name', () => {
        expect(getButtonClassName('secondary', 'download-link')).toBe('btn btn-secondary download-link');
    });

    it('preserves an already-prefixed Bootstrap button variant', () => {
        expect(getButtonClassName('btn btn-outline-primary', 'download-link'))
            .toBe('btn btn-outline-primary download-link');
    });
});
