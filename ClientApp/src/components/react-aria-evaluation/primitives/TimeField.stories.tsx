import type { Meta, StoryFn } from "@storybook/react-vite";
import { withReactAriaEvaluation } from "../../../storybook/withReactAriaEvaluation.tsx";
import { TimeField } from "./TimeField.tsx";

const meta = {
	decorators: [withReactAriaEvaluation],
	title: "Evaluation/React Aria/TimeField",
	component: TimeField,
	parameters: {
		layout: "centered",
	},
} satisfies Meta<typeof TimeField>;

export default meta;

type Story = StoryFn<typeof TimeField>;

export const Example: Story = (args) => <TimeField {...args} />;

Example.args = {
	label: "Event time",
};
