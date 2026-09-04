'use client';
import {
  type ListBoxItemProps,
  Select as AriaSelect,
  type SelectProps as AriaSelectProps,
  SelectValue,
  type ValidationResult,
  type ListBoxProps,
} from 'react-aria-components/Select';
import { Button } from '../Buttons/AriaButton/Button';
import { DropdownItem, DropdownListBox } from './ListBox';
import { ChevronDown } from './NmiIcon';
import { Popover } from './Popover';
import { Label, FieldError, Description } from '../forms/AriaForm/Form';
import './Select.css';

export interface SelectProps<T, M extends 'single' | 'multiple'> extends Omit<
  AriaSelectProps<T, M>,
  'children'
> {
  label?: string;
  description?: string;
  errorMessage?: string | ((validation: ValidationResult) => string);
  placeholder?: string;
  items?: Iterable<T>;
  children: React.ReactNode | ((item: T) => React.ReactNode);
}

export function Select<T, M extends 'single' | 'multiple' = 'single'>({
  label,
  description,
  errorMessage,
  children,
  items,
  placeholder,
  ...props
}: Readonly<SelectProps<T, M>>) {
  return (
    <AriaSelect {...props} placeholder={placeholder}>
      {label && <Label>{label}</Label>}
      <Button>
        <SelectValue />
        <ChevronDown />
      </Button>
      {description && <Description>{description}</Description>}
      <FieldError>{errorMessage}</FieldError>
      <Popover hideArrow className="select-popover">
        <SelectListBox items={items}>{children}</SelectListBox>
      </Popover>
    </AriaSelect>
  );
}

export function SelectListBox<T>(props: Readonly<ListBoxProps<T>>) {
  return <DropdownListBox {...props} />;
}

export function SelectItem(props: Readonly<ListBoxItemProps>) {
  return <DropdownItem {...props} />;
}
