import { act, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import AutoSuggest from '@/components/Inputs/AutoSuggest';
import type {
  AutoSuggestContainerProps,
  AutoSuggestOption,
  AutoSuggestProps,
} from '@/components/Inputs/AutoSuggest/types';

type SelectedOption = AutoSuggestProps<string>['onSelectedOption'];
type CapturedContainerProps = {
  searchTerm: string | null | undefined;
  loading: boolean | undefined;
  error: boolean | undefined;
  noResult: boolean | undefined;
  optionCount: number;
  onSearchTermChange: AutoSuggestContainerProps<string>['onSearchTermChange'];
  onCancel: AutoSuggestContainerProps<string>['onCancel'];
};

const containerState = vi.hoisted(() => ({
  props: undefined as CapturedContainerProps | undefined,
}));

const getContainerProps = (): CapturedContainerProps => {
  if (!containerState.props) {
    throw new Error('AutoSuggest container props were not captured');
  }

  return containerState.props;
};

vi.mock(
  import('@/components/Inputs/AutoSuggest/AutoSuggestContainer'),
  () =>
    ({
      default: <T,>(props: Readonly<AutoSuggestContainerProps<T>>) => {
        containerState.props = {
          searchTerm: props.searchTerm,
          loading: props.loading,
          error: props.error,
          noResult: props.noResult,
          optionCount: props.options.length,
          onSearchTermChange: props.onSearchTermChange,
          onCancel: props.onCancel,
        };
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
      await getContainerProps().onSearchTermChange('');
    });

    expect(onSelectedOption).toHaveBeenCalledExactlyOnceWith();
    expect(onSelectedOption.mock.calls[0]).toStrictEqual([]);
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
      await getContainerProps().onSearchTermChange('syd');
    });

    expect(screen.getByTestId('option-count')).toHaveTextContent('1');

    await act(async () => {
      await getContainerProps().onSearchTermChange('sydn');
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
    act(() => {
      searchPromise = Promise.resolve(
        getContainerProps().onSearchTermChange('Sydney'),
      );
    });

    expect({
      loading: screen.getByTestId('loading').textContent,
    }).toStrictEqual({ loading: 'true' });

    act(() => {
      getContainerProps().onCancel();
    });

    expect({
      searchTerm: screen.getByTestId('search-term').textContent,
      loading: screen.getByTestId('loading').textContent,
    }).toStrictEqual({ searchTerm: 'Original', loading: 'false' });

    await act(async () => {
      resolveSearch([{ id: 'syd', displayText: 'Sydney', value: 'syd' }]);
      await searchPromise;
    });

    expect({
      searchTerm: screen.getByTestId('search-term').textContent,
      optionCount: screen.getByTestId('option-count').textContent,
      noResult: screen.getByTestId('no-result').textContent,
    }).toStrictEqual({
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
    act(() => {
      searchPromise = Promise.resolve(
        getContainerProps().onSearchTermChange('Sydney'),
      );
    });

    act(() => {
      getContainerProps().onCancel();
    });

    await act(async () => {
      rejectSearch(new Error('network unavailable'));
      await searchPromise;
    });

    expect({
      error: screen.getByTestId('error').textContent,
      optionCount: screen.getByTestId('option-count').textContent,
      loading: screen.getByTestId('loading').textContent,
    }).toStrictEqual({ error: 'false', optionCount: '0', loading: 'false' });
  });
});
