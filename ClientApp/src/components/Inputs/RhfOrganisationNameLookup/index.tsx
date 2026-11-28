import { useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';
import type { OrgNameOption } from '../../../api/web-api-client';
import { getFilteredSuggestions } from '../OrganisationNameLookup/suggestionUtils';
import type { AutoSuggestOption } from '../AutoSuggest/types';
import RhfAutoSuggestContainer from '../RhfAutoSuggest/RhfAutoSuggestContainer';
import { omitUndefined } from '../../../utils/omitUndefined';
import useDebounce from '../../Utilities/useDebounce';

export interface OrganisationNameLookupProps {
  id?: string;
  name: string;
  label?: string;
  placeholder?: string;
  inlineHelpTitle?: string;
  inlineHelp?: string | ReactNode;
  optionsFieldName?: string;
  parentName?: string;
  parentOptionsName?: string;
  matchType?: 'startsWith' | 'includes' | 'endsWith';
  maxResults?: number;
}

const RhfOrganisationNameLookup = (
  props: Readonly<OrganisationNameLookupProps>,
) => {
  const {
    id,
    name,
    label,
    placeholder,
    inlineHelpTitle,
    inlineHelp,
    optionsFieldName,
    parentName,
    parentOptionsName,
    matchType = 'includes',
    maxResults = 30,
  } = props;

  const { setValue } = useFormContext();
  const value = useWatch({ name }) as string | undefined;
  const options = useWatch({ name: 'orgNameOptions' }) as
    | OrgNameOption[]
    | undefined;
  const parentValue = useWatch({
    name: parentName ?? name,
  }) as string | undefined;

  const [searchTerm, setSearchTerm] = useState(value ?? '');
  const [previousValue, setPreviousValue] = useState(value);
  if (value !== previousValue) {
    setPreviousValue(value);
    setSearchTerm(value ?? '');
  }

  const debouncedTerm = useDebounce(searchTerm, 300);
  const [dismissedTerm, setDismissedTerm] = useState<string>();

  const suggestions = useMemo<AutoSuggestOption<string>[]>(() => {
    if (
      !searchTerm.trim() ||
      !debouncedTerm.trim() ||
      optionsFieldName === undefined ||
      dismissedTerm === searchTerm
    ) {
      return [];
    }

    return getFilteredSuggestions({
      inputValue: debouncedTerm,
      matchType,
      maxResults,
      options: (options ?? []) as unknown as Record<string, unknown>[],
      optionsFieldName,
      ...(parentName === undefined ? {} : { parentOptionsName, parentValue }),
    }).map((displayText) => ({
      id: displayText,
      displayText,
      value: displayText,
    }));
  }, [
    searchTerm,
    debouncedTerm,
    dismissedTerm,
    options,
    parentValue,
    optionsFieldName,
    parentName,
    parentOptionsName,
    matchType,
    maxResults,
  ]);

  const onSearchTermChange = (term: string) => {
    setSearchTerm(term);
    setValue(name, term, {
      shouldDirty: true,
      shouldValidate: true,
    });
  };

  const onSelectedOption = (option: AutoSuggestOption<string>) => {
    const selectedValue = option.value;
    setSearchTerm(selectedValue);
    setValue(name, selectedValue, {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: true,
    });
  };

  const onCancel = () => {
    setDismissedTerm(searchTerm);
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
        {label ?? 'Organisation name'}
      </legend>
      <RhfAutoSuggestContainer<string>
        name={name}
        label={label ?? 'Organisation name'}
        options={suggestions}
        searchTerm={searchTerm}
        onSearchTermChange={onSearchTermChange}
        onSelectedOption={onSelectedOption}
        onCancel={onCancel}
        touchOnChange={false}
        {...omitUndefined({
          id,
          inlineHelp: help,
          placeholder,
        })}
      />
    </fieldset>
  );
};

export default RhfOrganisationNameLookup;
