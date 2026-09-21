import { InteractionStatus } from "@azure/msal-browser";
import type { Meta, StoryObj } from "@storybook/react-vite";
import {
	mockMsalAccount,
	withPortalProviders,
} from "../../storybook/storybookHarness";
import SignOut from "../sign-out";
import SignOutHelper from "../sign-out-helper";
import SignIn from "./index";

const meta = {
	title: "Routes/Auth",
	component: SignIn,
	decorators: [withPortalProviders],
	parameters: {
		layout: "fullscreen",
	},
} satisfies Meta<typeof SignIn>;

export default meta;
type Story = StoryObj<typeof meta>;

export const SignInLoading: Story = {};

export const SignOutLoading: Story = {
	render: () => <SignOut />,
	parameters: {
		portal: {
			authenticated: true,
			msalContext: {
				inProgress: InteractionStatus.None,
				accounts: [mockMsalAccount],
			},
		},
	},
};

export const SignOutCompletion: Story = {
	render: () => <SignOutHelper />,
	parameters: {
		portal: {
			authenticated: false,
			initialEntries: ["/sign-out-helper"],
		},
	},
};
