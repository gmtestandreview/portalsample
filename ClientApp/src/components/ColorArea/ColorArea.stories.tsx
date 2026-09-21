import type { Meta, StoryFn } from "@storybook/react-vite";
import { withReactAriaEvaluation } from "../../storybook/withReactAriaEvaluation";
import { ColorArea } from "./ColorArea";

const meta = {
	decorators: [withReactAriaEvaluation],
	title: "Evaluation/React Aria/ColorArea",
	component: ColorArea,
	parameters: {
		layout: "centered",
	},
} satisfies Meta<typeof ColorArea>;

export default meta;
type Story = StoryFn<typeof ColorArea>;

export const Example: Story = (args) => (
	<ColorArea {...args} style={{ width: 200 }} />
);

Example.args = {
	defaultValue: "hsl(30, 100%, 50%)",
};
