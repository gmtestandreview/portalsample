import { render, screen, waitFor } from '@testing-library/react';

import userEvent from '@testing-library/user-event';

import { Form, Formik, useFormikContext } from 'formik';

import type { FormikConfig, FormikValues } from 'formik';

import { describe, expect, it, vi } from 'vitest';

import type { AttachmentDto } from '@/api/web-api-client';

import AttachmentItemNew from '@/components/Inputs/Attachment/AttachmentItem-new';

interface FormikHarnessProps<TValues extends FormikValues> {
  readonly children: React.ReactNode;
  readonly initialValues: TValues;
  readonly initialTouched?: FormikConfig<TValues>['initialTouched'];
  readonly onSubmit?: FormikConfig<TValues>['onSubmit'];
}

const attachment = {
  id: 'doc-1',
  attachmentName: 'manual.pdf',
  attachmentSize: '2048',
  attachmentCategory: '',
  documentBytes: 'JVBERi0xLjQ=',
} satisfies AttachmentDto;

function FormikHarness<TValues extends FormikValues>({
  children,
  initialValues,
  initialTouched,
  onSubmit = async () => {},
}: FormikHarnessProps<TValues>) {
  return (
    <Formik
      initialValues={initialValues}
      {...(initialTouched === undefined ? {} : { initialTouched })}
      onSubmit={onSubmit}
    >
      <Form>{children}</Form>
    </Formik>
  );
}

function ValuesProbe() {
  const { values, touched } = useFormikContext<Record<string, unknown>>();
  return (
    <>
      <pre data-testid='values'>{JSON.stringify(values)}</pre>
      <pre data-testid='touched'>{JSON.stringify(touched)}</pre>
    </>
  );
}

const renderItem = (
  props: Partial<React.ComponentProps<typeof AttachmentItemNew>> = {},
  initialTouched?: FormikConfig<{
    attachments: AttachmentDto[];
  }>['initialTouched'],
  initialAttachment: AttachmentDto = attachment,
  includeDocumentId = true,
) =>
  render(
    <FormikHarness
      initialValues={{ attachments: [initialAttachment] }}
      initialTouched={initialTouched}
    >
      <AttachmentItemNew
        name='attachments'
        index={0}
        canRemove
        cancelButtonId='cancel-button-doc-1'
        isSummary={false}
        {...(includeDocumentId ? { id: 'doc-1' } : {})}
        fileBytes={initialAttachment.documentBytes}
        {...props}
      />
      <ValuesProbe />
    </FormikHarness>,
  );

describe(AttachmentItemNew, () => {
  it('renders the file link, file size, category options, and validation message', () => {
    expect.assertions(1);
    renderItem({}, { attachments: [{ attachmentCategory: true }] });
    const fileLink = screen.getByRole('link', { name: 'manual.pdf' });
    expect(fileLink).toHaveAttribute('download', 'manual.pdf');
  });
});

describe(AttachmentItemNew, () => {
  it('renders the file link, file size, category options, and validation message', () => {
    expect.assertions(1);
    renderItem({}, { attachments: [{ attachmentCategory: true }] });
    const fileLink = screen.getByRole('link', { name: 'manual.pdf' });
    expect(fileLink.getAttribute('href')).toMatch(/^blob:/);
  });
});

describe(AttachmentItemNew, () => {
  it('renders the file link, file size, category options, and validation message', () => {
    expect.assertions(1);
    renderItem({}, { attachments: [{ attachmentCategory: true }] });
    const fileLink = screen.getByRole('link', { name: 'manual.pdf' });
    expect(screen.getByText('2 kb')).toBeInTheDocument();
  });
});

describe(AttachmentItemNew, () => {
  it('renders the file link, file size, category options, and validation message', () => {
    expect.assertions(1);
    renderItem({}, { attachments: [{ attachmentCategory: true }] });
    const fileLink = screen.getByRole('link', { name: 'manual.pdf' });
    expect(screen.getByRole('combobox', { name: 'Category' })).toHaveClass(
      'is-invalid',
    );
  });
});

describe(AttachmentItemNew, () => {
  it('renders the file link, file size, category options, and validation message', () => {
    expect.assertions(1);
    renderItem({}, { attachments: [{ attachmentCategory: true }] });
    const fileLink = screen.getByRole('link', { name: 'manual.pdf' });
    expect(
      screen.getByText('Select a category that best describes this document.'),
    ).toBeInTheDocument();
  });
});
