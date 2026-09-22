import type { Meta, StoryObj } from "@storybook/react-vite";
import { requestForQuoteDetailsFixture } from "../../storybook/storybookFixtures.ts";
import { withPortalProviders } from "../../storybook/storybookHarness.tsx";
import NmiContactDetails from "./nMIContactDetails.tsx";
import QuoteDetails from "./quoteDetails.tsx";

const meta = {
	title: "Routes/Quotation",
	component: QuoteDetails,
	decorators: [withPortalProviders],
	parameters: {
		layout: "padded",
	},
} satisfies Meta<typeof QuoteDetails>;

export default meta;
type Story = StoryObj<typeof meta>;

export const QuoteSummary: Story = {
	args: {
		quotationData: requestForQuoteDetailsFixture,
		isSummary: false,
		firstName: "Taylor",
		lastName: "Nguyen",
		fileError: false,
	},
	render: () => (
		<>
			<QuoteDetails
				quotationData={requestForQuoteDetailsFixture}
				isSummary={false}
				firstName="Taylor"
				lastName="Nguyen"
				fileError={false}
			/>
			<NmiContactDetails quotationData={requestForQuoteDetailsFixture} />
		</>
	),
};

export const ExpiredNoDelivery: Story = {
	args: {
		quotationData: {
			...requestForQuoteDetailsFixture,
			quoteRequestStatus: "Quote - Expired",
			receiptandDispatchNA: true,
		},
		isSummary: false,
		firstName: "Taylor",
		lastName: "Nguyen",
		fileError: false,
	},
	render: (args) => (
		<>
			<QuoteDetails {...args} />
			<NmiContactDetails quotationData={args.quotationData} />
		</>
	),
};
