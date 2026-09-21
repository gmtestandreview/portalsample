import type { Meta, StoryObj } from "@storybook/react-vite";
import { withPortalProviders } from "../../storybook/storybookHarness";
import FAQs from "./faqs";
import HelpHowToSetupAccess from "./how-to-setup-access";

const meta = {
	title: "Routes/HelpGuide/Details",
	component: HelpHowToSetupAccess,
	decorators: [withPortalProviders],
	parameters: {
		layout: "fullscreen",
		portal: {
			authenticated: false,
			initialEntries: ["/help-guide/how-to-setup-access"],
		},
	},
} satisfies Meta<typeof HelpHowToSetupAccess>;

export default meta;
type Story = StoryObj<typeof meta>;

export const HowToSetupAccess: Story = {};

export const FrequentlyAskedQuestions: Story = {
	render: () => <FAQs />,
	parameters: {
		portal: {
			authenticated: false,
			initialEntries: ["/help-guide/faqs"],
		},
	},
};
