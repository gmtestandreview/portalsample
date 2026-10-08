import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useEffect, useState } from 'react';
import { FormProvider, useForm, useFormContext } from 'react-hook-form';
import type { Resolver, UseFormReturn } from 'react-hook-form';
import { describe, expect, it, vi } from 'vitest';
import type { AttachmentDto } from '@/api/web-api-client';
import AttachmentNew from '@/components/Inputs/RhfAttachment';
import { FileStatus } from '@/routes/ta/types';

interface AttachmentHarnessProps {
  readonly initialAttachmentValue: AttachmentDto[] | AttachmentDto | null;
  readonly props?: Partial<React.ComponentProps<typeof AttachmentNew>>;
  readonly useComponentDefaults?: boolean;
  readonly resolver?: Resolver<Record<string, unknown>>;
}

const uploadedAttachment = {
  id: 'doc-1',
  attachmentName: 'manual.pdf',
  attachmentSize: '2048',
  attachmentCategory: 'Manuals',
  documentLocked: false,
  documentBytes: 'JVBERi0xLjQ=',
} satisfies AttachmentDto;

let formMethods: UseFormReturn<Record<string, unknown>> | undefined;

function FormHarness({
  children,
  initialValues,
  resolver,
}: {
  readonly children: React.ReactNode;
  readonly initialValues: Record<string, unknown>;
  readonly resolver?: Resolver<Record<string, unknown>>;
}) {
  // `values` re-syncs on rerender, like Formik's enableReinitialize.
  const methods = useForm<Record<string, unknown>>({
    values: initialValues,
    ...(resolver === undefined ? {} : { resolver }),
  });
  useEffect(() => {
    formMethods = methods;
  });
  return <FormProvider {...methods}>{children}</FormProvider>;
}

function ValuesProbe() {
  const { watch } = useFormContext<Record<string, unknown>>();
  return <pre data-testid='values'>{JSON.stringify(watch())}</pre>;
}

function ErrorProbe({ errors }: { readonly errors: string[] }) {
  return (
    <ul aria-label='upload errors'>
      {errors.map((error) => (
        <li key={error}>{error}</li>
      ))}
    </ul>
  );
}

function AttachmentHarness({
  initialAttachmentValue,
  props = {},
  useComponentDefaults = false,
  resolver,
}: AttachmentHarnessProps) {
  const [errors, setErrors] = useState<string[]>([]);

  return (
    <FormHarness
      initialValues={{ attachments: initialAttachmentValue }}
      {...(resolver === undefined ? {} : { resolver })}
    >
      <AttachmentNew
        name='attachments'
        {...(useComponentDefaults ? {} : { id: 'supporting-documents' })}
        label='Supporting documents'
        ariaLabel='Upload supporting documents'
        {...(useComponentDefaults ? {} : { buttonTitle: 'Browse files' })}
        inlineHelp='Upload files for assessment'
        allowMultiple
        maxFiles={3}
        maxSizeInMB={1}
        allowedTypes='.pdf, .jpg'
        onUploadFiles={async () => [uploadedAttachment]}
        onDeleteFile={async () => {}}
        setErrors={setErrors}
        {...props}
      />
      <ErrorProbe errors={errors} />
      <ValuesProbe />
    </FormHarness>
  );
}

const file = (name: string, size: number, type = 'application/pdf') =>
  new File(['x'.repeat(size)], name, { type });

const changeFileInput = (files: File[]) => {
  fireEvent.change(screen.getByTestId('drag-upload-supporting-documents'), {
    target: {
      files,
    },
  });
};

const renderAttachment = (
  initialAttachmentValue: AttachmentHarnessProps['initialAttachmentValue'],
  props?: AttachmentHarnessProps['props'],
  useComponentDefaults = false
) =>
  render(
    <AttachmentHarness
      initialAttachmentValue={initialAttachmentValue}
      {...(props === undefined ? {} : { props })}
      useComponentDefaults={useComponentDefaults}
    />
  );

