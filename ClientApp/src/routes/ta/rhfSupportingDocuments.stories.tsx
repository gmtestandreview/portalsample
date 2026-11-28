import preview from '../../../../.storybook/preview';
import { within, expect, fn } from 'storybook/test';
import { withPortalProviders } from '../../storybook/storybookHarness';
import RhfSupportingDocuments from './rhfSupportingDocuments';

/**
 * `RhfSupportingDocuments` is the document-upload step of the type-approval wizard. It
 * wraps the `RhfAttachment` multi-file control with the application's upload/delete
 * behaviour and validation messaging. It is bound to the form documents array named
 * by `name`; the story provides that context plus stub upload callbacks.
 */
const meta = preview.meta({
  title: 'Routes/TypeApproval/SupportingDocuments',
  component: RhfSupportingDocuments,
  decorators: [withPortalProviders],
  parameters: {
    layout: 'fullscreen',
    portal: {
      authenticated: true,
      initialEntries: ['/ta/PA-1/supporting-documents'],
      rhf: {
        defaultValues: {
          supportingDocuments: { form: { documents: [] } },
        },
      },
    },
  },
  args: {
    name: 'supportingDocuments.form.documents',
    isSummary: false,
    attachment: { onUploadFiles: fn(() => Promise.resolve([])) },
    onUploadAttachment: fn(() => Promise.resolve([])),
  },
});

export const EditStep = meta.story({
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(
      canvas.getByRole('heading', {
        name: 'Upload one or more supporting documents',
      }),
    ).toBeVisible();
  },
});
