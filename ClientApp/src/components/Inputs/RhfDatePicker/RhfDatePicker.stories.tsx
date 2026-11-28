import { useWatch } from 'react-hook-form';
import preview from '../../../../../.storybook/preview';
import { expect, within } from 'storybook/test';
import RhfDatePicker from '.';
import { withPortalProviders } from '../../../storybook/storybookHarness';

const StoredValue = () => {
  const value = useWatch({ name: 'testDate' }) as unknown;
  return <output data-testid='stored'>{JSON.stringify(value)}</output>;
};

/**
 * React Hook Form counterpart of `DatePicker`. It must render inside a
 * `FormProvider`; the portal harness supplies one through `portal.rhf`.
 * The stories show the stored value next to the field.
 */
const meta = preview.meta({
  title: 'Components/Inputs/RhfDatePicker',
  component: RhfDatePicker,
  decorators: [withPortalProviders],
  parameters: {
    layout: 'padded',
    portal: {
      rhf: { defaultValues: { testDate: '' } },
    },
  },
  args: {
    name: 'testDate',
    label: 'Date of test',
    calendarButtonTitle: 'test date',
  },
  render: (args) => (
    <>
      <RhfDatePicker {...args} />
      <StoredValue />
    </>
  ),
});

export const TypedDateIsStoredOnBlur = meta.story({
  play: async ({ canvasElement, userEvent }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByRole('textbox', { name: 'Date of test' });

    await expect(input).toHaveAttribute('placeholder', 'dd/mm/yyyy');
    await userEvent.type(input, '14/08/2026');
    await userEvent.tab();
    await userEvent.tab();

    await expect(canvas.getByTestId('stored')).toHaveTextContent(
      '"2026-08-14T00:00:00+00:00"',
    );
  },
});

export const Prefilled = meta.story({
  parameters: {
    portal: {
      rhf: { defaultValues: { testDate: '2026-06-01T00:00:00+00:00' } },
    },
  },
  play: async ({ canvasElement, userEvent }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByRole('textbox', { name: 'Date of test' });

    await expect(input).toHaveValue('01/06/2026');

    await userEvent.clear(input);
    await userEvent.tab();
    await userEvent.tab();

    await expect(canvas.getByTestId('stored')).toHaveTextContent('null');
  },
});

export const Summary = meta.story({
  args: { isSummary: true },
  parameters: {
    portal: {
      rhf: { defaultValues: { testDate: '2026-06-01T00:00:00+00:00' } },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(canvas.getByText('01 Jun 2026')).toBeVisible();
    await expect(canvas.queryByRole('textbox')).not.toBeInTheDocument();
  },
});
