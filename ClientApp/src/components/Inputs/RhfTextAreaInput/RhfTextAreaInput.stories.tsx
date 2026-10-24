import preview from '../../../../../.storybook/preview';
import { within, expect, userEvent } from 'storybook/test';
import RhfTextAreaInput from '.';
import { withPortalProviders } from '../../../storybook/storybookHarness';

/**
 * React Hook Form counterpart of `TextAreaInput`. It must render inside a
 * `FormProvider`; the portal harness supplies one through the `portal.rhf`
 * story parameter.
 */
const meta = preview.meta({
  title: 'Components/Inputs/RhfTextAreaInput',
  component: RhfTextAreaInput,
  decorators: [withPortalProviders],
  parameters: {
    layout: 'padded',
    portal: {
      rhf: { defaultValues: { packagingNotes: 'Fragile' } },
    },
  },
  args: {
    label: 'Packaging notes (optional)',
    name: 'packagingNotes',
  },
});


export const Default = meta.story({
  play: async ({
    canvasElement,
  }) => {
    const canvas = within(canvasElement);
    const user = userEvent.setup();
    const input = canvas.getByLabelText('Packaging notes (optional)');

    await expect(input).toHaveValue('Fragile');

    await user.clear(input);
    await user.type(input, 'Keep dry');

    await expect(input).toHaveValue('Keep dry');
  },
});

export const WithCharacterCounter = meta.story({
  args: { maxCharacters: 300, rows: 4 },
  play: async ({
    canvasElement,
  }) => {
    const canvas = within(canvasElement);

    await expect(
      canvas.getByText('7 of 300 characters used'),
    ).toBeInTheDocument();
  },
});

export const Summary = meta.story({
  args: { isSummary: true },
  play: async ({
    canvasElement,
  }) => {
    const canvas = within(canvasElement);

    await expect(canvas.getByText('Fragile')).toBeInTheDocument();
    await expect(canvas.queryByRole('textbox')).not.toBeInTheDocument();
  },
});
