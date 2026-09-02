import { act, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import AutoSuggest from '@/components/Inputs/AutoSuggest';
import type { AutoSuggestOption } from '@/components/Inputs/AutoSuggest/types';

const containerState = vi.hoisted(() => ({
    props: undefined as any,
}));

vi.mock('@/components/Inputs/AutoSuggest/AutoSuggestContainer', () => ({
    default: (props: any) => {
        containerState.props = props;
        return (
            <div>
                <span data-testid='search-term'>{props.searchTerm}</span>
                <span data-testid='loading'>{String(props.loading)}</span>
                <span data-testid='error'>{String(props.error)}</span>
                <span data-testid='no-result'>{String(props.noResult)}</span>
                <span data-testid='option-count'>{String(props.options.length)}</span>
            </div>
        );
    },
}));

const renderAutoSuggest = (
    getOptions = vi.fn<(term: string) => Promise<AutoSuggestOption<string>[]>>().mockResolvedValue([]),
    onSelectedOption = vi.fn(),
    selectedOption?: string,
) => {
    render(
        <AutoSuggest
            name='suburb'
            label='Suburb'
            getOptions={getOptions}
            onSelectedOption={onSelectedOption}
            selectedOption={selectedOption}
        />,
    );

    return { getOptions, onSelectedOption };
};

describe('AutoSuggest parent state', () => {
    it('clears a selected option when the search term is emptied', async () => {
        const onSelectedOption = vi.fn().mockResolvedValue(undefined);
        renderAutoSuggest(undefined, onSelectedOption, 'Sydney');

        await act(async () => {
            await containerState.props.onSearchTermChange('');
        });

        expect(onSelectedOption).toHaveBeenCalledWith();
        expect(screen.getByTestId('search-term')).toHaveTextContent('');
        expect(screen.getByTestId('option-count')).toHaveTextContent('0');
        expect(screen.getByTestId('loading')).toHaveTextContent('false');
    });

    it('reports a failed search and clears the previous suggestions', async () => {
        // The stale-response tests below cover a rejection arriving after the field moved on. This
        // is the live one: the search that is still current failed, so the user is told rather than
        // left looking at suggestions from an earlier term.
        const getOptions = vi.fn<(term: string) => Promise<AutoSuggestOption<string>[]>>()
            .mockResolvedValueOnce([{ id: 'sydney', displayText: 'Sydney', value: 'sydney' }])
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
        let resolveSearch: (options: AutoSuggestOption<string>[]) => void = () => {};
        const getOptions = vi.fn<(term: string) => Promise<AutoSuggestOption<string>[]>>(() => new Promise((resolve) => {
            resolveSearch = resolve;
        }));
        renderAutoSuggest(getOptions, vi.fn(), 'Original');

        let searchPromise: Promise<void>;
        await act(async () => {
            searchPromise = containerState.props.onSearchTermChange('Sydney');
        });
        expect(screen.getByTestId('loading')).toHaveTextContent('true');

        await act(async () => {
            containerState.props.onCancel();
        });
        expect(screen.getByTestId('search-term')).toHaveTextContent('Original');
        expect(screen.getByTestId('loading')).toHaveTextContent('false');

        await act(async () => {
            resolveSearch([{ id: 'syd', displayText: 'Sydney', value: 'syd' }]);
            await searchPromise;
        });

        expect(screen.getByTestId('search-term')).toHaveTextContent('Original');
        expect(screen.getByTestId('option-count')).toHaveTextContent('0');
        expect(screen.getByTestId('no-result')).toHaveTextContent('false');
    });

    it('ignores a stale failed search response after cancel resets the field', async () => {
        let rejectSearch: (error: Error) => void = () => {};
        const getOptions = vi.fn<(term: string) => Promise<AutoSuggestOption<string>[]>>(() => new Promise((_, reject) => {
            rejectSearch = reject;
        }));
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

        expect(screen.getByTestId('error')).toHaveTextContent('false');
        expect(screen.getByTestId('option-count')).toHaveTextContent('0');
        expect(screen.getByTestId('loading')).toHaveTextContent('false');
    });
});
