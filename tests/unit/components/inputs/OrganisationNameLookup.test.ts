import { describe, expect, it } from 'vitest';
import { getFilteredSuggestions } from '@/components/Inputs/OrganisationNameLookup/suggestionUtils';

describe('suggestion filtering', () => {
  it('sorts matching suggestions with a case-insensitive comparator and removes duplicates', () => {
    expect.hasAssertions();

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

    expect(suggestions).toStrictEqual([
      'Alpha Pty Ltd',
      'apple Pty Ltd',
      'beta Pty Ltd',
      'Zoo Pty Ltd',
      'Zulu Pty Ltd',
    ]);
  });

  it('returns an empty array when the trimmed input is shorter than 2 characters', () => {
    expect.hasAssertions();
    expect(
      getFilteredSuggestions({
        inputValue: 'a',
        optionsFieldName: 'name',
        options: [{ name: 'Alpha Pty Ltd' }],
      }),
    ).toStrictEqual([]);

    expect(
      getFilteredSuggestions({
        inputValue: '  ',
        optionsFieldName: 'name',
        options: [{ name: 'Alpha Pty Ltd' }],
      }),
    ).toStrictEqual([]);
  });

  it('returns empty when parentValue is set but parentOptionsName is not provided', () => {
    expect.hasAssertions();

    const suggestions = getFilteredSuggestions({
      inputValue: 'pty',
      optionsFieldName: 'name',
      options: [{ name: 'Alpha Pty Ltd', parent: 'Acme' }],
      parentValue: 'acme',
    });

    expect(suggestions).toStrictEqual([]);
  });

  it('applies the same ordering when parent filtering is enabled', () => {
    expect.hasAssertions();

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

    expect(suggestions).toStrictEqual([
      'Alpha Pty Ltd',
      'apple Pty Ltd',
      'beta Pty Ltd',
      'Zoo Pty Ltd',
    ]);
  });
});
