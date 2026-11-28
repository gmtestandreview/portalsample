import preview from '../../../../../.storybook/preview';
import { useFormContext, useWatch } from 'react-hook-form';
import { expect, screen, userEvent, within } from 'storybook/test';
import { http, HttpResponse } from 'msw/http';
import RhfAddressLookup from '../RhfAddressLookup';
import RhfManualAddressInput from '../RhfAddressLookup/RhfManualAddressInput';
import { withPortalProviders } from '../../../storybook/storybookHarness';

const addressSearchHandler = http.get('/api/address/*', () =>
  HttpResponse.json({
    matches: [
      {
        unqiueId: 'addr-001',
        displayText: '1 Main Street, Canberra ACT 2600',
        addressLine1: '1 Main Street',
        suburb: 'Canberra',
        state: 'ACT',
        postCode: '2600',
      },
    ],
  }),
);

const AddressValueProbe = () => {
  const { setValue } = useFormContext();
  const streetAddress = useWatch({ name: 'streetAddress' }) as {
    line1: string;
    suburb: string;
    state: string;
    postcode: string;
  };
  const { line1, suburb, state, postcode } = streetAddress;

  return (
    <>
      <output aria-label='Selected address'>
        {[line1, suburb, state, postcode].filter(Boolean).join(', ')}
      </output>
      <button
        type='button'
        onClick={() => {
          setValue('streetAddress', {
            ...streetAddress,
            line1: '2 External Street',
            isManuallyEntered: true,
          });
        }}
      >
        Set address from outside the lookup
      </button>
    </>
  );
};

const meta = preview.meta({
  title: 'Components/Inputs/AddressLookup',
  component: RhfAddressLookup,
  decorators: [withPortalProviders],
});

export const Default = meta.story({
  args: {
    name: 'streetAddress',
    label: 'Street address',
    maxResults: 5,
    placeholder: 'Start typing an address...',
  },
  beforeEach({ msw }) {
    msw.use(addressSearchHandler);
  },
  parameters: {
    docs: { story: { inline: false } },
    portal: {
      rhf: {
        defaultValues: {
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
  },
  render: () => (
    <>
      <RhfAddressLookup
        name='streetAddress'
        label='Street address'
        maxResults={5}
        placeholder='Start typing an address...'
      />
      <AddressValueProbe />
    </>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const user = userEvent.setup();
    const combobox = canvas.getByRole('combobox');

    await expect(combobox).toBeVisible();

    await user.type(combobox, 'Main');
    const addressOption = await screen.findByRole('option', {
      name: '1 Main Street, Canberra ACT 2600 (1 of 2)',
    });

    await expect(addressOption).toBeVisible();
    await expect(addressOption).toHaveAccessibleName(
      '1 Main Street, Canberra ACT 2600 (1 of 2)',
    );

    await user.click(addressOption);

    await expect(combobox).toHaveValue('1 Main Street, Canberra ACT 2600');
    await expect(canvas.getByLabelText('Selected address')).toHaveTextContent(
      '1 Main Street, Canberra, ACT, 2600',
    );
  },
});

export const ManualEntry = meta.story({
  args: {
    name: 'streetAddress',
    label: 'Street address',
  },
  parameters: {
    portal: {
      rhf: {
        defaultValues: {
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
    // Do not pass label — RhfManualAddressInput spreads extra props onto each
    // RhfTextInput via {...rest}, which would override their individual field labels.
    <RhfManualAddressInput name='streetAddress' />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const line1 = canvas.getByLabelText(/address line 1/i);

    await expect(line1).toBeVisible();

    const suburb = canvas.getByLabelText(/suburb/i);

    await expect(suburb).toBeVisible();
  },
});

export const ExternalFormUpdate = meta.story({
  args: {
    name: 'streetAddress',
    label: 'Street address',
  },
  parameters: {
    portal: {
      rhf: {
        defaultValues: {
          streetAddress: {
            line1: '',
            line2: '',
            line3: '',
            suburb: '',
            state: '',
            postcode: '',
            searchText: '',
            isManuallyEntered: false,
          },
        },
      },
    },
  },
  render: () => (
    <>
      <RhfAddressLookup name='streetAddress' label='Street address' />
      <AddressValueProbe />
    </>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const user = userEvent.setup();

    await user.click(
      canvas.getByRole('button', {
        name: 'Set address from outside the lookup',
      }),
    );
    await expect(canvas.getByLabelText(/address line 1/i)).toHaveValue(
      '2 External Street',
    );
  },
});
