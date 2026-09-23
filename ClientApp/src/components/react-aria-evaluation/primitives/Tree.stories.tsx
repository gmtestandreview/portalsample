import type { Meta, StoryFn } from "@storybook/react-vite";
import { withReactAriaEvaluation } from "../../../storybook/withReactAriaEvaluation.tsx";
import { Tree, TreeItem } from "./Tree.tsx";

const meta = {
	decorators: [withReactAriaEvaluation],
	title: "Evaluation/React Aria/Tree",
	component: Tree,
	parameters: {
		layout: "centered",
	},
} satisfies Meta<typeof Tree>;

export default meta;

type Story = StoryFn<typeof Tree>;

export const Example: Story = (args) => (
	<Tree aria-label="Files" {...args}>
		<TreeItem title="Documents">
			<TreeItem title="Project">
				<TreeItem title="Weekly Report" />
			</TreeItem>
		</TreeItem>
		<TreeItem title="Photos">
			<TreeItem title="Image 1" />
			<TreeItem title="Image 2" />
		</TreeItem>
	</Tree>
);

Example.args = {
	style: { height: "300px" },
	defaultExpandedKeys: ["documents", "photos", "project"],
};
