import type { Meta, StoryObj } from '@storybook/react-vite';
import { within, expect } from 'storybook/test';
import { withPortalProviders } from '../../storybook/storybookHarness';
import SummaryAndSubmit from './summaryAndSubmit';

/**
 * `SummaryAndSubmit` is the final step of the type-approval wizard. It presents the
 * captured Organisation, Application and Supporting-documents sections as review
 * accordions, plus the terms-and-conditions declarations the applicant must accept
 * before submitting. While editable it shows review guidance and Edit buttons; once
 * submitted it shows a back-to-dashboard link. All sections are Formik-bound.
 */
const initialValues = {
    organisationAndContact: {},
    applicationAndInstrument: {},
    supportingDocuments: { form: { documents: [] } },
    acceptNMIP106: false,
    acceptTermsAndConditions: false,
    acceptDeclaration: false,
};

const meta = {
    title: 'Routes/TypeApproval/SummaryAndSubmit',
    component: SummaryAndSubmit,
    decorators: [withPortalProviders],
    parameters: {
        layout: 'fullscreen',
        portal: {
            authenticated: true,
            initialEntries: ['/ta/PA-1/summary'],
            formik: { initialValues },
        },
    },
    args: {
        name: 'summaryAndSubmit',
        isSubmitted: false,
    },
    tags: ['autodocs'],
} satisfies Meta<typeof SummaryAndSubmit>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Editable: Story = {
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(canvas.getByText('Organisation details')).toBeVisible();
        await expect(canvas.getByText('Terms and conditions')).toBeVisible();
        await expect(canvas.getByText(/before you submit your request/i)).toBeVisible();
    },
};

export const Submitted: Story = {
    args: {
        isSubmitted: true,
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(canvas.getByTestId('back-button')).toBeVisible();
        await expect(canvas.queryByText(/before you submit your request/i)).toBeNull();
    },
};
