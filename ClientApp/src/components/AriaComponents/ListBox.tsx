'use client';
import {
  ListBox as AriaListBox,
  ListBoxItem as AriaListBoxItem,
  ListBoxSection as AriaListBoxSection,
  ListBoxLoadMoreItem as AriaListBoxLoadMoreItem,
  type ListBoxItemProps,
  type ListBoxLoadMoreItemProps,
  type ListBoxProps,
  type ListBoxSectionProps,
} from 'react-aria-components/ListBox';
import { composeRenderProps } from 'react-aria-components/composeRenderProps';
import { Check } from './NmiIcon';
import { Text } from './Content';
import { ProgressCircle } from './ProgressCircle';
import { omitUndefined } from '../../utils/omitUndefined';
import './ListBox.css';

export function ListBox<T>({ children, ...props }: Readonly<ListBoxProps<T>>) {
  return <AriaListBox {...props}>{children}</AriaListBox>;
}

export function ListBoxItem(props: Readonly<ListBoxItemProps>) {
  const textValue =
    props.textValue ||
    (typeof props.children === 'string' ? props.children : undefined);
  return (
    <AriaListBoxItem {...props} {...omitUndefined({ textValue })}>
      {composeRenderProps(props.children, (children) =>
        typeof children === 'string' ? (
          <Text slot='label'>{children}</Text>
        ) : (
          children
        )
      )}
    </AriaListBoxItem>
  );
}

export function ListBoxSection<T>(props: Readonly<ListBoxSectionProps<T>>) {
  return <AriaListBoxSection {...props} />;
}

export function ListBoxLoadMoreItem(props: Readonly<ListBoxLoadMoreItemProps>) {
  return (
    <AriaListBoxLoadMoreItem {...props}>
      <ProgressCircle isIndeterminate aria-label='Loading more...' />
    </AriaListBoxLoadMoreItem>
  );
}

export function DropdownListBox<T>(props: Readonly<ListBoxProps<T>>) {
  return <AriaListBox {...props} className='dropdown-listbox' />;
}

export function DropdownItem(props: Readonly<ListBoxItemProps>) {
  const textValue =
    props.textValue ||
    (typeof props.children === 'string' ? props.children : undefined);
  return (
    <ListBoxItem
      {...props}
      {...omitUndefined({ textValue })}
      className='dropdown-item'
    >
      {composeRenderProps(props.children, (children, { isSelected }) => (
        <>
          {isSelected && <Check />}
          {typeof children === 'string' ? (
            <Text slot='label'>{children}</Text>
          ) : (
            children
          )}
        </>
      ))}
    </ListBoxItem>
  );
}

export { Text };

export { Header } from 'react-aria-components/ListBox';
