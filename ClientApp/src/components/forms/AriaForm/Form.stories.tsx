import type { Meta, StoryFn } from "@storybook/react-vite";
import { withReactAriaEvaluation } from "../../../storybook/withReactAriaEvaluation";
import { TextField } from "../../AriaComponents/TextField";
import { Button } from "../../Buttons/AriaButton/Button";
import { Form } from "./Form";

const meta = {
	decorators: [withReactAriaEvaluation],
	title: "Evaluation/React Aria/Form",
	component: Form,
	parameters: {
		layout: "centered",
	},
} satisfies Meta<typeof Form>;

export default meta;
type Story = StoryFn<typeof Form>;

export const Example: Story = (args) => (
	<Form {...args}>
		<TextField
			name="email"
			type="email"
			isRequired
			label="Email"
			placeholder="Enter your email"
		/>
		<Button type="submit">Submit</Button>
	</Form>
);
