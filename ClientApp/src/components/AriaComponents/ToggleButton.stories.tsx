import type { Meta, StoryFn } from "@storybook/react-vite";
import { withReactAriaEvaluation } from "../../storybook/withReactAriaEvaluation.tsx";
import { ToggleButton } from "./ToggleButton.tsx";

const meta = {
	decorators: [withReactAriaEvaluation],
	title: "Evaluation/React Aria/ToggleButton",
	component: ToggleButton,
	parameters: {
		layout: "centered",
	},
} satisfies Meta<typeof ToggleButton>;

export default meta;

type Story = StoryFn<typeof ToggleButton>;

export const Example: Story = (args) => (
	<ToggleButton {...args}>Pin</ToggleButton>
);
