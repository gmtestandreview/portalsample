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
  parentOptionsName?: string | undefined;
  parentValue?: string | undefined;
}

const suggestionCollator = new Intl.Collator(undefined, {
  sensitivity: 'base',
  numeric: true,
});

const compareSuggestions = (left: string, right: string) =>
  suggestionCollator.compare(left, right);

const getOptionValue = (
  item: SuggestionOption,
  fieldName: string | undefined
) => {
  if (fieldName === undefined || !Object.hasOwn(item, fieldName)) {
    return undefined;
  }
  return Reflect.get(item, fieldName);
};

const matches = (value: unknown, term: string, matchType: MatchType) => {
  if (typeof value !== 'string') return false;
  const normalizedValue = value.toLowerCase();

  switch (matchType) {
    case 'startsWith':
      return normalizedValue.startsWith(term);
    case 'endsWith':
      return normalizedValue.endsWith(term);
    default:
      return normalizedValue.includes(term);
  }
};

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
    .filter((item) =>
      matches(
        getOptionValue(item, optionsFieldName),
        normalizedInput,
        matchType
      )
    )
    .filter((item) => {
      if (parentValue === undefined) {
        return true;
      }

      return matches(
        getOptionValue(item, parentOptionsName),
        parentValue.toLowerCase(),
        matchType
      );
    })
    .slice(0, maxResults)
    .map((item) => getOptionValue(item, optionsFieldName))
    .filter((item): item is string => typeof item === 'string')
    .sort(compareSuggestions);

  return [...new Set(filteredOptions)];
};
