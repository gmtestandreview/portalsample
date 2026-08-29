import type { Meta, StoryObj } from '@storybook/react-vite';
import { within, expect, userEvent } from 'storybook/test';
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
                    // OrganisationNameLookup reads its options from the `orgNameOptions`
                    // field, not from `tradingName`/`branchName`, and filters them by
                    // `item[optionsFieldName]`. Shaped as the generated client's
                    // OrgNameOption, so the lookup can actually match.
                    orgNameOptions: [
                        {
                            orgName: 'Storybook Organisation',
                            tradingName: 'Precision Testing',
                            branchName: 'Sydney Laboratory',
                        },
                    ],
                    isDefaultOrganisation: true,
                    businessWebsiteAddress: 'https://example.com',
                    streetAddress: {},
                    postalAddressSameAsStreetAddress: true,
                    postalAddress: {},
                },
            },
        },
    },
} satisfies Meta<typeof AccountDetails>;

export default meta;
type Story = StoryObj<typeof meta>;

export const OrganisationDetails: Story = {
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const tradingName = canvas.getByLabelText('Business or Trading name (optional)');
        await userEvent.clear(tradingName);
        await userEvent.type(tradingName, 'Prec');
        // The lookup filters behind a 300ms debounce, so the suggestion is the settled state.
        // Without driving and awaiting it the debounce fired after the story had ended, which
        // is what left OrganisationNameLookup updating outside act - twice, once per instance
        // on this route.
        await expect(await canvas.findByRole('option', { name: /Precision Testing/ })).toBeVisible();
    },
};

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
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        // This story seeds empty lookups. Driving one to its suggestion is what settles both
        // OrganisationNameLookup debounces on this route; without it they fired after the
        // story had ended.
        const tradingName = canvas.getByLabelText('Business or Trading name (optional)');
        await userEvent.type(tradingName, 'Prec');
        await expect(await canvas.findByRole('option', { name: /Precision Testing/ })).toBeVisible();
    },
};
