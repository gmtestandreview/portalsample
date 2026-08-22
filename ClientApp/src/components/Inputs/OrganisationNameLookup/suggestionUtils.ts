type MatchType = 'startsWith' | 'includes' | 'endsWith';

interface SuggestionOption {
    [key: string]: unknown;
}

interface GetFilteredSuggestionsArgs {
    inputValue: string;
    matchType?: MatchType;
    maxResults?: number;
    options: SuggestionOption[];
    optionsFieldName: string;
    parentOptionsName?: string;
    parentValue?: string;
}

const suggestionCollator = new Intl.Collator(undefined, {
    sensitivity: 'base',
    numeric: true,
});

const compareSuggestions = (left: string, right: string) => suggestionCollator.compare(left, right);

const matches = (value: unknown, term: string, matchType: MatchType) => (
    typeof value === 'string' && value.toLowerCase()[matchType](term)
);

export const getFilteredSuggestions = ({
    inputValue,
    matchType = 'includes',
    maxResults = 30,
    options,
    optionsFieldName,
    parentOptionsName,
    parentValue,
}: GetFilteredSuggestionsArgs) => {
    const normalizedInput = inputValue.trim().toLowerCase();

    if (normalizedInput.length < 2) {
        return [];
    }

    const filteredOptions = options
        .filter((item) => matches(item[optionsFieldName], normalizedInput, matchType))
        .filter((item) => {
            if (parentValue === undefined) {
                return true;
            }

            return matches(item[parentOptionsName ?? ''], parentValue.toLowerCase(), matchType);
        })
        .slice(0, maxResults)
        .map((item) => item[optionsFieldName])
        .filter((item): item is string => typeof item === 'string')
        .sort(compareSuggestions);

    return [...new Set(filteredOptions)];
};
