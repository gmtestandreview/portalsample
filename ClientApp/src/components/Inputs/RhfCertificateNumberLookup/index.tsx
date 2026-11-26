import { useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';
import SummaryDisplay from '../../SummaryDisplay';
import useDebounce from '../../Utilities/useDebounce';
import RhfAutoSuggestContainer from '../RhfAutoSuggest/RhfAutoSuggestContainer';
import type { AutoSuggestOption } from '../AutoSuggest/types';
import { orIfEmpty } from '../../../utils/orIfEmpty';
import { omitUndefined } from '../../../utils/omitUndefined';
import { getCertificateSuggestions } from './certificateSuggestions';
import type { CertificateMatchType } from './certificateSuggestions';

export interface RhfCertificateNumberLookupProps {
  id?: string | undefined;
  name: string;
  idName: string;
  label?: string | undefined;
  placeholder?: string | undefined;
  inlineHelpTitle?: string | undefined;
  inlineHelp?: ReactNode;
  optionsFieldName?: string | undefined;
  parentName?: string | undefined;
  parentOptionsName?: string | undefined;
  matchType?: CertificateMatchType | undefined;
  maxResults?: number | undefined;
  isSummary?: boolean | undefined;
}

interface CertificateSelection {
  name: string;
  id: string;
}

/**
 * React Hook Form counterpart of `CertificateNumberLookup`. Typing writes the
 * text to `name`; choosing a suggestion writes the certificate name to `name`
 * and its lookup id to `idName`, touching and dirtying both. The lookup records
 * are read from the form's `certNameOptions` value, as before. Suggestions are
 * derived from the debounced text, so there is no effect syncing state.
 */
const RhfCertificateNumberLookup = (
  props: Readonly<RhfCertificateNumberLookupProps>,
) => {
  const {
    id,
    name,
    idName,
    label,
    placeholder,
    inlineHelpTitle,
    inlineHelp,
    optionsFieldName,
    parentName,
    parentOptionsName,
    matchType = 'includes',
    maxResults = 30,
    isSummary,
  } = props;

  const { setValue } = useFormContext();
  const value = useWatch({ name }) as string | undefined;
  const options = useWatch({ name: 'certNameOptions' }) as
    | unknown[]
    | undefined;
  const parentValue = useWatch({ name: parentName ?? name }) as
    | string
    | undefined;

  const [searchTerm, setSearchTerm] = useState(value ?? '');
  const [previousValue, setPreviousValue] = useState(value);
  if (value !== previousValue) {
    setPreviousValue(value);
    setSearchTerm(value ?? '');
  }

  const debouncedTerm = useDebounce(searchTerm, 300);
  const [dismissedTerm, setDismissedTerm] = useState<string>();

  const suggestions = useMemo<AutoSuggestOption<CertificateSelection>[]>(() => {
    if (!searchTerm.trim() || dismissedTerm === searchTerm) {
      return [];
    }
    return getCertificateSuggestions({
      inputValue: debouncedTerm,
      options: options ?? [],
      optionsFieldName,
      matchType,
      maxResults,
      parentName,
      parentValue,
      parentOptionsName,
    }).map((item) => {
      const itemName = item.lookupName ?? '';
      const itemId = item.id ?? '';
      return {
        id: itemId || itemName,
        displayText: itemName,
        value: { name: itemName, id: itemId },
      };
    });
  }, [
    searchTerm,
    debouncedTerm,
    dismissedTerm,
    options,
    optionsFieldName,
    matchType,
    maxResults,
    parentName,
    parentValue,
    parentOptionsName,
  ]);

  if (isSummary) {
    return (
      <SummaryDisplay
        label={label}
        id={name}
        as='p'
        value={orIfEmpty(value, '-')}
      />
    );
  }

  const fieldLabel = label ?? 'Certificate number';

  const onSearchTermChange = (term: string) => {
    setSearchTerm(term);
    setValue(name, term, { shouldDirty: true, shouldValidate: true });
  };

  const onSelectedOption = (
    option: AutoSuggestOption<CertificateSelection>,
  ) => {
    setSearchTerm(option.value.name);
    setDismissedTerm(option.value.name);
    setValue(name, option.value.name, {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: true,
    });
    setValue(idName, option.value.id, {
      shouldDirty: true,
      shouldTouch: true,
    });
  };

  const help = inlineHelpTitle ? (
    <>
      <strong>{inlineHelpTitle}</strong>
      {inlineHelp ? <> {inlineHelp}</> : null}
    </>
  ) : (
    inlineHelp
  );

  return (
    <fieldset className='d-block' aria-live='polite' role='group'>
      <legend className='visually-hidden'>
        {'Enter or find a '}
        {fieldLabel}
      </legend>
      <RhfAutoSuggestContainer<CertificateSelection>
        name={name}
        label={fieldLabel}
        options={suggestions}
        searchTerm={searchTerm}
        onSearchTermChange={onSearchTermChange}
        onSelectedOption={onSelectedOption}
        onCancel={() => {
          setDismissedTerm(searchTerm);
        }}
        touchOnChange={false}
        {...omitUndefined({ id, inlineHelp: help, placeholder })}
      />
    </fieldset>
  );
};

export default RhfCertificateNumberLookup;
