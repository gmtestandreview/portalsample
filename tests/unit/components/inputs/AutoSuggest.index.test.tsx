import { act, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import AutoSuggest from '@/components/Inputs/AutoSuggest';
import type {
  AutoSuggestOption,
  AutoSuggestProps,
} from '@/components/Inputs/AutoSuggest/types';

type SelectedOption = AutoSuggestProps<string>['onSelectedOption'];

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
  onSelectedOption = vi.fn<SelectedOption>(),
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
    expect.hasAssertions();

    const onSelectedOption = vi
      .fn<SelectedOption>()
      .mockResolvedValue(undefined);
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

  it('reports a failed search and clears the previous suggestions', async () => {
    expect.hasAssertions();

    // The stale-response tests below cover a rejection arriving after the field moved on. This
    // is the live one: the search that is still current failed, so the user is told rather than
    // left looking at suggestions from an earlier term.
    const getOptions = vi
      .fn<(term: string) => Promise<AutoSuggestOption<string>[]>>()
      .mockResolvedValueOnce([
        { id: 'sydney', displayText: 'Sydney', value: 'sydney' },
      ])
      .mockRejectedValueOnce(new Error('lookup unavailable'));
    renderAutoSuggest(getOptions);

    await act(async () => {
      await containerState.props.onSearchTermChange('syd');
    });

    expect(screen.getByTestId('option-count')).toHaveTextContent('1');

    await act(async () => {
      await containerState.props.onSearchTermChange('sydn');
    });

    expect(screen.getByTestId('error')).toHaveTextContent('true');
    expect(screen.getByTestId('option-count')).toHaveTextContent('0');
    expect(screen.getByTestId('loading')).toHaveTextContent('false');
  });

  it('ignores a stale successful search response after cancel resets the field', async () => {
    expect.hasAssertions();

    let resolveSearch: (
      options: AutoSuggestOption<string>[],
    ) => void = () => {};
    const getOptions = vi.fn<
      (term: string) => Promise<AutoSuggestOption<string>[]>
    >(
      () =>
        new Promise((resolve) => {
          resolveSearch = resolve;
        }),
    );
    renderAutoSuggest(getOptions, vi.fn(), 'Original');

    let searchPromise: Promise<void>;
    await act(async () => {
      searchPromise = containerState.props.onSearchTermChange('Sydney');
    });

    expect({
      loading: screen.getByTestId('loading').textContent,
    }).toEqual({ loading: 'true' });

    await act(async () => {
      containerState.props.onCancel();
    });

    expect({
      searchTerm: screen.getByTestId('search-term').textContent,
      loading: screen.getByTestId('loading').textContent,
    }).toEqual({ searchTerm: 'Original', loading: 'false' });

    await act(async () => {
      resolveSearch([{ id: 'syd', displayText: 'Sydney', value: 'syd' }]);
      await searchPromise;
    });

    expect({
      searchTerm: screen.getByTestId('search-term').textContent,
      optionCount: screen.getByTestId('option-count').textContent,
      noResult: screen.getByTestId('no-result').textContent,
    }).toEqual({
      searchTerm: 'Original',
      optionCount: '0',
      noResult: 'false',
    });
  });

  it('ignores a stale failed search response after cancel resets the field', async () => {
    expect.hasAssertions();

    let rejectSearch: (error: Error) => void = () => {};
    const getOptions = vi.fn<
      (term: string) => Promise<AutoSuggestOption<string>[]>
    >(
      () =>
        new Promise((_, reject) => {
          rejectSearch = reject;
        }),
    );
    renderAutoSuggest(getOptions);

    let searchPromise: Promise<void>;
    await act(async () => {
      searchPromise = containerState.props.onSearchTermChange('Sydney');
    });

    await act(async () => {
      containerState.props.onCancel();
    });

    await act(async () => {
      rejectSearch(new Error('network unavailable'));
      await searchPromise;
    });

    expect({
      error: screen.getByTestId('error').textContent,
      optionCount: screen.getByTestId('option-count').textContent,
      loading: screen.getByTestId('loading').textContent,
    }).toEqual({ error: 'false', optionCount: '0', loading: 'false' });
  });
});
