import preview from '../../../../.storybook/preview';
import { expect, within } from 'storybook/test';
import SummaryDisplay from './index';

const meta = preview.meta({
  title: 'Components/SummaryDisplay',
  component: SummaryDisplay,
  parameters: {
    layout: 'centered',
  },
});


export const TextValue = meta.story({
  args: {
    label: 'Organisation name',
    value: 'Storybook Organisation',
    as: 'p',
  },
  // SB-021: label and value both render
  play: async ({
    canvasElement,
  }) => {
    const canvas = within(canvasElement);

    await expect(canvas.getByText('Organisation name')).toBeVisible();
    await expect(canvas.getByText('Storybook Organisation')).toBeVisible();
  },
});

export const PhoneValue = meta.story({
  args: {
    label: 'Business phone',
    value: '02 6213 6800',
    as: 'span',
  },
  // SB-021: phone label triggers WCAG screen-reader split — visually-hidden node present
  play: async ({
    canvasElement,
  }) => {
    const canvas = within(canvasElement);

    await expect(canvas.getByText('Business phone')).toBeVisible();
    // Visible value rendered (aria-hidden span is still in the DOM)
    await expect(canvas.getByText('02 6213 6800')).toBeInTheDocument();

    // A visually-hidden span is rendered for screen readers
    const hidden = canvasElement.querySelector('.visually-hidden');

    await expect(hidden).not.toBeNull();
  },
});

export const FormattedNumber = meta.story({
  args: {
    label: 'ABN',
    value: '00000000000',
    as: 'number',
    format: '## ### ### ###',
  },
  // SB-021: formatted number renders a visually-hidden spaced version for screen readers
  play: async ({
    canvasElement,
  }) => {
    const canvas = within(canvasElement);

    await expect(canvas.getByText('ABN')).toBeVisible();
  },
});

// SB-021: empty value renders dash fallback with visually-hidden "No details added"
export const EmptyValue = meta.story({
  args: {
    label: 'Serial number',
    value: undefined,
    as: 'span',
  },
  play: async ({
    canvasElement,
  }) => {
    const canvas = within(canvasElement);

    // Visible dash
    await expect(canvas.getByText('-', { exact: false })).toBeInTheDocument();
    // Screen-reader text
    await expect(canvas.getByText('No details added')).toBeInTheDocument();
  },
});

// SB-021: descriptor prop renders below the value
export const WithDescriptor = meta.story({
  args: {
    label: 'Calibration date',
    value: '15 March 2024',
    as: 'span',
    descriptor: 'Certificate valid for 12 months from this date.',
  },
  play: async ({
    canvasElement,
  }) => {
    const canvas = within(canvasElement);

    await expect(canvas.getByText('15 March 2024')).toBeVisible();
    await expect(
      canvas.getByText('Certificate valid for 12 months from this date.'),
    ).toBeVisible();
  },
});

// SB-021: custom bodyText renders when as='custom'
export const CustomBody = meta.story({
  args: {
    label: 'Notes',
    value: 'some-value',
    as: 'custom',
    bodyText: <em data-testid='custom-body'>Special formatted content</em>,
  },
  play: async ({
    canvasElement,
  }) => {
    const canvas = within(canvasElement);

    await expect(canvas.getByTestId('custom-body')).toBeVisible();
  },
});
