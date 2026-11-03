import { act, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import RhfAutoSuggest from '@/components/Inputs/RhfAutoSuggest';

type SelectedOption = AutoSuggestProps<string>['onSelectedOption'];
import type {
  AutoSuggestOption,
  AutoSuggestProps,
} from '@/components/Inputs/AutoSuggest/types';

interface MockContainerProps {
  onCancel: () => void;
  onSearchTermChange: (term: string) => Promise<void>;
  onSelectedOption: (option: AutoSuggestOption<string>) => Promise<void>;
  options: AutoSuggestOption<string>[];
  searchTerm: string;
  loading: boolean;
  error: boolean;
  noResult: boolean;
}

const containerState = vi.hoisted(() => ({
  props: undefined as MockContainerProps | undefined,
}));

vi.mock(
  import('@/components/Inputs/RhfAutoSuggest/RhfAutoSuggestContainer'),
  (() =>
    ({
      default: (props: MockContainerProps) => {
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
    }) satisfies __ExactMockModule<__TestMockModule36>) as unknown as __DynamicPartialMockFactory<__TestMockModule36>,
);

const options: AutoSuggestOption<string>[] = [
  { id: 'sydney', displayText: 'Sydney', value: 'sydney' },
];

const renderAutoSuggest = (
  getOptions = vi
    .fn<(term: string) => Promise<AutoSuggestOption<string>[]>>()
    .mockResolvedValue([]),
  onSelectedOption = vi.fn<SelectedOption>(),
  selectedOption?: string,
) => {
  render(
    <RhfAutoSuggest
      name='suburb'
      label='Suburb'
      getOptions={getOptions}
      onSelectedOption={onSelectedOption}
      {...(selectedOption === undefined ? {} : { selectedOption })}
    />,
  );

  return { getOptions, onSelectedOption };
};

describe('rhfAutoSuggest parent state', () => {
  it('loads options, reports no results and reports lookup failures', async () => {
    expect.hasAssertions();

    const getOptions = vi
      .fn<(term: string) => Promise<AutoSuggestOption<string>[]>>()
      .mockResolvedValueOnce(options)
      .mockResolvedValueOnce([])
      .mockRejectedValueOnce(new Error('lookup unavailable'));
    renderAutoSuggest(getOptions);

    await act(async () => {
      await containerState.props?.onSearchTermChange('syd');
    });

    expect({
      optionCount: screen.getByTestId('option-count').textContent,
      noResult: screen.getByTestId('no-result').textContent,
    }).toStrictEqual({ optionCount: '1', noResult: 'false' });

    await act(async () => {
      await containerState.props?.onSearchTermChange('sydney');
    });

    expect({
      optionCount: screen.getByTestId('option-count').textContent,
      noResult: screen.getByTestId('no-result').textContent,
    }).toStrictEqual({ optionCount: '0', noResult: 'true' });

    await act(async () => {
      await containerState.props?.onSearchTermChange('sydney nsw');
    });

    expect({
      error: screen.getByTestId('error').textContent,
      loading: screen.getByTestId('loading').textContent,
    }).toStrictEqual({ error: 'true', loading: 'false' });
  });

  it('does not search short terms and clears the selected option for an empty term', async () => {
    expect.hasAssertions();

    const onSelectedOption = vi
      .fn<SelectedOption>()
      .mockResolvedValue(undefined);
    const { getOptions } = renderAutoSuggest(
      undefined,
      onSelectedOption,
      'Sydney',
    );

    await act(async () => {
      await containerState.props?.onSearchTermChange('s');
    });

    expect(getOptions).not.toHaveBeenCalled();
    expect(screen.getByTestId('option-count')).toHaveTextContent('0');

    await act(async () => {
      await containerState.props?.onSearchTermChange('');
    });

    expect(onSelectedOption).toHaveBeenCalledExactlyOnceWith();
    expect(onSelectedOption.mock.calls[0]).toStrictEqual([]);
    expect(screen.getByTestId('search-term')).toHaveTextContent('');
  });

  it('ignores stale responses after cancellation and restores the selected value', async () => {
    expect.hasAssertions();

    let resolveSearch: (options: AutoSuggestOption<string>[]) => void = () => {
      // Placeholder until the search promise executor assigns the real resolve function.
    };
    const getOptions = vi.fn<
      (term: string) => Promise<AutoSuggestOption<string>[]>
    >(
      () =>
        new Promise((resolve) => {
          resolveSearch = resolve;
        }),
    );
    renderAutoSuggest(getOptions, vi.fn(), 'Original');

    let searchPromise: Promise<void> | undefined;
    act(() => {
      searchPromise = containerState.props?.onSearchTermChange('Sydney');
    });
    act(() => {
      containerState.props?.onCancel();
    });
    resolveSearch(options);
    await act(async () => {
      await searchPromise;
    });

    expect(screen.getByTestId('search-term')).toHaveTextContent('Original');
    expect(screen.getByTestId('option-count')).toHaveTextContent('0');
    expect(screen.getByTestId('error')).toHaveTextContent('false');
  });

  it('ignores a stale failed response after cancellation', async () => {
    expect.hasAssertions();

    let rejectSearch: (error: Error) => void = () => {
      // Placeholder until the search promise executor assigns the real reject function.
    };
    const getOptions = vi.fn<
      (term: string) => Promise<AutoSuggestOption<string>[]>
    >(
      () =>
        new Promise((_, reject) => {
          rejectSearch = reject;
        }),
    );
    renderAutoSuggest(getOptions);

    let searchPromise: Promise<void> | undefined;
    act(() => {
      searchPromise = containerState.props?.onSearchTermChange('Sydney');
    });
    act(() => {
      containerState.props?.onCancel();
    });
    rejectSearch(new Error('network unavailable'));
    await act(async () => {
      await searchPromise;
    });

    expect(screen.getByTestId('error')).toHaveTextContent('false');
    expect(screen.getByTestId('option-count')).toHaveTextContent('0');
  });

  it('updates loading around selection and reflects selectedOption changes', async () => {
    expect.hasAssertions();

    let resolveSelection: () => void = () => {
      // Placeholder until the selection promise executor assigns the real resolve function.
    };
    const onSelectedOption = vi.fn<SelectedOption>(
      () => new Promise<void>((resolve) => (resolveSelection = resolve)),
    );
    renderAutoSuggest(undefined, onSelectedOption);

    const [selectedOption] = options;

    let selectionPromise: Promise<void> | undefined;
    act(() => {
      selectionPromise = containerState.props?.onSelectedOption(
        selectedOption!,
      );
    });

    expect(screen.getByTestId('loading')).toHaveTextContent('true');

    resolveSelection();
    await act(async () => {
      await selectionPromise;
    });

    expect(screen.getByTestId('loading')).toHaveTextContent('false');
  });
});
