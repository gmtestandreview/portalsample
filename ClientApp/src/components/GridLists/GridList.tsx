'use client';
import {
  Button,
  GridList as AriaGridList,
  GridListItem as AriaGridListItem,
  GridListLoadMoreItem as AriaGridListLoadMoreItem,
  type GridListItemProps,
  type GridListProps,
  type GridListLoadMoreItemProps,
} from 'react-aria-components/GridList';
import { Checkbox } from '../Inputs/AriaCheckbox/Checkbox';
import { GripVertical } from '../AriaComponents/NmiIcon';
import { ProgressCircle } from '../AriaComponents/ProgressCircle';
import { omitUndefined } from '../../utils/omitUndefined';
import './GridList.css';

export function GridList<T>({
  children,
  layout = 'grid',
  ...props
}: Readonly<GridListProps<T>>) {
  return (
    <AriaGridList {...props} layout={layout}>
      {children}
    </AriaGridList>
  );
}

export function GridListItem({
  children,
  ...props
}: Readonly<
  Omit<GridListItemProps, 'children'> & {
    children?: React.ReactNode;
  }
>) {
  const textValue = typeof children === 'string' ? children : undefined;
  return (
    <AriaGridListItem {...omitUndefined({ textValue })} {...props}>
      {({ selectionMode, selectionBehavior, allowsDragging }) => (
        <>
          {/* Add elements for drag and drop and selection. */}
          {allowsDragging && (
            <Button slot='drag'>
              <GripVertical size={16} />
            </Button>
          )}
          {selectionMode === 'multiple' && selectionBehavior === 'toggle' && (
            <Checkbox slot='selection' />
          )}
          {children}
        </>
      )}
    </AriaGridListItem>
  );
}

export function GridListLoadMoreItem(
  props: Readonly<GridListLoadMoreItemProps>
) {
  return (
    <AriaGridListLoadMoreItem {...props}>
      <ProgressCircle isIndeterminate aria-label='Loading more...' />
    </AriaGridListLoadMoreItem>
  );
}

export {
  GridListSection,
  GridListHeader,
  Text,
} from 'react-aria-components/GridList';
