import { describe, expect, it } from 'vitest';
import { getButtonClassName } from '@/components/Buttons/buttonClassName';

describe('getButtonClassName', () => {
    it('preserves an already-prefixed Bootstrap button variant', () => {
        expect(getButtonClassName('btn btn-outline-primary', 'download-link'))
            .toBe('btn btn-outline-primary download-link');
    });
});
