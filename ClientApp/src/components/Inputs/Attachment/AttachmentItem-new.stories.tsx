import preview from '../../../../../.storybook/preview';
import { within, expect, fn } from 'storybook/test';
import { withPortalProviders } from '../../../storybook/storybookHarness';
import AttachmentItemNew from './AttachmentItem-new';

/**
 * `AttachmentItemNew` is the migration ("-new") variant of a single uploaded-document
 * row: it shows the file name (as a download link), its size, a category select, and a
 * delete control gated behind a confirmation modal. It reads its data from the Formik
 * array field `${name}[${index}]`, so the stories provide a matching Formik context.
 */
const meta = preview.meta({
  title: 'Components/Inputs/Attachment/AttachmentItemNew',
  component: AttachmentItemNew,
  decorators: [withPortalProviders],
  parameters: {
    layout: 'padded',
    portal: {
      formik: {
        initialValues: {
          documents: [
            {
              id: 'doc-1',
              attachmentName: 'calibration-certificate.pdf',
              attachmentSize: '524288',
              attachmentCategory: 'Certificate',
            },
          ],
        },
      },
    },
  },
  args: {
    id: 'doc-1',
    name: 'documents',
    index: 0,
    canRemove: true,
    cancelButtonId: 'cancel-button-doc-1',
    isSummary: false,
    onRemoveItem: fn(),
    onCategoryUpdate: fn(),
  },
});


export const Editable = meta.story({
  play: async ({
    canvasElement,
  }) => {
    const canvas = within(canvasElement);

    await expect(canvas.getByText('calibration-certificate.pdf')).toBeVisible();
    await expect(canvas.getByLabelText('Category')).toBeInTheDocument();
    await expect(canvas.getByRole('button', { name: /delete/i })).toBeVisible();
  },
});

export const ReadOnlySummary = meta.story({
  args: {
    canRemove: false,
    isSummary: true,
  },
  play: async ({
    canvasElement,
  }) => {
    const canvas = within(canvasElement);

    await expect(canvas.getByText('calibration-certificate.pdf')).toBeVisible();
    // No delete affordance in the read-only summary presentation.
    await expect(canvas.queryByRole('button', { name: /delete/i })).toBeNull();
  },
});
