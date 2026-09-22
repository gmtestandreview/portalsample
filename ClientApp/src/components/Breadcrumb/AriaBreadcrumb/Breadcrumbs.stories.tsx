import type { Meta, StoryFn } from "@storybook/react-vite";
import { withReactAriaEvaluation } from "../../../storybook/withReactAriaEvaluation.tsx";
import { Breadcrumb, Breadcrumbs } from "./Breadcrumbs.tsx";

const meta = {
	decorators: [withReactAriaEvaluation],
	title: "Evaluation/React Aria/Breadcrumbs",
	component: Breadcrumbs,
	parameters: {
		layout: "centered",
	},
} satisfies Meta<typeof Breadcrumbs>;

export default meta;
type Story = StoryFn<typeof Breadcrumbs>;

export const Example: Story = (args) => (
	<Breadcrumbs {...args}>
		<Breadcrumb href="/">Home</Breadcrumb>
		<Breadcrumb href="/react-aria/">React Aria</Breadcrumb>
		<Breadcrumb>Breadcrumbs</Breadcrumb>
	</Breadcrumbs>
);
