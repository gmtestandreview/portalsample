import type { Meta, StoryObj } from '@storybook/react-vite';
import { within, expect, fn, userEvent } from 'storybook/test';
import type { AttachmentDto } from '../../../api/web-api-client';
import { withPortalProviders } from '../../../storybook/storybookHarness';
import RhfAttachment from '.';

/**
 * React Hook Form counterpart of `AttachmentNew`. It binds to an attachment
 * list field and must render inside a `FormProvider`; the portal harness
 * supplies one through the `portal.rhf` story parameter.
 */
const savedDocument: AttachmentDto = {
  id: 'doc-1',
  attachmentName: 'saved.pdf',
  attachmentSize: '12345',
  attachmentCategory: 'Certificate',
};

const meta = {
  title: 'Components/Inputs/Attachment/RhfAttachment',
  component: RhfAttachment,
  decorators: [withPortalProviders],
  parameters: {
    layout: 'padded',
    portal: {
      rhf: { defaultValues: { documents: [] } },
    },
  },
  args: {
    id: 'documents',
    name: 'documents',
    label: 'Drag and drop files here',
    ariaLabel: 'Upload supporting documents',
    buttonTitle: 'Browse files',
    allowMultiple: true,
    maxFiles: 5,
    allowedTypes: '.pdf,.jpg,.png',
    maxSizeInMB: 10,
    inlineHelp: 'Accepted formats: PDF, JPG, PNG.',
    setErrors: fn(),
    onUploadFiles: fn(async () => [savedDocument]),
    onDeleteFile: fn(async () => {}),
  },
} satisfies Meta<typeof RhfAttachment>;

export default meta;
type Story = StoryObj<typeof meta>;

export const EmptyUploader: Story = {
  play: async ({
    canvasElement,
  }: Readonly<Parameters<NonNullable<Story['play']>>[0]>) => {
    const canvas = within(canvasElement);

    await expect(canvas.getByText('Drag and drop files here')).toBeVisible();
    await expect(
      canvas.getByRole('button', { name: 'Browse files' })
    ).toBeEnabled();
  },
};

export const UploadsAFile: Story = {
  play: async ({
    canvasElement,
    args,
  }: Readonly<Parameters<NonNullable<Story['play']>>[0]>) => {
    const canvas = within(canvasElement);
    const file = new File(['pdf'], 'saved.pdf', { type: 'application/pdf' });

    await userEvent.upload(canvas.getByTestId('drag-upload-documents'), file);

    await expect(await canvas.findByText('saved.pdf')).toBeVisible();
    await expect(args.onUploadFiles).toHaveBeenCalledTimes(1);
    await expect(
      canvas.getByRole('combobox', { name: 'Category' })
    ).toHaveValue('Certificate');
  },
};

export const WithSavedDocument: Story = {
  parameters: {
    portal: {
      rhf: { defaultValues: { documents: [savedDocument] } },
    },
  },
  play: async ({
    canvasElement,
  }: Readonly<Parameters<NonNullable<Story['play']>>[0]>) => {
    const canvas = within(canvasElement);

    await expect(canvas.getByText('saved.pdf')).toBeVisible();
    await expect(
      canvas.getByRole('heading', { name: '1 files uploaded' })
    ).toBeVisible();
  },
};

export const Summary: Story = {
  args: { isSummary: true },
  parameters: {
    portal: {
      rhf: { defaultValues: { documents: [savedDocument] } },
    },
  },
  play: async ({
    canvasElement,
  }: Readonly<Parameters<NonNullable<Story['play']>>[0]>) => {
    const canvas = within(canvasElement);

    await expect(canvas.getByText('saved.pdf')).toBeVisible();
    await expect(
      canvas.queryByRole('button', { name: 'Browse files' })
    ).not.toBeInTheDocument();
  },
};
