import type { Meta, StoryFn } from "@storybook/react-vite";
import { withReactAriaEvaluation } from "../../storybook/withReactAriaEvaluation.tsx";
import { Button } from "../Buttons/AriaButton/Button.tsx";
import { Save } from "./NmiIcon.tsx";
import { Tooltip, TooltipTrigger } from "./Tooltip.tsx";

const meta = {
	decorators: [withReactAriaEvaluation],
	title: "Evaluation/React Aria/Tooltip",
	component: Tooltip,
	parameters: {
		layout: "centered",
	},
} satisfies Meta<typeof Tooltip>;

export default meta;

type Story = StoryFn<typeof Tooltip>;

export const Example: Story = (args) => (
	<TooltipTrigger>
		<Button aria-label="Save">
			<Save size={18} />
		</Button>
		<Tooltip {...args}>Save</Tooltip>
	</TooltipTrigger>
);
