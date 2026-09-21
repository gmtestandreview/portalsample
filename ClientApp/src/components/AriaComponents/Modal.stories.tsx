import type { Meta, StoryFn } from "@storybook/react-vite";
import { withReactAriaEvaluation } from "../../storybook/withReactAriaEvaluation";
import { Button } from "../Buttons/AriaButton/Button";
import { Dialog, DialogTrigger } from "../Dialog/Dialog";
import { Heading } from "./Content";
import { Modal } from "./Modal";
import { TextField } from "./TextField";

const meta = {
	decorators: [withReactAriaEvaluation],
	title: "Evaluation/React Aria/Modal",
	component: Modal,
	parameters: {
		layout: "centered",
	},
} satisfies Meta<typeof Modal>;

export default meta;
type Story = StoryFn<typeof Modal>;

export const Example: Story = (args) => (
	<DialogTrigger>
		<Button>Sign up…</Button>
		<Modal {...args}>
			<Dialog>
				<form>
					<Heading slot="title">Sign up</Heading>
					<TextField
						autoFocus
						label="First Name"
						placeholder="Enter your first name"
					/>
					<TextField label="Last Name" placeholder="Enter your last name" />
					<Button slot="close">Submit</Button>
				</form>
			</Dialog>
		</Modal>
	</DialogTrigger>
);
