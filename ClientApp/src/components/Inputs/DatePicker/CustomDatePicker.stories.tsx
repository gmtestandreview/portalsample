import preview from '../../../../../.storybook/preview';
import { within, expect, fn } from 'storybook/test';
import { withPortalProviders } from '../../../storybook/storybookHarness';
import CustomDatePicker from './CustomDatePicker';

/**
 * `CustomDatePicker` composes `CustomDateInput` with react-datepicker to provide the
 * portal's accessible, AU-locale date field (dd/mm/yyyy) with Today/Close calendar
 * actions. It reads Formik state through its custom input, so stories run inside a
 * Formik context. The calendar opens on interaction; the default story shows the
 * collapsed field.
 */
const meta = preview.meta({
  title: 'Components/Inputs/DatePicker/CustomDatePicker',
  component: CustomDatePicker,
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
    dateOnBlur: fn(),
    dateOnChange: fn(),
  },
});


export const Collapsed = meta.story({
  play: async ({
    canvasElement,
  }) => {
    const canvas = within(canvasElement);

    await expect(canvas.getByText('Date of test')).toBeVisible();
    await expect(canvas.getByRole('textbox')).toBeVisible();
  },
});

export const Prefilled = meta.story({
  args: {
    currentDate: new Date('2024-04-01T00:00:00'),
  },
  play: async ({
    canvasElement,
  }) => {
    const canvas = within(canvasElement);

    await expect(canvas.getByRole('textbox')).toHaveValue('01/04/2024');
  },
});
