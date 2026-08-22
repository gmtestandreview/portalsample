import type { Meta, StoryObj } from '@storybook/react-vite';
import AccountDetails from './accountDetails';
import { withPortalProviders } from '../../storybook/storybookHarness';

const meta = {
    title: 'Routes/Account/CreateAccountStep',
    component: AccountDetails,
    decorators: [withPortalProviders],
    parameters: {
        layout: 'padded',
        portal: {
            formik: {
                initialValues: {
                    name: 'Storybook Organisation',
                    abn: '00000000000',
                    businessOrTradingName: 'Precision Testing',
                    tradingName: ['Precision Testing'],
                    branchOrLocationName: 'Sydney Laboratory',
                    branchName: ['Sydney Laboratory'],
                    isDefaultOrganisation: true,
                    businessWebsiteAddress: 'https://example.com',
                    streetAddress: {},
                    postalAddressSameAsStreetAddress: true,
                    postalAddress: {},
                },
            },
        },
    },
    tags: ['autodocs'],
} satisfies Meta<typeof AccountDetails>;

export default meta;
type Story = StoryObj<typeof meta>;

export const OrganisationDetails: Story = {};

export const OrganisationDetailsValidation: Story = {
    parameters: {
        portal: {
            formik: {
                initialValues: {
                    name: 'Storybook Organisation',
                    abn: '00000000000',
                    businessOrTradingName: '',
                    tradingName: [],
                    branchOrLocationName: '',
                    branchName: [],
                    isDefaultOrganisation: false,
                    businessWebsiteAddress: '',
                    streetAddress: {},
                    postalAddressSameAsStreetAddress: false,
                    postalAddress: {},
                },
                initialErrors: {
                    businessWebsiteAddress: 'Enter a valid business website address.',
                    streetAddress: 'Enter a business street address.',
                    postalAddress: 'Enter a business postal address.',
                },
                initialTouched: {
                    businessWebsiteAddress: true,
                    streetAddress: true,
                    postalAddress: true,
                },
            },
        },
    },
};
