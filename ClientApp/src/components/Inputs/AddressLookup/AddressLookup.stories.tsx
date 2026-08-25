import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, within } from 'storybook/test';
import { http, HttpResponse } from 'msw';
import AddressLookup from './index';
import ManualAddressInput from './ManualAddressInput';
import { withPortalProviders } from '../../../storybook/storybookHarness';

const addressSearchHandler = http.get('/api/address/*', () => HttpResponse.json({
    addresses: [
        {
            id: 'addr-001',
            fullAddress: '1 Main Street, Canberra ACT 2600',
            streetAddress: {
                addressLine1: '1 Main Street',
                suburb: 'Canberra',
                state: 'ACT',
                postcode: '2600',
            },
        },
    ],
}));

const meta = {
    title: 'Components/Inputs/AddressLookup',
    component: AddressLookup,
    decorators: [withPortalProviders],
} satisfies Meta<typeof AddressLookup>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    args: {
        name: 'streetAddress',
        label: 'Street address',
        maxResults: 5,
        placeholder: 'Start typing an address...',
    },
    parameters: {
        portal: {
            formik: {
                initialValues: {
                    streetAddress: {
                        searchText: '',
                        addressLine1: '',
                        suburb: '',
                        state: '',
                        postcode: '',
                    },
                },
            },
        },
        msw: {
            handlers: [addressSearchHandler],
        },
    },
    render: () => (
        <AddressLookup
            name='streetAddress'
            label='Street address'
            maxResults={5}
            placeholder='Start typing an address...'
        />
    ),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const combobox = canvas.getByRole('combobox');
        await expect(combobox).toBeVisible();
    },
};

export const ManualEntry: Story = {
    args: {
        name: 'streetAddress',
        label: 'Street address',
    },
    parameters: {
        portal: {
            formik: {
                initialValues: {
                    streetAddress: {
                        line1: '',
                        line2: '',
                        line3: '',
                        suburb: '',
                        state: '',
                        postcode: '',
                    },
                },
            },
        },
    },
    render: () => (
        // Do not pass label — ManualAddressInput spreads extra props onto each
        // TextInput via {...rest}, which would override their individual field labels.
        <ManualAddressInput name='streetAddress' />
    ),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const line1 = canvas.getByLabelText(/address line 1/i);
        await expect(line1).toBeVisible();
        const suburb = canvas.getByLabelText(/suburb/i);
        await expect(suburb).toBeVisible();
    },
};
