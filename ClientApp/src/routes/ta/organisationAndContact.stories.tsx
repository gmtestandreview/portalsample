import type { Meta, StoryObj } from '@storybook/react-vite';
import { within, expect } from 'storybook/test';
import { withPortalProviders } from '../../storybook/storybookHarness';
import OrganisationAndContact from './organisationAndContact';

/**
 * `OrganisationAndContact` is the organisation/contact step of the type-approval wizard.
 * It captures the organisation type, name and authorised agent, plus the application's
 * main contact. Every field is Formik-bound under the step `name` prefix, so the story
 * provides a matching initial-values context.
 */
const meta = {
    title: 'Routes/TypeApproval/OrganisationAndContact',
    component: OrganisationAndContact,
    decorators: [withPortalProviders],
    parameters: {
        layout: 'fullscreen',
        portal: {
            authenticated: true,
            initialEntries: ['/ta/PA-1/organisation-details'],
            formik: {
                initialValues: {
                    sourceReferenceId: '',
                    organisationAndContact: {
                        organisationType: '',
                        name: '',
                    },
                },
            },
        },
    },
    args: {
        name: 'organisationAndContact',
        isSummary: false,
    },
    tags: ['autodocs'],
} satisfies Meta<typeof OrganisationAndContact>;

export default meta;
type Story = StoryObj<typeof meta>;

export const EditStep: Story = {
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(canvas.getByText('Organisation type')).toBeInTheDocument();
        await expect(canvas.getByLabelText(/organisation name/i)).toBeInTheDocument();
    },
};
