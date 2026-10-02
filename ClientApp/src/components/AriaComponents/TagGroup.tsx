'use client';
import {
  Button,
  Tag as AriaTag,
  TagGroup as AriaTagGroup,
  type TagGroupProps as AriaTagGroupProps,
  TagList,
  type TagListProps,
  type TagProps,
} from 'react-aria-components/TagGroup';
import { Description, Label } from '../forms/AriaForm/Form';
import { Text } from './Content';
import { X } from './NmiIcon';
import { omitUndefined } from '../../utils/omitUndefined';
import './TagGroup.css';

export interface TagGroupProps<T>
  extends
    Omit<AriaTagGroupProps, 'children'>,
    Pick<TagListProps<T>, 'items' | 'children' | 'renderEmptyState'> {
  label?: string;
  description?: string;
  errorMessage?: string;
}

export function TagGroup<T>({
  label,
  description,
  errorMessage,
  items,
  children,
  renderEmptyState,
  ...props
}: Readonly<TagGroupProps<T>>) {
  return (
    <AriaTagGroup {...props}>
      {label && <Label>{label}</Label>}
      <TagList {...omitUndefined({ items, renderEmptyState })}>
        {children}
      </TagList>
      {description && <Description>{description}</Description>}
      {errorMessage && <Text slot='errorMessage'>{errorMessage}</Text>}
    </AriaTagGroup>
  );
}

export function Tag({
  children,
  ...props
}: Readonly<
  Omit<TagProps, 'children'> & {
    children?: React.ReactNode;
  }
>) {
  const textValue = typeof children === 'string' ? children : undefined;
  return (
    <AriaTag
      {...omitUndefined({ textValue })}
      {...props}
      className='react-aria-Tag button-base'
    >
      {({ allowsRemoving }) => (
        <>
          {children}
          {allowsRemoving && (
            <Button slot='remove' className='remove-button'>
              <X />
            </Button>
          )}
        </>
      )}
    </AriaTag>
  );
}
