import type { Meta, StoryFn } from "@storybook/react-vite";
import { withReactAriaEvaluation } from "../../../storybook/withReactAriaEvaluation.tsx";
import { SearchField } from "./SearchField.tsx";

const meta = {
	decorators: [withReactAriaEvaluation],
	title: "Evaluation/React Aria/SearchField",
	component: SearchField,
	parameters: {
		layout: "centered",
	},
} satisfies Meta<typeof SearchField>;

export default meta;

type Story = StoryFn<typeof SearchField>;

export const Example: Story = (args) => <SearchField {...args} />;

Example.args = {
	label: "Search",
	placeholder: "Search documents",
};
