import type { Meta, StoryObj } from '@storybook/react-vite';
import { within, expect } from 'storybook/test';
import { withPortalProviders } from '../../storybook/storybookHarness';
import OrganisationDetails from './organisationDetails';

/**
 * `OrganisationDetails` is the organisation section of the account create/update flow.
 * It composes the entity name, ABN, trading/branch name lookups, web address and
 * street/postal address fields. Every field is Formik-bound, so the story provides an
 * initial-values context matching the field names.
 */
const meta = {
    title: 'Routes/Account/OrganisationDetails',
    component: OrganisationDetails,
    decorators: [withPortalProviders],
    parameters: {
        layout: 'padded',
        portal: {
            formik: {
                initialValues: {
                    name: 'Acme Metrology Pty Ltd',
                    abn: '00000000000',
                    businessOrTradingName: 'Acme Metrology',
                    branchOrLocationName: '',
                    isDefaultOrganisation: false,
                    businessWebsiteAddress: '',
                    streetAddress: '',
                    postalAddressSameAsStreetAddress: true,
                    postalAddress: '',
                },
            },
        },
    },
    tags: ['autodocs'],
} satisfies Meta<typeof OrganisationDetails>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(canvas.getByRole('heading', { name: 'Organisation details' })).toBeVisible();
        await expect(canvas.getByRole('heading', { name: 'Business street address' })).toBeVisible();
        await expect(canvas.getByLabelText(/entity name/i)).toBeInTheDocument();
    },
};
