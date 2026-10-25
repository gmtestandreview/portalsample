import { act, render, screen } from '@testing-library/react';

import { describe, expect, it, vi } from 'vitest';

import AutoSuggest from '@/components/Inputs/AutoSuggest';

import type { AutoSuggestOption } from '@/components/Inputs/AutoSuggest/types';

const containerState = vi.hoisted(() => ({
  props: undefined as any,
}));

vi.mock(
  import('@/components/Inputs/AutoSuggest/AutoSuggestContainer'),
  () =>
    ({
      default: (props: any) => {
        containerState.props = props;
        return (
          <div>
            <span data-testid='search-term'>{props.searchTerm}</span>
            <span data-testid='loading'>{String(props.loading)}</span>
            <span data-testid='error'>{String(props.error)}</span>
            <span data-testid='no-result'>{String(props.noResult)}</span>
            <span data-testid='option-count'>
              {String(props.options.length)}
            </span>
          </div>
        );
      },
    }) satisfies __ExactMockModule<__TestMockModule32>,
);

const renderAutoSuggest = (
  getOptions = vi
    .fn<(term: string) => Promise<AutoSuggestOption<string>[]>>()
    .mockResolvedValue([]),
  onSelectedOption = vi.fn(),
  selectedOption?: string,
) => {
  render(
    <AutoSuggest
      name='suburb'
      label='Suburb'
      getOptions={getOptions}
      onSelectedOption={onSelectedOption}
      {...(selectedOption === undefined ? {} : { selectedOption })}
    />,
  );

  return { getOptions, onSelectedOption };
};

describe('autoSuggest parent state', () => {
  it('clears a selected option when the search term is emptied', async () => {
    expect.assertions(5);
    const onSelectedOption = vi.fn().mockResolvedValue(undefined);
    renderAutoSuggest(undefined, onSelectedOption, 'Sydney');

    await act(async () => {
      await containerState.props.onSearchTermChange('');
    });

    expect(onSelectedOption).toHaveBeenCalledExactlyOnceWith();
    expect(onSelectedOption.mock.calls[0]).toEqual([]);
    expect(screen.getByTestId('search-term')).toHaveTextContent('');
    expect(screen.getByTestId('option-count')).toHaveTextContent('0');
    expect(screen.getByTestId('loading')).toHaveTextContent('false');
  });
});
