'use client';
import type React from 'react';
import {
  Menu as AriaMenu,
  MenuItem as AriaMenuItem,
  MenuSection as AriaMenuSection,
  MenuTrigger as AriaMenuTrigger,
  SubmenuTrigger as AriaSubmenuTrigger,
  Header,
  Keyboard,
  type MenuItemProps,
  type MenuProps,
  type MenuSectionProps,
  type MenuTriggerProps,
  Separator,
  type SubmenuTriggerProps,
} from 'react-aria-components/Menu';
import { Text } from './Content.tsx';
import { Check, ChevronRight, Dot } from './NmiIcon.tsx';
import { Popover } from './Popover.tsx';
import './Menu.css';

export function MenuTrigger(props: Readonly<MenuTriggerProps>) {
  const [trigger, menu] = props.children as unknown as [
    React.ReactElement,
    React.ReactElement,
  ];
  return (
    <AriaMenuTrigger {...props}>
      {trigger}
      <Popover>{menu}</Popover>
    </AriaMenuTrigger>
  );
}

export function Menu<T>(props: Readonly<MenuProps<T>>) {
  return <AriaMenu {...props}>{props.children}</AriaMenu>;
}

export function MenuItem(
  props: Readonly<
    Omit<MenuItemProps, 'children'> & { children?: React.ReactNode }
  >
) {
  const textValue =
    props.textValue ||
    (typeof props.children === 'string' ? props.children : undefined);
  return (
    <AriaMenuItem {...props} textValue={textValue}>
      {({ hasSubmenu, isSelected, selectionMode }) => (
        <>
          {isSelected && selectionMode === 'multiple' ? <Check /> : null}
          {isSelected && selectionMode === 'single' ? <Dot /> : null}
          {typeof props.children === 'string' ? (
            <Text slot='label'>{props.children}</Text>
          ) : (
            props.children
          )}
          {hasSubmenu && <ChevronRight />}
        </>
      )}
    </AriaMenuItem>
  );
}

export function MenuSection<T>(props: Readonly<MenuSectionProps<T>>) {
  return <AriaMenuSection {...props} />;
}

export function SubmenuTrigger(props: Readonly<SubmenuTriggerProps>) {
  const [trigger, menu] = props.children as unknown as [
    React.ReactElement,
    React.ReactElement,
  ];
  return (
    <AriaSubmenuTrigger {...props}>
      {trigger}
      <Popover hideArrow={true} offset={-2} crossOffset={-4}>
        {menu}
      </Popover>
    </AriaSubmenuTrigger>
  );
}

export { Header, Keyboard, Separator, Text };
