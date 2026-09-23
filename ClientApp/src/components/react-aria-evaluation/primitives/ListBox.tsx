'use client';
import { composeRenderProps } from 'react-aria-components/composeRenderProps';
import {
  ListBox as AriaListBox,
  ListBoxItem as AriaListBoxItem,
  ListBoxLoadMoreItem as AriaListBoxLoadMoreItem,
  ListBoxSection as AriaListBoxSection,
  Header,
  type ListBoxItemProps,
  type ListBoxLoadMoreItemProps,
  type ListBoxProps,
  type ListBoxSectionProps,
} from 'react-aria-components/ListBox';
import { Text } from './Content.tsx';
import { Check } from './NmiIcon.tsx';
import { ProgressCircle } from './ProgressCircle.tsx';
import './ListBox.css';

export function ListBox<T>({ children, ...props }: Readonly<ListBoxProps<T>>) {
  return <AriaListBox {...props}>{children}</AriaListBox>;
}

export function ListBoxItem(props: Readonly<ListBoxItemProps>) {
  const textValue =
    props.textValue ||
    (typeof props.children === 'string' ? props.children : undefined);
  return (
    <AriaListBoxItem {...props} textValue={textValue}>
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
      <ProgressCircle isIndeterminate={true} aria-label='Loading more...' />
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
    <ListBoxItem {...props} textValue={textValue} className='dropdown-item'>
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

export { Header, Text };
