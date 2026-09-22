import type { Meta, StoryFn } from "@storybook/react-vite";
import { withReactAriaEvaluation } from "../../storybook/withReactAriaEvaluation.tsx";
import { Button } from "../Buttons/AriaButton/Button.tsx";
import { Dialog, DialogTrigger } from "../Dialog/Dialog.tsx";
import { Heading } from "./Content.tsx";
import { Modal } from "./Modal.tsx";
import { TextField } from "./TextField.tsx";

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
						autoFocus={true}
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
