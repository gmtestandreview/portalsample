"use client";
import {
	GridList as AriaGridList,
	GridListItem as AriaGridListItem,
	GridListLoadMoreItem as AriaGridListLoadMoreItem,
	Button,
	GridListHeader,
	type GridListItemProps,
	type GridListLoadMoreItemProps,
	type GridListProps,
	GridListSection,
	Text,
} from "react-aria-components/GridList";
import { GripVertical } from "../AriaComponents/NmiIcon";
import { ProgressCircle } from "../AriaComponents/ProgressCircle";
import { Checkbox } from "../Inputs/AriaCheckbox/Checkbox";
import "./GridList.css";

export function GridList<T>({
	children,
	layout = "grid",
	...props
}: GridListProps<T>) {
	return (
		<AriaGridList {...props} layout={layout}>
			{children}
		</AriaGridList>
	);
}

export function GridListItem({
	children,
	...props
}: Omit<GridListItemProps, "children"> & {
	children?: React.ReactNode;
}) {
	const textValue = typeof children === "string" ? children : undefined;
	return (
		<AriaGridListItem textValue={textValue} {...props}>
			{({ selectionMode, selectionBehavior, allowsDragging }) => (
				<>
					{/* Add elements for drag and drop and selection. */}
					{allowsDragging && (
						<Button slot="drag">
							<GripVertical size={16} />
						</Button>
					)}
					{selectionMode === "multiple" && selectionBehavior === "toggle" && (
						<Checkbox slot="selection" />
					)}
					{children}
				</>
			)}
		</AriaGridListItem>
	);
}

export function GridListLoadMoreItem(props: GridListLoadMoreItemProps) {
	return (
		<AriaGridListLoadMoreItem {...props}>
			<ProgressCircle isIndeterminate aria-label="Loading more..." />
		</AriaGridListLoadMoreItem>
	);
}

export { GridListHeader, GridListSection, Text };
