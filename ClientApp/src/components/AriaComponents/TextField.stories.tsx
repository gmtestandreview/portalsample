import type { Meta, StoryFn } from "@storybook/react-vite";
import { withReactAriaEvaluation } from "../../storybook/withReactAriaEvaluation.tsx";
import { TextField } from "./TextField.tsx";

const meta = {
	decorators: [withReactAriaEvaluation],
	title: "Evaluation/React Aria/TextField",
	component: TextField,
	parameters: {
		layout: "centered",
	},
	args: {
		placeholder: "Enter your full name",
	},
} satisfies Meta<typeof TextField>;

export default meta;

type Story = StoryFn<typeof TextField>;

export const Example: Story = (args) => <TextField {...args} />;

Example.args = {
	label: "Name",
};
