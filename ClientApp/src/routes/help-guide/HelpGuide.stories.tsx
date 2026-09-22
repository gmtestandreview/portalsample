import type { Meta, StoryObj } from "@storybook/react-vite";
import { withPortalProviders } from "../../storybook/storybookHarness.tsx";
import HelpGuide from "./index.tsx";

const meta = {
	title: "Routes/HelpGuide",
	component: HelpGuide,
	decorators: [withPortalProviders],
	parameters: {
		layout: "fullscreen",
		portal: {
			initialEntries: ["/help-guide"],
		},
	},
} satisfies Meta<typeof HelpGuide>;

export default meta;
type Story = StoryObj<typeof meta>;

export const AuthenticatedJourney: Story = {};

export const PublicJourney: Story = {
	parameters: {
		portal: {
			authenticated: false,
			initialEntries: ["/help-guide"],
		},
	},
};
