import preview from '../../../../../.storybook/preview';
import { useFormikContext } from 'formik';
import { expect, screen, userEvent, within } from 'storybook/test';
import { http, HttpResponse } from 'msw/http';
import AddressLookup from './index';
import ManualAddressInput from './ManualAddressInput';
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
  const { values } = useFormikContext<{
    streetAddress: {
      line1: string;
      suburb: string;
      state: string;
      postcode: string;
    };
  }>();
  const { line1, suburb, state, postcode } = values.streetAddress;

  return (
    <output aria-label='Selected address'>
      {[line1, suburb, state, postcode].filter(Boolean).join(', ')}
    </output>
  );
};

const meta = preview.meta({
  title: 'Components/Inputs/AddressLookup',
  component: AddressLookup,
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
  },
  render: () => (
    <>
      <AddressLookup
        name='streetAddress'
        label='Street address'
        maxResults={5}
        placeholder='Start typing an address...'
      />
      <AddressValueProbe />
    </>
  ),
  play: async ({
    canvasElement,
  }) => {
    const canvas = within(canvasElement);
    const user = userEvent.setup();
    const combobox = canvas.getByRole('combobox');

    await expect(combobox).toBeVisible();

    await user.type(combobox, 'Main');
    const addressOption = await screen.findByRole('option', {
      name: '1 Main Street, Canberra ACT 2600 (1 of 2)',
    });

    await expect(addressOption).toBeVisible();

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
  play: async ({
    canvasElement,
  }) => {
    const canvas = within(canvasElement);
    const line1 = canvas.getByLabelText(/address line 1/i);

    await expect(line1).toBeVisible();

    const suburb = canvas.getByLabelText(/suburb/i);

    await expect(suburb).toBeVisible();
  },
});
