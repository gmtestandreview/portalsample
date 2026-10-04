'use client';
import {
  Button,
  Collection,
  Column as AriaColumn,
  type ColumnProps as AriaColumnProps,
  Row as AriaRow,
  type RowProps,
  Table as AriaTable,
  TableHeader as AriaTableHeader,
  type TableHeaderProps,
  type TableProps,
  useTableOptions,
  type TableBodyProps,
  TableBody as AriaTableBody,
  type CellProps,
  Cell as AriaCell,
  ColumnResizer,
  TableLoadMoreItem as AriaTableLoadMoreItem,
  type TableLoadMoreItemProps,
  TableFooter as AriaTableFooter,
  type TableFooterProps,
} from 'react-aria-components/Table';
import { Group } from 'react-aria-components/Group';
import { composeRenderProps } from 'react-aria-components/composeRenderProps';
import { Checkbox } from '../Inputs/AriaCheckbox/Checkbox';
import { ProgressCircle } from './ProgressCircle';
import { ChevronUp, ChevronDown, GripVertical, ChevronRight } from './NmiIcon';
import { omitUndefined } from '../../utils/omitUndefined';
import './Table.css';

export function Table(props: Readonly<TableProps>) {
  return <AriaTable {...props} />;
}

interface ColumnProps extends AriaColumnProps {
  allowsResizing?: boolean;
}

export function Column(
  props: Readonly<
    Omit<ColumnProps, 'children'> & { children?: React.ReactNode }
  >
) {
  return (
    <AriaColumn {...props} className='react-aria-Column button-base'>
      {({ allowsSorting, sortDirection }) => (
        <div className='column-header'>
          <Group role='presentation' tabIndex={-1} className='column-name'>
            {props.children}
          </Group>
          {allowsSorting && (
            <span aria-hidden='true' className='sort-indicator'>
              {sortDirection === 'ascending' ? (
                <ChevronUp size={16} />
              ) : (
                <ChevronDown size={16} />
              )}
            </span>
          )}
          {props.allowsResizing && <ColumnResizer />}
        </div>
      )}
    </AriaColumn>
  );
}

export function TableHeader<T>({
  columns,
  children,
  ...otherProps
}: Readonly<TableHeaderProps<T>>) {
  const { selectionBehavior, selectionMode, allowsDragging } =
    useTableOptions();

  return (
    <AriaTableHeader {...otherProps}>
      {/* Add extra columns for drag and drop and selection. */}
      {allowsDragging && (
        <AriaColumn
          width={20}
          minWidth={20}
          style={{ width: 20 }}
          className='react-aria-Column button-base'
        />
      )}
      {selectionBehavior === 'toggle' && (
        <AriaColumn
          width={32}
          minWidth={32}
          style={{ width: 32 }}
          className='react-aria-Column button-base'
        >
          {selectionMode === 'multiple' && <Checkbox slot='selection' />}
        </AriaColumn>
      )}
      <Collection {...omitUndefined({ items: columns })}>{children}</Collection>
    </AriaTableHeader>
  );
}

export function Row<T>({
  id,
  columns,
  children,
  ...otherProps
}: Readonly<RowProps<T>>) {
  const { selectionBehavior, allowsDragging } = useTableOptions();

  return (
    <AriaRow {...omitUndefined({ id })} {...otherProps}>
      {allowsDragging && (
        <Cell>
          <Button slot='drag' className='drag-button'>
            <GripVertical />
          </Button>
        </Cell>
      )}
      {selectionBehavior === 'toggle' && (
        <Cell>
          <Checkbox slot='selection' />
        </Cell>
      )}
      <Collection {...omitUndefined({ items: columns })}>{children}</Collection>
    </AriaRow>
  );
}

export function TableBody<T>(props: Readonly<TableBodyProps<T>>) {
  return <AriaTableBody {...props} />;
}

export function TableFooter<T>(props: Readonly<TableFooterProps<T>>) {
  return <AriaTableFooter {...props} />;
}

export function Cell(props: Readonly<CellProps>) {
  return (
    <AriaCell {...props}>
      {composeRenderProps(
        props.children,
        (children, { hasChildItems, isTreeColumn }) => (
          <>
            {isTreeColumn && hasChildItems && (
              <Button slot='chevron'>
                <ChevronRight />
              </Button>
            )}
            {children}
          </>
        )
      )}
    </AriaCell>
  );
}

export function TableLoadMoreItem(props: Readonly<TableLoadMoreItemProps>) {
  return (
    <AriaTableLoadMoreItem {...props}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <ProgressCircle isIndeterminate aria-label='Loading more...' />
      </div>
    </AriaTableLoadMoreItem>
  );
}
