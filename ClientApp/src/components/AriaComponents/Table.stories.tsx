import type { Meta, StoryFn } from "@storybook/react-vite";
import { withReactAriaEvaluation } from "../../storybook/withReactAriaEvaluation.tsx";
import { Cell, Column, Row, Table, TableBody, TableHeader } from "./Table.tsx";

const meta = {
	decorators: [withReactAriaEvaluation],
	title: "Evaluation/React Aria/Table",
	component: Table,
	parameters: {
		layout: "centered",
	},
} satisfies Meta<typeof Table>;

export default meta;

type Story = StoryFn<typeof Table>;

export const Example: Story = (args) => (
	<Table aria-label="Files" {...args}>
		<TableHeader>
			<Column isRowHeader={true}>Name</Column>
			<Column>Type</Column>
			<Column>Date Modified</Column>
		</TableHeader>
		<TableBody>
			<Row>
				<Cell>Games</Cell>
				<Cell>File folder</Cell>
				<Cell>6/7/2020</Cell>
			</Row>
			<Row>
				<Cell>Program Files</Cell>
				<Cell>File folder</Cell>
				<Cell>4/7/2021</Cell>
			</Row>
			<Row>
				<Cell>bootmgr</Cell>
				<Cell>System file</Cell>
				<Cell>11/20/2010</Cell>
			</Row>
		</TableBody>
	</Table>
);

Example.args = {
	onRowAction: undefined,
	selectionMode: "multiple",
};