describe('RhfAttachment', () => {
  it('renders upload controls with help text, disabled state, and file constraints', () => {
    renderAttachment([], {
      className: 'drop-target',
      containerClassName: 'attachment-container',
      disableUpload: true,
    });

    expect(
      screen.getByLabelText('Upload supporting documents')
    ).toBeInTheDocument();
    expect(screen.getByText('Upload files for assessment')).toHaveAttribute(
      'id',
      'help-supporting-documents'
    );
    expect(
      screen.getByTestId('drag-upload-supporting-documents')
    ).toBeDisabled();
    expect(screen.getByTestId('supporting-documents')).toBeDisabled();
    expect(screen.getByText('.pdf, .jpg')).toBeInTheDocument();
    expect(
      screen.getByText(
        (_, element) =>
          element?.textContent === 'Maximum size for each file: 1MB each'
      )
    ).toBeInTheDocument();
  });

  it('uses default upload button labels and forwards browse clicks to the file input', async () => {
    const user = userEvent.setup();
    const inputClick = vi.spyOn(HTMLInputElement.prototype, 'click');
    renderAttachment([], undefined, true);

    expect(screen.getByTestId('drag-upload-attachments')).toHaveAttribute(
      'title',
      'Drag files here'
    );

    await user.click(screen.getByTestId('attachments'));

    expect(inputClick).toHaveBeenCalled();
    inputClick.mockRestore();
  });

  it('prevents default browser handling when the file label is clicked', () => {
    renderAttachment([]);
    const clickEvent = new MouseEvent('click', {
      bubbles: true,
      cancelable: true,
    });
    const preventDefault = vi.spyOn(clickEvent, 'preventDefault');

    screen
      .getByLabelText('Upload supporting documents')
      .dispatchEvent(clickEvent);

    expect(preventDefault).toHaveBeenCalled();
  });

  it('ignores a change event that carries no file list', () => {
    const onUploadFiles = vi.fn();
    renderAttachment([], { onUploadFiles });
    const input = screen.getByTestId('drag-upload-supporting-documents');

    Object.defineProperty(input, 'files', {
      configurable: true,
      get: () => null,
    });
    fireEvent.change(input);

    expect(onUploadFiles).not.toHaveBeenCalled();
    expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
  });

  it('renders summary attachments or a no-details fallback', () => {
    const { rerender } = renderAttachment([], { isSummary: true });

    expect(screen.getByText('No details added')).toBeInTheDocument();

    rerender(
      <AttachmentHarness
        initialAttachmentValue={[uploadedAttachment]}
        props={{ isSummary: true }}
      />
    );

    expect(
      screen.getByRole('link', { name: 'manual.pdf' })
    ).toBeInTheDocument();
    expect(screen.queryByText('No details added')).not.toBeInTheDocument();
  });

  it('reports invalid extensions and too many selected files without uploading', async () => {
    const onUploadFiles = vi.fn().mockResolvedValue([uploadedAttachment]);
    renderAttachment([], {
      maxFiles: 1,
      onUploadFiles,
    });

    changeFileInput([
      file('manual.pdf', 10),
      file('diagram.gif', 10, 'image/gif'),
    ]);

    expect(onUploadFiles).not.toHaveBeenCalled();
    expect(
      screen.getByText('Files must be one of the following types: .pdf, .jpg')
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        'The files selected have not been uploaded as you have selected more files than the maximum number allowed - (1).'
      )
    ).toBeInTheDocument();
  });

  it('reports a missing extension with singular file and allowed-type wording', () => {
    const onUploadFiles = vi.fn().mockResolvedValue([uploadedAttachment]);
    renderAttachment([], {
      allowedTypes: '.pdf',
      onUploadFiles,
    });

    changeFileInput([file('manual', 10)]);

    expect(onUploadFiles).not.toHaveBeenCalled();
    expect(
      screen.getByText('File must be of the following type: .pdf')
    ).toBeInTheDocument();
  });

  it('reports a single oversized file without uploading it', async () => {
    const user = userEvent.setup();
    const onUploadFiles = vi.fn().mockResolvedValue(uploadedAttachment);
    renderAttachment(null, {
      allowMultiple: false,
      allowedTypes: '.pdf',
      maxSizeInMB: 1,
      onUploadFiles,
    });

    await user.upload(
      screen.getByTestId('drag-upload-supporting-documents'),
      file('large.pdf', 1024 * 1024 + 1)
    );

    expect(onUploadFiles).not.toHaveBeenCalled();
    expect(
      screen.getByText('Upload failed: large.pdf exceeds the 1 mb limit.')
    ).toBeInTheDocument();
  });

  it('uploads one valid file into the attachment list', async () => {
    const user = userEvent.setup();
    const onUploadFiles = vi.fn().mockResolvedValue([uploadedAttachment]);
    renderAttachment([], { onUploadFiles });

    await user.upload(
      screen.getByTestId('drag-upload-supporting-documents'),
      file('manual.pdf', 10)
    );

    await waitFor(() =>
      expect(onUploadFiles).toHaveBeenCalledWith([
        expect.objectContaining({ name: 'manual.pdf' }),
      ])
    );
    await waitFor(() =>
      expect(screen.getByTestId('values')).toHaveTextContent(
        '"attachments":[{"id":"doc-1"'
      )
    );
  });

  it('uploads multiple valid files and replaces the attachment list with the server result', async () => {
    const user = userEvent.setup();
    const result = [
      {
        ...uploadedAttachment,
        id: 'doc-2',
        attachmentName: 'diagram.jpg',
      },
    ] satisfies AttachmentDto[];
    const onUploadFiles = vi.fn().mockResolvedValue(result);
    renderAttachment([uploadedAttachment], {
      onUploadFiles,
    });

    await user.upload(screen.getByTestId('drag-upload-supporting-documents'), [
      file('manual.pdf', 10),
      file('diagram.jpg', 10, 'image/jpeg'),
    ]);

    await waitFor(() =>
      expect(onUploadFiles).toHaveBeenCalledWith([
        expect.objectContaining({ name: 'manual.pdf' }),
        expect.objectContaining({ name: 'diagram.jpg' }),
      ])
    );
    await waitFor(() =>
      expect(screen.getByTestId('values')).toHaveTextContent(
        '"attachmentName":"diagram.jpg"'
      )
    );
    expect(screen.getByTestId('values')).not.toHaveTextContent(
      '"attachmentName":"manual.pdf"'
    );
  });

  it('reports oversized files in a batch and uploads the files within the size limit', async () => {
    const result = [
      {
        ...uploadedAttachment,
        id: 'doc-3',
        attachmentName: 'small.pdf',
      },
    ] satisfies AttachmentDto[];
    const onUploadFiles = vi.fn().mockResolvedValue(result);
    renderAttachment([], { onUploadFiles });

    changeFileInput([
      file('large.pdf', 1024 * 1024 + 1),
      file('small.pdf', 10),
    ]);

    await waitFor(() =>
      expect(onUploadFiles).toHaveBeenCalledWith([
        expect.objectContaining({ name: 'small.pdf' }),
      ])
    );
    expect(
      screen.getByText('Upload failed: large.pdf exceeds the 1 mb limit.')
    ).toBeInTheDocument();
    await waitFor(() =>
      expect(screen.getByTestId('values')).toHaveTextContent(
        '"attachmentName":"small.pdf"'
      )
    );
  });

  it('stores a single-file upload as a one-item list while progress is still running', async () => {
    // Single-file mode used to store a lone object here, which AttachmentItemNew could not read
    // because it addresses its field as `name[index]`. The field is always a list now.
    const user = userEvent.setup();
    const onUploadFiles = vi.fn().mockResolvedValue([uploadedAttachment]);
    renderAttachment(null, {
      allowMultiple: false,
      onUploadFiles,
      progress: {
        status: 'Uploading',
        percent: 0,
        completedFiles: 0,
        totalFiles: 1,
        files: [],
      },
    });

    await user.upload(
      screen.getByTestId('drag-upload-supporting-documents'),
      file('manual.pdf', 10)
    );

    await waitFor(() =>
      expect(screen.getByTestId('values')).toHaveTextContent(
        '"attachments":[{"id":"doc-1"'
      )
    );
    expect(
      screen.getByRole('progressbar', { name: 'Uploading' })
    ).toBeInTheDocument();
  });

  it('points the control at its validation message once the form is submitted', async () => {
    // Until the form is submitted the control is described by its help text; afterwards the
    // error takes over, so assistive tech announces the problem rather than the hint.
    render(
      <AttachmentHarness
        initialAttachmentValue={[]}
        resolver={async () => ({
          values: {},
          errors: {
            attachments: {
              type: 'validation',
              message: 'Upload at least one document',
            },
          },
        })}
      />
    );
    const button = screen.getByTestId('supporting-documents');
    expect(button).toHaveAttribute(
      'aria-describedby',
      'help-supporting-documents'
    );

    await act(async () => {
      await formMethods?.handleSubmit(() => undefined)();
    });

    expect(button).toHaveAttribute(
      'aria-describedby',
      'supporting-documents-validation-msg'
    );
  });

  it('shows the missing-category message on every row after a submit attempt', async () => {
    renderAttachment([{ ...uploadedAttachment, attachmentCategory: '' }]);
    expect(
      screen.queryByText('Select a category that best describes this document.')
    ).not.toBeInTheDocument();

    await act(async () => {
      await formMethods?.handleSubmit(() => undefined)();
    });

    expect(
      screen.getByText('Select a category that best describes this document.')
    ).toBeInTheDocument();
  });

  it('keeps describing the control with its help text when the form is valid', async () => {
    renderAttachment([]);

    await act(async () => {
      await formMethods?.handleSubmit(() => undefined)();
    });

    expect(screen.getByTestId('supporting-documents')).toHaveAttribute(
      'aria-describedby',
      'help-supporting-documents'
    );
  });

  it('reports server validation errors from a failed upload', async () => {
    const user = userEvent.setup();
    const onUploadFiles = vi.fn().mockRejectedValue({
      errors: {
        first: 'Virus scan failed',
        second: 'Document could not be stored',
      },
    });
    renderAttachment([], { onUploadFiles });

    await user.upload(
      screen.getByTestId('drag-upload-supporting-documents'),
      file('manual.pdf', 10)
    );

    expect(await screen.findByText('Virus scan failed')).toBeInTheDocument();
    expect(
      screen.getByText('Document could not be stored')
    ).toBeInTheDocument();
  });

  it('renders active upload progress with cancellable file rows', async () => {
    const user = userEvent.setup();
    const handleCancelFile = vi.fn().mockResolvedValue(undefined);
    renderAttachment([], {
      handleCancelFile,
      progress: {
        status: 'Uploading',
        percent: 25,
        completedFiles: 1,
        totalFiles: 4,
        files: [
          {
            fileName: 'manual.pdf',
            status: FileStatus.Uploading,
            bytesUploaded: 100,
            totalBytes: 400,
          },
        ],
      },
    });

    expect(
      screen.getByRole('progressbar', { name: 'Uploading' })
    ).toHaveAttribute('aria-valuenow', '25');
    expect(screen.getByText('1 / 4 files processed')).toBeInTheDocument();

    await user.click(
      screen.getByRole('button', { name: 'Cancel uploading manual.pdf' })
    );

    expect(handleCancelFile).toHaveBeenCalledWith('manual.pdf');
    expect(screen.getByText('Cancelling...')).toBeInTheDocument();
  });

  it('shows uploaded attachments once progress is complete', () => {
    renderAttachment([uploadedAttachment], {
      progress: {
        status: 'Completed',
        percent: 100,
        completedFiles: 1,
        totalFiles: 1,
        files: [],
      },
    });

    expect(
      screen.queryByRole('progressbar', { name: 'Completed' })
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: '1 files uploaded' })
    ).toBeInTheDocument();
    expect(
      screen.getByText('Select a category to classify each document')
    ).toBeInTheDocument();
  });

  it('deletes an existing attachment and removes it from the field value', async () => {
    const user = userEvent.setup();
    const onDeleteFile = vi.fn().mockResolvedValue(undefined);
    renderAttachment([uploadedAttachment], { onDeleteFile });

    await user.click(screen.getByRole('button', { name: /^Delete / }));
    await user.click(screen.getByRole('button', { name: 'Yes, delete' }));

    expect(onDeleteFile).toHaveBeenCalledWith('doc-1');
    await waitFor(() =>
      expect(screen.getByTestId('values')).toHaveTextContent('"attachments":[]')
    );
  });

  it('does not call delete when the selected attachment has no id', async () => {
    const consoleError = vi.spyOn(console, 'error');
    try {
      const user = userEvent.setup();
      const onDeleteFile = vi.fn().mockResolvedValue(undefined);
      renderAttachment(
        [
          {
            ...uploadedAttachment,
            id: undefined,
          },
        ],
        { onDeleteFile }
      );

      await user.click(screen.getByRole('button', { name: /^Delete / }));
      await user.click(screen.getByRole('button', { name: 'Yes, delete' }));

      expect(onDeleteFile).not.toHaveBeenCalled();
      expect(screen.getByTestId('values')).toHaveTextContent(
        '"attachmentName":"manual.pdf"'
      );
      expect(consoleError).not.toHaveBeenCalled();
    } finally {
      consoleError.mockRestore();
    }
  });

  it('reports delete failures without removing the attachment', async () => {
    const user = userEvent.setup();
    const onDeleteFile = vi.fn().mockRejectedValue('Delete failed');
    renderAttachment([uploadedAttachment], { onDeleteFile });

    await user.click(screen.getByRole('button', { name: /^Delete / }));
    await user.click(screen.getByRole('button', { name: 'Yes, delete' }));

    expect(await screen.findByText('Delete failed')).toBeInTheDocument();
    expect(screen.getByTestId('values')).toHaveTextContent(
      '"attachmentName":"manual.pdf"'
    );
  });

  it('keeps a locked attachment in summary mode without delete controls', () => {
    renderAttachment([
      {
        ...uploadedAttachment,
        documentLocked: true,
      },
    ]);

    const attachmentRegion = screen
      .getByText('manual.pdf')
      .closest('.attachment');
    expect(attachmentRegion).not.toBeNull();
    expect(
      within(attachmentRegion as HTMLElement).queryByRole('button', {
        name: /^Delete /,
      })
    ).not.toBeInTheDocument();
  });

  it('shows uploaded attachments when progress completed with errors', () => {
    renderAttachment([uploadedAttachment], {
      progress: {
        status: 'CompletedWithErrors',
        percent: 100,
        completedFiles: 1,
        totalFiles: 2,
        files: [],
      },
    });

    expect(
      screen.queryByRole('progressbar', { name: 'CompletedWithErrors' })
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: '1 files uploaded' })
    ).toBeInTheDocument();
  });

  it('treats a field holding a single object as empty rather than throwing', () => {
    // A form is free to hand over a bare object; the item addresses its field as
    // `name.index.attachmentCategory`, so the control normalises to a list first.
    renderAttachment(uploadedAttachment);

    expect(screen.queryByText('manual.pdf')).not.toBeInTheDocument();
    expect(screen.getByTestId('supporting-documents')).toBeInTheDocument();
  });

  it('survives an upload that finishes after the control has gone', async () => {
    let finishUpload: (value: AttachmentDto[]) => void = () => {};
    const onUploadFiles = vi.fn(
      () =>
        new Promise<AttachmentDto[]>((resolve) => {
          finishUpload = resolve;
        })
    );
    const { unmount } = renderAttachment([], { onUploadFiles });

    await userEvent.upload(
      screen.getByTestId('drag-upload-supporting-documents'),
      file('manual.pdf', 10)
    );
    await waitFor(() => expect(onUploadFiles).toHaveBeenCalledTimes(1));

    // The post-upload reset of the file input has nothing to write to once the ref detaches.
    unmount();
    await act(async () => {
      finishUpload([uploadedAttachment]);
    });

    expect(onUploadFiles).toHaveBeenCalledTimes(1);
  });

  it('survives a delete that finishes after the control has gone', async () => {
    let finishDelete: () => void = () => {};
    const onDeleteFile = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          finishDelete = resolve;
        })
    );
    const { unmount } = renderAttachment([uploadedAttachment], {
      onDeleteFile,
    });

    await userEvent.click(screen.getByTestId('cancel-button-doc-1'));
    await userEvent.click(screen.getByRole('button', { name: 'Yes, delete' }));
    await waitFor(() => expect(onDeleteFile).toHaveBeenCalledWith('doc-1'));

    unmount();
    await act(async () => {
      finishDelete();
    });

    expect(onDeleteFile).toHaveBeenCalledTimes(1);
  });

  it('keeps the remaining category when an earlier attachment is deleted', async () => {
    const user = userEvent.setup();
    const second = {
      ...uploadedAttachment,
      id: 'doc-2',
      attachmentName: 'second.pdf',
      attachmentCategory: 'Certificate',
    } satisfies AttachmentDto;
    renderAttachment([uploadedAttachment, second]);

    await user.click(screen.getByTestId('cancel-button-doc-1'));
    await user.click(screen.getByRole('button', { name: 'Yes, delete' }));

    await waitFor(() =>
      expect(screen.queryByText('manual.pdf')).not.toBeInTheDocument()
    );
    expect(screen.getByRole('combobox', { name: 'Category' })).toHaveValue(
      'Certificate'
    );
  });
});
