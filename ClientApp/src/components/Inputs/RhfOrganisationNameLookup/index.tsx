import { useEffect, useState } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';
import type { OrgNameOption } from '../../../api/web-api-client';
import { getFilteredSuggestions } from '../OrganisationNameLookup/suggestionUtils';
import type { OrganisationNameLookupProps } from '../OrganisationNameLookup';
import type { AutoSuggestOption } from '../AutoSuggest/types';
import RhfAutoSuggestContainer from '../RhfAutoSuggest/RhfAutoSuggestContainer';
import { omitUndefined } from '../../../utils/omitUndefined';

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

  const [suggestions, setSuggestions] = useState<AutoSuggestOption<string>[]>(
    [],
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!searchTerm.trim() || optionsFieldName === undefined) {
        setSuggestions((previous) => (previous.length === 0 ? previous : []));
        return;
      }

      const filtered = getFilteredSuggestions({
        inputValue: searchTerm,
        matchType,
        maxResults,
        options: (options ?? []) as unknown as Record<string, unknown>[],
        optionsFieldName,
        ...(parentName === undefined ? {} : { parentOptionsName, parentValue }),
      });
      const next = filtered.map((displayText) => ({
        id: displayText,
        displayText,
        value: displayText,
      }));

      setSuggestions((previous) =>
        previous.length === next.length &&
        previous.every((option, index) => option.id === next[index]?.id)
          ? previous
          : next,
      );
    }, 300);

    return () => clearTimeout(timer);
  }, [
    searchTerm,
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

  const onSelectedOption = (option?: AutoSuggestOption<string>) => {
    const selectedValue = option?.value ?? searchTerm;
    setSearchTerm(selectedValue);
    setValue(name, selectedValue, {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: true,
    });
  };

  const onCancel = () => {
    setSuggestions([]);
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
