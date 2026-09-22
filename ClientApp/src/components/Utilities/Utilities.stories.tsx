import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn } from "storybook/test";
import { withPortalProviders } from "../../storybook/storybookHarness.tsx";
import BackToTopButton from "./backToTopButton.tsx";
import ContactLink from "./ContactLink.tsx";
import SkipLinks from "./skipLinks.tsx";
import ViewPdfButton from "./ViewPdfButton.tsx";

const meta = {
	title: "Components/Utilities",
	component: ContactLink,
	decorators: [withPortalProviders],
	parameters: {
		layout: "padded",
	},
} satisfies Meta<typeof ContactLink>;

export default meta;
type Story = StoryObj<typeof meta>;

export const ContactActions: Story = {
	render: () => <ContactLink />,
};

export const SkipAndTopNavigation: Story = {
	render: () => (
		<div style={{ minHeight: 320 }}>
			<SkipLinks />
			<main id="main" className="pt-5">
				<h2>Example page content</h2>
				<p>Skip links and back-to-top affordances used by the portal shell.</p>
			</main>
			<BackToTopButton />
		</div>
	),
};

export const PdfActionLoaded: Story = {
	render: () => (
		<div style={{ minWidth: 360 }}>
			<ViewPdfButton
				text="View quotation PDF"
				fileSize="1.4 MB"
				isLoaded={true}
				getPdf={fn()}
				gaLabel="Quotation PDF"
			/>
		</div>
	),
};

export const PdfActionLoading: Story = {
	render: () => (
		<div style={{ minWidth: 360 }}>
			<ViewPdfButton
				text="View quotation PDF"
				fileSize="1.4 MB"
				isLoaded={false}
				getPdf={fn()}
				gaLabel="Quotation PDF"
			/>
		</div>
	),
};
