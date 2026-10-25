import { act, render, screen } from '@testing-library/react';

import { describe, expect, it, vi } from 'vitest';

import RhfAutoSuggest from '@/components/Inputs/RhfAutoSuggest';

import type { AutoSuggestOption } from '@/components/Inputs/AutoSuggest/types';

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
  () =>
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
    }) satisfies __ExactMockModule<__TestMockModule36>,
);

const options: AutoSuggestOption<string>[] = [
  { id: 'sydney', displayText: 'Sydney', value: 'sydney' },
];

const renderAutoSuggest = (
  getOptions = vi
    .fn<(term: string) => Promise<AutoSuggestOption<string>[]>>()
    .mockResolvedValue([]),
  onSelectedOption = vi.fn(),
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
    expect.assertions(1);
    const getOptions = vi
      .fn<(term: string) => Promise<AutoSuggestOption<string>[]>>()
      .mockResolvedValueOnce(options)
      .mockResolvedValueOnce([])
      .mockRejectedValueOnce(new Error('lookup unavailable'));
    renderAutoSuggest(getOptions);
    await act(async () => {
      await containerState.props?.onSearchTermChange('syd');
    });
    expect(screen.getByTestId('option-count')).toHaveTextContent('1');
  });
});

describe('rhfAutoSuggest parent state', () => {
  it('loads options, reports no results and reports lookup failures', async () => {
    expect.assertions(1);
    const getOptions = vi
      .fn<(term: string) => Promise<AutoSuggestOption<string>[]>>()
      .mockResolvedValueOnce(options)
      .mockResolvedValueOnce([])
      .mockRejectedValueOnce(new Error('lookup unavailable'));
    renderAutoSuggest(getOptions);
    await act(async () => {
      await containerState.props?.onSearchTermChange('syd');
    });
    expect(screen.getByTestId('no-result')).toHaveTextContent('false');
  });
});

describe('rhfAutoSuggest parent state', () => {
  it('loads options, reports no results and reports lookup failures', async () => {
    expect.assertions(1);
    const getOptions = vi
      .fn<(term: string) => Promise<AutoSuggestOption<string>[]>>()
      .mockResolvedValueOnce(options)
      .mockResolvedValueOnce([])
      .mockRejectedValueOnce(new Error('lookup unavailable'));
    renderAutoSuggest(getOptions);
    await act(async () => {
      await containerState.props?.onSearchTermChange('syd');
    });
    await act(async () => {
      await containerState.props?.onSearchTermChange('sydney');
    });
    expect(screen.getByTestId('option-count')).toHaveTextContent('0');
  });
});

describe('rhfAutoSuggest parent state', () => {
  it('loads options, reports no results and reports lookup failures', async () => {
    expect.assertions(1);
    const getOptions = vi
      .fn<(term: string) => Promise<AutoSuggestOption<string>[]>>()
      .mockResolvedValueOnce(options)
      .mockResolvedValueOnce([])
      .mockRejectedValueOnce(new Error('lookup unavailable'));
    renderAutoSuggest(getOptions);
    await act(async () => {
      await containerState.props?.onSearchTermChange('syd');
    });
    await act(async () => {
      await containerState.props?.onSearchTermChange('sydney');
    });
    expect(screen.getByTestId('no-result')).toHaveTextContent('true');
  });
});

describe('rhfAutoSuggest parent state', () => {
  it('loads options, reports no results and reports lookup failures', async () => {
    expect.assertions(1);
    const getOptions = vi
      .fn<(term: string) => Promise<AutoSuggestOption<string>[]>>()
      .mockResolvedValueOnce(options)
      .mockResolvedValueOnce([])
      .mockRejectedValueOnce(new Error('lookup unavailable'));
    renderAutoSuggest(getOptions);
    await act(async () => {
      await containerState.props?.onSearchTermChange('syd');
    });
    await act(async () => {
      await containerState.props?.onSearchTermChange('sydney');
    });
    await act(async () => {
      await containerState.props?.onSearchTermChange('sydney nsw');
    });
    expect(screen.getByTestId('error')).toHaveTextContent('true');
  });
});
