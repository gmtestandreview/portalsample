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
  useComponentDefaults = false,
) =>
  render(
    <AttachmentHarness
      initialAttachmentValue={initialAttachmentValue}
      {...(props === undefined ? {} : { props })}
      useComponentDefaults={useComponentDefaults}
    />,
  );

describe('rhfAttachment', () => {
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

describe('rhfAttachment', () => {
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

describe('rhfAttachment', () => {
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

describe('rhfAttachment', () => {
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

describe('rhfAttachment', () => {
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
