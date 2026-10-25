import { act, render, screen, waitFor } from '@testing-library/react';

import userEvent from '@testing-library/user-event';

import { Form, Formik } from 'formik';

import type { FormikConfig, FormikValues } from 'formik';

import { describe, expect, it, vi } from 'vitest';

import type { AttachmentDto } from '@/api/web-api-client';

import AttachmentNew from '@/components/Inputs/Attachment/index-new';

/**
 * Direct tests for the attachment control.
 *
 * supportingDocuments is its only consumer and its route tests replace this component with a stub,
 * so the edge cases below - a field that is not a list, and an upload that outlives the component -
 * have no other way in.
 */

interface HarnessProps<TValues extends FormikValues> {
  readonly children: React.ReactNode;
  readonly initialValues: TValues;
  /**
   * Loosely typed on purpose. Formik types touched/errors for an array field as a per-element
   * array, but `meta.touched` for the field itself is read with getIn, so the control sees the
   * plain flag a real form sets. Threading the exact generic here would only make the harness
   * describe Formik's types rather than the control's behaviour.
   */
  readonly initialTouched?: Record<string, unknown>;
  readonly initialErrors?: Record<string, unknown>;
}

function Harness<TValues extends FormikValues>({
  children,
  initialValues,
  initialTouched,
  initialErrors,
}: HarnessProps<TValues>) {
  return (
    <Formik
      initialValues={initialValues}
      {...(initialTouched === undefined
        ? {}
        : {
            initialTouched: initialTouched as NonNullable<
              FormikConfig<TValues>['initialTouched']
            >,
          })}
      {...(initialErrors === undefined
        ? {}
        : {
            initialErrors: initialErrors as NonNullable<
              FormikConfig<TValues>['initialErrors']
            >,
          })}
      onSubmit={async () => {}}
    >
      <Form>{children}</Form>
    </Formik>
  );
}

const uploaded: AttachmentDto = {
  id: 'doc-1',
  attachmentName: 'manual.pdf',
  attachmentSize: '2048',
  attachmentCategory: '',
  documentBytes: 'JVBERi0xLjQ=',
} as AttachmentDto;

const baseProps = {
  name: 'files',
  maxFiles: 3,
  allowedTypes: '.pdf',
  maxSizeInMB: 5,
  setErrors: vi.fn(),
  onDeleteFile: vi.fn(async () => {}),
};

describe(AttachmentNew, () => {
  it('treats a field holding a single object as empty rather than throwing', () => {
    expect.assertions(2);
    // The field is typed `AttachmentDto[] | AttachmentDto | null`, so a form is free to hand
    // over a bare object. AttachmentItemNew addresses its field as `name[index]`, which reads
    // undefined against an object - so the control normalises to a list before rendering.
    render(
      <Harness initialValues={{ files: uploaded }}>
        <AttachmentNew
          {...baseProps}
          onUploadFiles={vi.fn(async () => [uploaded])}
        />
      </Harness>,
    );

    expect(screen.queryByText('manual.pdf')).not.toBeInTheDocument();
    expect(screen.getByTestId('files')).toBeInTheDocument();
  });
});

describe(AttachmentNew, () => {
  it('points the browse button at the validation message once the field is touched and invalid', () => {
    expect.assertions(1);
    render(
      <Harness
        initialValues={{ files: [] as AttachmentDto[] }}
        initialTouched={{ files: true }}
        initialErrors={{ files: 'Attach at least one document' }}
      >
        <AttachmentNew
          {...baseProps}
          onUploadFiles={vi.fn(async () => [uploaded])}
        />
      </Harness>,
    );

    // Untouched the button describes itself with the inline help; once touched and invalid it
    // has to point at the error instead, or a screen reader announces guidance where there is
    // a blocking message.
    expect(screen.getByTestId('files')).toHaveAttribute(
      'aria-describedby',
      'files-validation-msg',
    );
  });
});

describe(AttachmentNew, () => {
  it('describes the browse button with the inline help while the field is untouched', () => {
    expect.assertions(1);
    render(
      <Harness initialValues={{ files: [] as AttachmentDto[] }}>
        <AttachmentNew
          {...baseProps}
          inlineHelp='PDF only, 5MB each'
          onUploadFiles={vi.fn(async () => [uploaded])}
        />
      </Harness>,
    );

    expect(screen.getByTestId('files')).toHaveAttribute(
      'aria-describedby',
      'help-files',
    );
  });
});
