import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';

import userEvent from '@testing-library/user-event';

import { Form, Formik, useFormikContext } from 'formik';

import type { FormikConfig, FormikValues } from 'formik';

import { useState } from 'react';

import { describe, expect, it, vi } from 'vitest';

import type { AttachmentDto } from '@/api/web-api-client';

import AttachmentNew from '@/components/Inputs/Attachment/index-new';

import { FileStatus } from '@/routes/ta/types';

interface FormikHarnessProps<TValues extends FormikValues> {
  readonly children: React.ReactNode;
  readonly initialValues: TValues;
  readonly initialErrors?: FormikConfig<TValues>['initialErrors'];
  readonly initialTouched?: FormikConfig<TValues>['initialTouched'];
  readonly onSubmit?: FormikConfig<TValues>['onSubmit'];
}

interface AttachmentHarnessProps {
  readonly initialAttachmentValue: AttachmentDto[] | AttachmentDto | null;
  readonly props?: Partial<React.ComponentProps<typeof AttachmentNew>>;
  readonly useComponentDefaults?: boolean;
}

const uploadedAttachment = {
  id: 'doc-1',
  attachmentName: 'manual.pdf',
  attachmentSize: '2048',
  attachmentCategory: 'Manuals',
  documentLocked: false,
  documentBytes: 'JVBERi0xLjQ=',
} satisfies AttachmentDto;

function FormikHarness<TValues extends FormikValues>({
  children,
  initialValues,
  initialErrors,
  initialTouched,
  onSubmit = async () => {},
}: FormikHarnessProps<TValues>) {
  return (
    <Formik
      enableReinitialize
      initialValues={initialValues}
      {...(initialErrors === undefined ? {} : { initialErrors })}
      {...(initialTouched === undefined ? {} : { initialTouched })}
      onSubmit={onSubmit}
    >
      <Form>{children}</Form>
    </Formik>
  );
}

function ValuesProbe() {
  const { values } = useFormikContext<Record<string, unknown>>();
  return <pre data-testid='values'>{JSON.stringify(values)}</pre>;
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
}: AttachmentHarnessProps) {
  const [errors, setErrors] = useState<string[]>([]);

  return (
    <FormikHarness initialValues={{ attachments: initialAttachmentValue }}>
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
    </FormikHarness>
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
  useComponentDefaults = false,
) =>
  render(
    <AttachmentHarness
      initialAttachmentValue={initialAttachmentValue}
      {...(props === undefined ? {} : { props })}
      useComponentDefaults={useComponentDefaults}
    />,
  );

describe(AttachmentNew, () => {
  it('renders upload controls with help text, disabled state, and file constraints', () => {
    expect.assertions(1);
    renderAttachment([], {
      className: 'drop-target',
      containerClassName: 'attachment-container',
      disableUpload: true,
    });
    expect(
      screen.getByLabelText('Upload supporting documents'),
    ).toBeInTheDocument();
  });
});

describe(AttachmentNew, () => {
  it('renders upload controls with help text, disabled state, and file constraints', () => {
    expect.assertions(1);
    renderAttachment([], {
      className: 'drop-target',
      containerClassName: 'attachment-container',
      disableUpload: true,
    });
    expect(screen.getByText('Upload files for assessment')).toHaveAttribute(
      'id',
      'help-supporting-documents',
    );
  });
});

describe(AttachmentNew, () => {
  it('renders upload controls with help text, disabled state, and file constraints', () => {
    expect.assertions(1);
    renderAttachment([], {
      className: 'drop-target',
      containerClassName: 'attachment-container',
      disableUpload: true,
    });
    expect(
      screen.getByTestId('drag-upload-supporting-documents'),
    ).toBeDisabled();
  });
});

describe(AttachmentNew, () => {
  it('renders upload controls with help text, disabled state, and file constraints', () => {
    expect.assertions(1);
    renderAttachment([], {
      className: 'drop-target',
      containerClassName: 'attachment-container',
      disableUpload: true,
    });
    expect(screen.getByTestId('supporting-documents')).toBeDisabled();
  });
});

describe(AttachmentNew, () => {
  it('renders upload controls with help text, disabled state, and file constraints', () => {
    expect.assertions(1);
    renderAttachment([], {
      className: 'drop-target',
      containerClassName: 'attachment-container',
      disableUpload: true,
    });
    expect(screen.getByText('.pdf, .jpg')).toBeInTheDocument();
  });
});
