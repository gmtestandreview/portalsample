import type { Meta, StoryFn } from "@storybook/react-vite";
import { withReactAriaEvaluation } from "../../storybook/withReactAriaEvaluation.tsx";
import { ColorSwatch } from "./ColorSwatch.tsx";

const meta = {
	decorators: [withReactAriaEvaluation],
	title: "Evaluation/React Aria/ColorSwatch",
	component: ColorSwatch,
	parameters: {
		layout: "centered",
	},
} satisfies Meta<typeof ColorSwatch>;

export default meta;
type Story = StoryFn<typeof ColorSwatch>;

export const Example: Story = (args) => <ColorSwatch {...args} />;

Example.args = {
	color: "#f00a",
};
