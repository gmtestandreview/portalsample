import { act, render, screen, waitFor } from '@testing-library/react';

import userEvent from '@testing-library/user-event';

import { FormProvider, useForm, useFormContext } from 'react-hook-form';

import type { UseFormReturn } from 'react-hook-form';

import { describe, expect, it, vi } from 'vitest';

import type { AttachmentDto } from '@/api/web-api-client';

import RhfAttachmentItem from '@/components/Inputs/RhfAttachment/RhfAttachmentItem';

const attachment = {
  id: 'doc-1',
  attachmentName: 'manual.pdf',
  attachmentSize: '2048',
  attachmentCategory: '',
  documentBytes: 'JVBERi0xLjQ=',
} satisfies AttachmentDto;

const methodsRef: {
  current: UseFormReturn<Record<string, unknown>> | undefined;
} = { current: undefined };

interface Deferred {
  readonly promise: Promise<void>;
  readonly resolve: () => void;
  readonly reject: () => void;
}

const deferred = (): Deferred => {
  let resolve = () => {};
  let reject = () => {};
  const promise = new Promise<void>((res, rej) => {
    resolve = res;
    reject = () => rej(new Error('save failed'));
  });
  return { promise, resolve, reject };
};

function FormHarness({
  children,
  initialValues,
}: {
  readonly children: React.ReactNode;
  readonly initialValues: Record<string, unknown>;
}) {
  const methods = useForm<Record<string, unknown>>({
    defaultValues: initialValues,
  });
  methodsRef.current = methods;
  return <FormProvider {...methods}>{children}</FormProvider>;
}

function ValuesProbe() {
  const {
    watch,
    formState: { touchedFields },
  } = useFormContext<Record<string, unknown>>();
  return (
    <>
      <pre data-testid='values'>{JSON.stringify(watch())}</pre>
      <pre data-testid='touched'>{JSON.stringify(touchedFields)}</pre>
    </>
  );
}

const renderItem = (
  props: Partial<React.ComponentProps<typeof RhfAttachmentItem>> = {},
  initialAttachment: AttachmentDto = attachment,
) =>
  render(
    <FormHarness initialValues={{ attachments: [initialAttachment] }}>
      <RhfAttachmentItem
        attachment={initialAttachment}
        name='attachments'
        index={0}
        canRemove
        cancelButtonId='cancel-button-doc-1'
        isSummary={false}
        {...props}
      />
      <ValuesProbe />
    </FormHarness>,
  );

describe(RhfAttachmentItem, () => {
  it('renders the file link, file size, category options, and validation message', async () => {
    expect.assertions(1);
    const user = userEvent.setup();
    renderItem();
    await user.click(screen.getByRole('combobox', { name: 'Category' }));
    await user.tab();
    const fileLink = screen.getByRole('link', { name: 'manual.pdf' });
    expect(fileLink).toHaveAttribute('download', 'manual.pdf');
  });
});

describe(RhfAttachmentItem, () => {
  it('renders the file link, file size, category options, and validation message', async () => {
    expect.assertions(1);
    const user = userEvent.setup();
    renderItem();
    await user.click(screen.getByRole('combobox', { name: 'Category' }));
    await user.tab();
    const fileLink = screen.getByRole('link', { name: 'manual.pdf' });
    expect(fileLink.getAttribute('href')).toMatch(/^blob:/);
  });
});

describe(RhfAttachmentItem, () => {
  it('renders the file link, file size, category options, and validation message', async () => {
    expect.assertions(1);
    const user = userEvent.setup();
    renderItem();
    await user.click(screen.getByRole('combobox', { name: 'Category' }));
    await user.tab();
    const fileLink = screen.getByRole('link', { name: 'manual.pdf' });
    expect(screen.getByText('2 kb')).toBeInTheDocument();
  });
});

describe(RhfAttachmentItem, () => {
  it('renders the file link, file size, category options, and validation message', async () => {
    expect.assertions(1);
    const user = userEvent.setup();
    renderItem();
    await user.click(screen.getByRole('combobox', { name: 'Category' }));
    await user.tab();
    const fileLink = screen.getByRole('link', { name: 'manual.pdf' });
    expect(screen.getByRole('combobox', { name: 'Category' })).toHaveClass(
      'is-invalid',
    );
  });
});

describe(RhfAttachmentItem, () => {
  it('renders the file link, file size, category options, and validation message', async () => {
    expect.assertions(1);
    const user = userEvent.setup();
    renderItem();
    await user.click(screen.getByRole('combobox', { name: 'Category' }));
    await user.tab();
    const fileLink = screen.getByRole('link', { name: 'manual.pdf' });
    expect(
      screen.getByText('Select a category that best describes this document.'),
    ).toBeInTheDocument();
  });
});
