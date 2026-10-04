import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FormProvider, useForm, useFormContext } from 'react-hook-form';
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
  initialAttachment: AttachmentDto = attachment
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
    </FormHarness>
  );

describe('RhfAttachmentItem', () => {
  it('renders the file link, file size, category options, and validation message', async () => {
    const user = userEvent.setup();
    renderItem();
    await user.click(screen.getByRole('combobox', { name: 'Category' }));
    await user.tab();

    const fileLink = screen.getByRole('link', { name: 'manual.pdf' });
    expect(fileLink).toHaveAttribute('download', 'manual.pdf');
    expect(fileLink.getAttribute('href')).toMatch(/^blob:/);
    expect(screen.getByText('2 kb')).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: 'Category' })).toHaveClass(
      'is-invalid'
    );
    expect(
      screen.getByText('Select a category that best describes this document.')
    ).toBeInTheDocument();
    expect(
      screen.getByRole('option', { name: 'Photos or diagrams' })
    ).toHaveValue('Photos or diagrams');
  });

  it('updates the category field and calls the persisted-category callback when a document id is present', async () => {
    const user = userEvent.setup();
    const onCategoryUpdate = vi.fn().mockResolvedValue(undefined);
    renderItem({ onCategoryUpdate });

    await user.selectOptions(
      screen.getByRole('combobox', { name: 'Category' }),
      'Certificate'
    );

    expect(onCategoryUpdate).toHaveBeenCalledWith('doc-1', 'Certificate');
    await waitFor(() =>
      expect(screen.getByTestId('values')).toHaveTextContent(
        '"attachmentCategory":"Certificate"'
      )
    );
    await waitFor(() =>
      expect(screen.getByTestId('touched')).toHaveTextContent(
        '"attachmentCategory":true'
      )
    );
  });

  it('updates the category locally when no persisted document id is available', async () => {
    const user = userEvent.setup();
    const onCategoryUpdate = vi.fn().mockResolvedValue(undefined);
    const withoutId: AttachmentDto = {
      ...attachment,
      attachmentSize: undefined,
    };
    delete withoutId.id;
    renderItem({ onCategoryUpdate }, withoutId);

    await user.selectOptions(
      screen.getByRole('combobox', { name: 'Category' }),
      'Manuals'
    );

    expect(onCategoryUpdate).not.toHaveBeenCalled();
    expect(screen.queryByText('2 kb')).not.toBeInTheDocument();
    await waitFor(() =>
      expect(screen.getByTestId('values')).toHaveTextContent(
        '"attachmentCategory":"Manuals"'
      )
    );
  });

  it('does not render removal controls in summary mode and tolerates missing file bytes', () => {
    renderItem(
      {
        canRemove: false,
        isSummary: true,
      },
      { ...attachment, documentBytes: undefined as never }
    );

    expect(screen.getByText('manual.pdf').closest('a')).not.toHaveAttribute(
      'href'
    );
    expect(
      screen.queryByRole('button', { name: /^Delete / })
    ).not.toBeInTheDocument();
    expect(screen.getByText('manual.pdf').closest('.attachment')).toHaveClass(
      'p-1'
    );
  });

  it('opens and closes the delete confirmation without removing the file', async () => {
    const user = userEvent.setup();
    const onRemoveItem = vi.fn();
    renderItem({ onRemoveItem });

    await user.click(screen.getByRole('button', { name: /^Delete / }));
    expect(
      screen.getByRole('heading', { name: 'Confirm deletion' })
    ).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(onRemoveItem).not.toHaveBeenCalled();
    await waitFor(() =>
      expect(
        screen.queryByRole('heading', { name: 'Confirm deletion' })
      ).not.toBeInTheDocument()
    );
  });

  it('confirms deletion with the current attachment value', async () => {
    const user = userEvent.setup();
    const onRemoveItem = vi.fn().mockResolvedValue(undefined);
    renderItem({ onRemoveItem });

    await user.click(screen.getByRole('button', { name: /^Delete / }));
    await user.click(screen.getByRole('button', { name: 'Yes, delete' }));

    expect(onRemoveItem).toHaveBeenCalledWith(attachment);
    await waitFor(() =>
      expect(
        screen.queryByRole('heading', { name: 'Confirm deletion' })
      ).not.toBeInTheDocument()
    );
  });

  it('names each delete button after its file', () => {
    renderItem();

    expect(
      screen.getByRole('button', { name: 'Delete manual.pdf' })
    ).toBeInTheDocument();
  });

  it('creates one object URL per document and revokes it when the row goes', () => {
    const create = vi.spyOn(URL, 'createObjectURL');
    const revoke = vi.spyOn(URL, 'revokeObjectURL');
    const { rerender, unmount } = renderItem();
    const created = create.mock.calls.length;

    rerender(
      <FormHarness initialValues={{ attachments: [attachment] }}>
        <RhfAttachmentItem
          attachment={attachment}
          name='attachments'
          index={0}
          canRemove
          cancelButtonId='cancel-button-doc-1'
          isSummary={false}
        />
        <ValuesProbe />
      </FormHarness>
    );

    expect(create.mock.calls.length).toBe(created);

    unmount();

    expect(revoke).toHaveBeenCalled();
    create.mockRestore();
    revoke.mockRestore();
  });
});
