'use client';
import {
  Button,
  Tree as AriaTree,
  TreeItem as AriaTreeItem,
  TreeItemContent as AriaTreeItemContent,
  type TreeItemContentProps,
  type TreeItemContentRenderProps,
  type TreeItemProps as AriaTreeItemProps,
  type TreeProps,
  TreeLoadMoreItem as AriaTreeLoadMoreItem,
  type TreeLoadMoreItemProps,
  TreeSection as AriaTreeSection,
  TreeHeader as AriaTreeHeader,
} from 'react-aria-components/Tree';
import { ChevronRight, GripVertical } from './NmiIcon';
import { Checkbox } from '../Inputs/AriaCheckbox/Checkbox';
import { ProgressCircle } from './ProgressCircle';
import './Tree.css';

export function Tree<T>(props: Readonly<TreeProps<T>>) {
  return <AriaTree {...props} />;
}

export function TreeItemContent(
  props: Readonly<
    Omit<TreeItemContentProps, 'children'> & { children?: React.ReactNode }
  >
) {
  return (
    <AriaTreeItemContent>
      {({
        selectionBehavior,
        selectionMode,
        allowsDragging,
      }: TreeItemContentRenderProps) => (
        <>
          {allowsDragging && (
            <Button slot='drag'>
              <GripVertical size={16} />
            </Button>
          )}
          {selectionBehavior === 'toggle' && selectionMode !== 'none' && (
            <Checkbox slot='selection' />
          )}
          <Button slot='chevron'>
            <ChevronRight />
          </Button>
          {props.children}
        </>
      )}
    </AriaTreeItemContent>
  );
}

export interface TreeItemProps extends Partial<AriaTreeItemProps> {
  title?: React.ReactNode;
}

export function TreeItem(props: Readonly<TreeItemProps>) {
  const textValue = typeof props.title === 'string' ? props.title : '';
  return (
    <AriaTreeItem textValue={textValue} {...props}>
      {props.title != null ? (
        <>
          <TreeItemContent>{props.title}</TreeItemContent>
          {props.children}
        </>
      ) : (
        props.children
      )}
    </AriaTreeItem>
  );
}

export function TreeLoadMoreItem(props: Readonly<TreeLoadMoreItemProps>) {
  return (
    <AriaTreeLoadMoreItem {...props}>
      <ProgressCircle isIndeterminate aria-label='Loading more...' />
    </AriaTreeLoadMoreItem>
  );
}

export function TreeSection(
  props: Readonly<React.ComponentProps<typeof AriaTreeSection>>
) {
  return <AriaTreeSection {...props} />;
}

export function TreeHeader(
  props: Readonly<React.ComponentProps<typeof AriaTreeHeader>>
) {
  return <AriaTreeHeader {...props} />;
}
