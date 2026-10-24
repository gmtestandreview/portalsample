import preview from '../../../../../.storybook/preview';
import { within, expect, userEvent } from 'storybook/test';
import RhfTextInput from '.';
import { withPortalProviders } from '../../../storybook/storybookHarness';

/**
 * React Hook Form counterpart of `TextInput`. It must render inside a
 * `FormProvider`; the portal harness supplies one through the `portal.rhf`
 * story parameter.
 */
const meta = preview.meta({
  title: 'Components/Inputs/RhfTextInput',
  component: RhfTextInput,
  decorators: [withPortalProviders],
  parameters: {
    layout: 'padded',
    portal: {
      rhf: { defaultValues: { organisationName: 'Acme Pty Ltd' } },
    },
  },
  args: {
    label: 'Organisation name for report',
    name: 'organisationName',
  },
});


export const Default = meta.story({
  play: async ({
    canvasElement,
  }) => {
    const canvas = within(canvasElement);
    const user = userEvent.setup();
    const input = canvas.getByLabelText('Organisation name for report');

    await expect(input).toHaveValue('Acme Pty Ltd');

    await user.clear(input);
    await user.type(input, 'Beta Labs');

    await expect(input).toHaveValue('Beta Labs');
  },
});

export const WithInlineHelp = meta.story({
  args: { inlineHelp: 'The name printed on the measurement report.' },
  play: async ({
    canvasElement,
  }) => {
    const canvas = within(canvasElement);

    await expect(
      canvas.getByText('The name printed on the measurement report.'),
    ).toHaveAttribute('id', 'help-organisationName');
    await expect(
      canvas.getByLabelText('Organisation name for report'),
    ).toHaveAttribute('aria-describedby', 'help-organisationName');
  },
});

export const Disabled = meta.story({
  args: { disabled: true },
  play: async ({
    canvasElement,
  }) => {
    const canvas = within(canvasElement);

    await expect(
      canvas.getByLabelText('Organisation name for report'),
    ).toBeDisabled();
  },
});

export const Summary = meta.story({
  args: { isSummary: true },
  play: async ({
    canvasElement,
  }) => {
    const canvas = within(canvasElement);

    await expect(canvas.getByText('Acme Pty Ltd')).toBeInTheDocument();
    await expect(canvas.queryByRole('textbox')).not.toBeInTheDocument();
  },
});
