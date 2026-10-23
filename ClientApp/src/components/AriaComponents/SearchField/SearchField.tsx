'use client';
import {
  Button,
  Input,
  SearchField as AriaSearchField,
  type SearchFieldProps as AriaSearchFieldProps,
  type ValidationResult,
} from 'react-aria-components/SearchField';
import { Label, FieldError, Description } from '../Form/Form';
import { Search, X } from '../NmiIcon';
import { omitUndefined } from '../../../utils/omitUndefined';
import { forwardRef } from 'react';
import './SearchField.css';

export interface SearchFieldProps extends AriaSearchFieldProps {
  label?: string;
  description?: string;
  errorMessage?: string | ((validation: ValidationResult) => string);
  placeholder?: string;
}

export const SearchField = forwardRef<HTMLInputElement, SearchFieldProps>(
  function SearchField(
    {
      label,
      description,
      errorMessage,
      placeholder,
      ...props
    }: Readonly<SearchFieldProps>,
    ref
  ) {
    return (
      <AriaSearchField {...props}>
        {label && <Label>{label}</Label>}
        <Search size={18} />
        <Input
          ref={ref}
          {...omitUndefined({ placeholder })}
          className='react-aria-Input inset'
        />
        <Button className='clear-button'>
          <X size={14} />
        </Button>
        {description && <Description>{description}</Description>}
        <FieldError>{errorMessage}</FieldError>
      </AriaSearchField>
    );
  }
);
