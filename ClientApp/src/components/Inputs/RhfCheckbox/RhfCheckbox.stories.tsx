import preview from '../../../../../.storybook/preview';
import { within, expect, userEvent } from 'storybook/test';
import RhfCheckbox from '.';
import { withPortalProviders } from '../../../storybook/storybookHarness';

/**
 * React Hook Form counterpart of `Checkbox`. It must render inside a
 * `FormProvider`; the portal harness supplies one through the `portal.rhf`
 * story parameter.
 */
const meta = preview.meta({
  title: 'Components/Inputs/RhfCheckbox',
  component: RhfCheckbox,
  decorators: [withPortalProviders],
  parameters: {
    layout: 'padded',
    portal: {
      rhf: { defaultValues: { acceptanceOfQuote: false } },
    },
  },
  args: {
    label: 'Yes, on behalf of my organisation, I accept the quotation',
    name: 'acceptanceOfQuote',
  },
});


export const Default = meta.story({
  play: async ({
    canvasElement,
  }) => {
    const canvas = within(canvasElement);
    const user = userEvent.setup();
    const checkbox = canvas.getByLabelText(
      'Yes, on behalf of my organisation, I accept the quotation',
    );

    await expect(checkbox).not.toBeChecked();

    await user.click(checkbox);

    await expect(checkbox).toBeChecked();
  },
});

export const WithInlineHelp = meta.story({
  args: { inlineHelp: 'You must accept to continue.' },
  play: async ({
    canvasElement,
  }) => {
    const canvas = within(canvasElement);

    await expect(
      canvas.getByText('You must accept to continue.'),
    ).toHaveAttribute('id', 'help-acceptanceOfQuote');
    await expect(canvas.getByRole('checkbox')).toHaveAttribute(
      'aria-describedby',
      'help-acceptanceOfQuote',
    );
  },
});

export const Disabled = meta.story({
  args: { disabled: true },
  play: async ({
    canvasElement,
  }) => {
    const canvas = within(canvasElement);

    await expect(canvas.getByRole('checkbox')).toBeDisabled();
  },
});

export const Summary = meta.story({
  args: { isSummary: true },
  play: async ({
    canvasElement,
  }) => {
    const canvas = within(canvasElement);

    await expect(canvas.getByText('No')).toBeInTheDocument();
    await expect(canvas.queryByRole('checkbox')).not.toBeInTheDocument();
  },
});
