import { describe, expect, it } from 'vitest';
import { getFilteredSuggestions } from '@/components/Inputs/OrganisationNameLookup/suggestionUtils';

describe('getFilteredSuggestions', () => {
    it('sorts matching suggestions with a case-insensitive comparator and removes duplicates', () => {
        const suggestions = getFilteredSuggestions({
            inputValue: 'pty',
            optionsFieldName: 'name',
            options: [
                { name: 'Zoo Pty Ltd', parent: 'Acme' },
                { name: 'apple Pty Ltd', parent: 'Acme' },
                { name: 'Alpha Pty Ltd', parent: 'Acme' },
                { name: 'apple Pty Ltd', parent: 'Acme' },
                { name: 'beta Pty Ltd', parent: 'Acme' },
                { name: 'Zulu Pty Ltd', parent: 'Other' },
            ],
        });

        expect(suggestions).toEqual([
            'Alpha Pty Ltd',
            'apple Pty Ltd',
            'beta Pty Ltd',
            'Zoo Pty Ltd',
            'Zulu Pty Ltd',
        ]);
    });

    it('returns an empty array when the trimmed input is shorter than 2 characters', () => {
        expect(getFilteredSuggestions({
            inputValue: 'a',
            optionsFieldName: 'name',
            options: [{ name: 'Alpha Pty Ltd' }],
        })).toEqual([]);

        expect(getFilteredSuggestions({
            inputValue: '  ',
            optionsFieldName: 'name',
            options: [{ name: 'Alpha Pty Ltd' }],
        })).toEqual([]);
    });

    it('returns empty when parentValue is set but parentOptionsName is not provided', () => {
        const suggestions = getFilteredSuggestions({
            inputValue: 'pty',
            optionsFieldName: 'name',
            options: [{ name: 'Alpha Pty Ltd', parent: 'Acme' }],
            parentValue: 'acme',
        });
        expect(suggestions).toEqual([]);
    });

    it('applies the same ordering when parent filtering is enabled', () => {
        const suggestions = getFilteredSuggestions({
            inputValue: 'pty',
            optionsFieldName: 'name',
            options: [
                { name: 'Zoo Pty Ltd', parent: 'Acme' },
                { name: 'apple Pty Ltd', parent: 'Acme' },
                { name: 'Alpha Pty Ltd', parent: 'Acme' },
                { name: 'beta Pty Ltd', parent: 'Acme' },
                { name: 'Zulu Pty Ltd', parent: 'Other' },
            ],
            parentValue: 'acme',
            parentOptionsName: 'parent',
        });

        expect(suggestions).toEqual([
            'Alpha Pty Ltd',
            'apple Pty Ltd',
            'beta Pty Ltd',
            'Zoo Pty Ltd',
        ]);
    });
});
