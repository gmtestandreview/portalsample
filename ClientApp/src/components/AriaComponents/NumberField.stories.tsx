import type { Meta, StoryFn } from "@storybook/react-vite";
import { withReactAriaEvaluation } from "../../storybook/withReactAriaEvaluation.tsx";
import { NumberField } from "./NumberField.tsx";

const meta = {
	decorators: [withReactAriaEvaluation],
	title: "Evaluation/React Aria/NumberField",
	component: NumberField,
	parameters: {
		layout: "centered",
	},
} satisfies Meta<typeof NumberField>;

export default meta;
type Story = StoryFn<typeof NumberField>;

export const Example: Story = (args) => <NumberField {...args} />;

Example.args = {
	label: "Cookies",
	placeholder: "-",
};
