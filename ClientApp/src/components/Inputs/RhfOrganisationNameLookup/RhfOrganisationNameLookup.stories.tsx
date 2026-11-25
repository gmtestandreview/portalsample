import { useForm, FormProvider } from 'react-hook-form';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, screen, userEvent } from 'storybook/test';
import RhfOrganisationNameLookup from './index';

interface LookupValues {
  businessOrTradingName: string;
  orgNameOptions: { tradingName: string }[];
}

const LookupStory = (
  props: React.ComponentProps<typeof RhfOrganisationNameLookup>,
) => {
  const methods = useForm<LookupValues>({
    defaultValues: {
      businessOrTradingName: '',
      orgNameOptions: [
        { tradingName: 'Acme Instruments' },
        { tradingName: 'Acme Measurement Services' },
      ],
    },
  });

  return (
    <FormProvider {...methods}>
      <form>
        <RhfOrganisationNameLookup {...props} />
      </form>
    </FormProvider>
  );
};

const meta = {
  title: 'Components/Inputs/RhfOrganisationNameLookup',
  component: RhfOrganisationNameLookup,
  render: (args) => <LookupStory {...args} />,
  args: {
    name: 'businessOrTradingName',
    label: 'Business or trading name',
    placeholder: 'Enter the business or trading name',
    optionsFieldName: 'tradingName',
  },
} satisfies Meta<typeof RhfOrganisationNameLookup>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async () => {
    const input = screen.getByRole('combobox', {
      name: 'Business or trading name',
    });
    await userEvent.type(input, 'Acme');

    const firstSuggestion = await screen.findByRole('option', {
      name: /Acme Instruments/,
    });
    await expect(firstSuggestion).toBeVisible();
    await userEvent.click(firstSuggestion);

    await expect(input).toHaveValue('Acme Instruments');
  },
};
