'use client';
import {
  ComboBox as AriaComboBox,
  type ComboBoxProps as AriaComboBoxProps,
  ComboBoxValue,
  Input,
  type ListBoxItemProps,
  type ListBoxProps,
  type ValidationResult,
} from 'react-aria-components/ComboBox';
import { Group } from 'react-aria-components/Group';
import { Label, FieldError, FieldButton, Description } from '../forms/AriaForm/Form';
import { DropdownItem, DropdownListBox } from '../AriaComponents/ListBox';
import { Popover } from '../AriaComponents/Popover';
import { ChevronDown } from '../AriaComponents/NmiIcon';
import './ComboBox.css';

export interface ComboBoxProps<T, M extends 'single' | 'multiple'> extends Omit<
  AriaComboBoxProps<T, M>,
  'children'
> {
  label?: string;
  description?: string | null;
  errorMessage?: string | ((validation: ValidationResult) => string);
  children: React.ReactNode | ((item: T) => React.ReactNode);
  placeholder?: string;
}

export function ComboBox<T, M extends 'single' | 'multiple' = 'single'>({
  label,
  description,
  errorMessage,
  children,
  placeholder,
  ...props
}: ComboBoxProps<T, M>) {
  return (
    <AriaComboBox {...props}>
      {label && <Label>{label}</Label>}
      {/*
        React Aria's <Group> (not a plain <div>): ComboBox reads the group ref
        through GroupContext and, when it is set, skips the ResizeObserver-driven
        `setMenuWidth` fallback it otherwise runs to size the menu off the bare
        input. That fallback commits state after mount, outside the story's
        act() scope, which is the "update to ComboBoxInner was not wrapped in
        act(...)" warning. With the Group present the popover sizes off the
        group and no post-mount state update happens.
      */}
      <Group className="combobox-field">
        <Input className="react-aria-Input inset" placeholder={placeholder} />
        <FieldButton>
          <ChevronDown />
        </FieldButton>
      </Group>
      {props.selectionMode === 'multiple' && <ComboBoxValue placeholder="No items selected" />}
      {description && <Description>{description}</Description>}
      <FieldError>{errorMessage}</FieldError>
      <Popover hideArrow className="combobox-popover">
        <ComboBoxListBox>{children}</ComboBoxListBox>
      </Popover>
    </AriaComboBox>
  );
}

export function ComboBoxListBox<T>(props: ListBoxProps<T>) {
  return <DropdownListBox {...props} />;
}

export function ComboBoxItem(props: ListBoxItemProps) {
  return <DropdownItem {...props} />;
}
