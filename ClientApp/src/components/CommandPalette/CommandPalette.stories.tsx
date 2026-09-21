import type { Meta, StoryFn } from "@storybook/react-vite";
import { withReactAriaEvaluation } from "../../storybook/withReactAriaEvaluation";
import { MenuItem } from "../AriaComponents/Menu";
import { Button } from "../Buttons/AriaButton/Button";
import { DialogTrigger } from "../Dialog/Dialog";
import { CommandPalette } from "./CommandPalette";

const meta = {
	decorators: [withReactAriaEvaluation],
	title: "Evaluation/React Aria/CommandPalette",
	component: CommandPalette,
	parameters: {
		layout: "centered",
	},
} satisfies Meta<typeof CommandPalette>;

export default meta;
type Story = StoryFn<typeof CommandPalette>;

export const Example: Story = (args) => (
	<DialogTrigger>
		<Button>
			Open Command Palette <kbd>⌘ J</kbd>
		</Button>
		<CommandPalette {...args}>
			<MenuItem>Create new file...</MenuItem>
			<MenuItem>Create new folder...</MenuItem>
			<MenuItem>Assign to...</MenuItem>
			<MenuItem>Assign to me</MenuItem>
			<MenuItem>Change status...</MenuItem>
			<MenuItem>Change priority...</MenuItem>
			<MenuItem>Add label...</MenuItem>
			<MenuItem>Remove label...</MenuItem>
		</CommandPalette>
	</DialogTrigger>
);
