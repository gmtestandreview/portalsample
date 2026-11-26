import type { LookupResponse } from '../../../api/web-api-client';

export type CertificateMatchType = 'startsWith' | 'includes' | 'endsWith';

const getLookupFieldValue = (
  item: unknown,
  fieldName: string | undefined,
): string | undefined => {
  if (fieldName === undefined || item === null || typeof item !== 'object') {
    return undefined;
  }

  const key = Object.keys(item).find((candidate) => candidate === fieldName);
  const value =
    key === undefined ? undefined : (Reflect.get(item, key) as unknown);
  return typeof value === 'string' ? value : undefined;
};

const matchesLookupValue = (
  value: string | undefined,
  input: string,
  matchType: CertificateMatchType,
) => {
  if (value === undefined) return false;

  const normalizedValue = value.toLowerCase();
  switch (matchType) {
    case 'startsWith':
      return normalizedValue.startsWith(input);
    case 'endsWith':
      return normalizedValue.endsWith(input);
    default:
      return normalizedValue.includes(input);
  }
};

interface GetCertificateSuggestionsArgs {
  inputValue: string;
  options: unknown[];
  optionsFieldName: string | undefined;
  matchType: CertificateMatchType;
  maxResults: number;
  parentName: string | undefined;
  parentValue: string | undefined;
  parentOptionsName: string | undefined;
}

/**
 * The records to suggest for the typed text. Same rules as the Formik lookup:
 * nothing under two characters; when a parent field is configured and has a
 * value, records must also match the parent; matches are limited to
 * `maxResults` and then sorted by the looked-up field.
 */
export const getCertificateSuggestions = ({
  inputValue,
  options,
  optionsFieldName,
  matchType,
  maxResults,
  parentName,
  parentValue,
  parentOptionsName,
}: GetCertificateSuggestionsArgs): LookupResponse[] => {
  if (inputValue.length < 2) {
    return [];
  }
  const useParent = parentName !== undefined && parentValue !== undefined;
  const candidates = useParent
    ? options.filter((item) =>
        matchesLookupValue(
          getLookupFieldValue(item, parentOptionsName),
          parentValue.toLowerCase(),
          matchType,
        ),
      )
    : options;

  return candidates
    .map((item) => ({
      item: item as LookupResponse,
      value: getLookupFieldValue(item, optionsFieldName),
    }))
    .filter((entry): entry is { item: LookupResponse; value: string } =>
      matchesLookupValue(entry.value, inputValue.toLowerCase(), matchType),
    )
    .slice(0, maxResults)
    .sort((left, right) => left.value.localeCompare(right.value))
    .map((entry) => entry.item);
};
