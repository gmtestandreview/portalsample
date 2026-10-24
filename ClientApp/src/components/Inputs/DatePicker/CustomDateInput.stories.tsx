import preview from '../../../../../.storybook/preview';
import { within, expect, fn } from 'storybook/test';
import { withPortalProviders } from '../../../storybook/storybookHarness';
import CustomDateInput from './CustomDateInput';

/**
 * `CustomDateInput` is the text-field + calendar-button control that
 * `CustomDatePicker` plugs into react-datepicker as its custom input. It reads its
 * Formik field state via `useField`, so the stories run inside a Formik context.
 */
const meta = preview.meta({
  title: 'Components/Inputs/DatePicker/CustomDateInput',
  component: CustomDateInput,
  decorators: [withPortalProviders],
  parameters: {
    layout: 'padded',
    portal: {
      formik: {
        initialValues: { testDate: '' },
      },
    },
  },
  args: {
    name: 'testDate',
    label: 'Date of test',
    calendarButtonTitle: 'test date',
    placeholder: 'dd/mm/yyyy',
    handleCloseCalendar: fn(),
    handleEnsureCalendarClosed: fn(),
    handleOpenCalendar: fn(),
    wrapperUUID: 'story-date-input',
  },
});


export const Default = meta.story({
  play: async ({
    canvasElement,
  }) => {
    const canvas = within(canvasElement);

    await expect(canvas.getByText('Date of test')).toBeVisible();
    await expect(canvas.getByRole('textbox')).toBeVisible();
    await expect(
      canvas.getByRole('button', { name: /choose your test date/i }),
    ).toBeVisible();
  },
});

export const WithError = meta.story({
  args: {
    hasError: true,
    errorMessage: 'Enter a valid date in dd/mm/yyyy format.',
  },
  play: async ({
    canvasElement,
  }) => {
    const canvas = within(canvasElement);

    await expect(canvas.getByText(/enter a valid date/i)).toBeVisible();
  },
});
