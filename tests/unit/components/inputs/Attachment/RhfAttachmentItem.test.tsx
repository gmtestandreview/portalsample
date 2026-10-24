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

describe(RhfAttachmentItem, () => {
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

    await user.tab();

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

  it('reports a failed category save and puts the previous category back', async () => {
    const user = userEvent.setup();
    const onCategoryUpdate = vi
      .fn()
      .mockRejectedValue(new Error('token abc123 expired'));
    const onCategoryError = vi.fn();
    renderItem(
      { onCategoryUpdate, onCategoryError },
      { ...attachment, attachmentCategory: 'Manuals' }
    );

    await user.selectOptions(
      screen.getByRole('combobox', { name: 'Category' }),
      'Certificate'
    );

    await waitFor(() =>
      expect(onCategoryError).toHaveBeenCalledWith(
        'Could not save the category for manual.pdf.'
      )
    );

    expect(onCategoryError).toHaveBeenCalledTimes(1);

    await waitFor(() =>
      expect(screen.getByRole('combobox', { name: 'Category' })).toHaveValue(
        'Manuals'
      )
    );

    expect(screen.getByTestId('values')).toHaveTextContent(
      '"attachmentCategory":"Manuals"'
    );
  });

  it('survives a failed category save when no error handler is given', async () => {
    const unhandled = vi.fn();
    process.on('unhandledRejection', unhandled);
    const user = userEvent.setup();
    const onCategoryUpdate = vi.fn().mockRejectedValue(new Error('boom'));
    renderItem({ onCategoryUpdate });

    await user.selectOptions(
      screen.getByRole('combobox', { name: 'Category' }),
      'Certificate'
    );

    await waitFor(() =>
      expect(screen.getByRole('combobox', { name: 'Category' })).toHaveValue('')
    );
    await new Promise((resolve) => setTimeout(resolve, 0));
    process.off('unhandledRejection', unhandled);

    expect(unhandled).not.toHaveBeenCalled();
  });

  describe('failed category saves that overlap', () => {
    const saved = { ...attachment, attachmentCategory: 'Manuals' };
    const pick = async (
      user: ReturnType<typeof userEvent.setup>,
      category: string
    ) =>
      user.selectOptions(
        screen.getByRole('combobox', { name: 'Category' }),
        category
      );
    const settle = async (save: Deferred, outcome: 'resolve' | 'reject') => {
      await act(async () => {
        if (outcome === 'resolve') {
          save.resolve();
        } else {
          save.reject();
        }
        await save.promise.catch(() => {});
      });
    };

    it('ends at the saved category when two saves in a row both fail', async () => {
      const user = userEvent.setup();
      const first = deferred();
      const second = deferred();
      const onCategoryUpdate = vi
        .fn()
        .mockReturnValueOnce(first.promise)
        .mockReturnValueOnce(second.promise);
      renderItem({ onCategoryUpdate }, saved);

      await pick(user, 'Certificate');
      await pick(user, 'Other');
      await settle(first, 'reject');
      await settle(second, 'reject');

      await waitFor(() =>
        expect(screen.getByRole('combobox', { name: 'Category' })).toHaveValue(
          'Manuals'
        )
      );
    });

    it('keeps a later successful save when an earlier one fails afterwards', async () => {
      const user = userEvent.setup();
      const first = deferred();
      const second = deferred();
      const onCategoryUpdate = vi
        .fn()
        .mockReturnValueOnce(first.promise)
        .mockReturnValueOnce(second.promise);
      const onCategoryError = vi.fn();
      renderItem({ onCategoryUpdate, onCategoryError }, saved);

      await pick(user, 'Certificate');
      await pick(user, 'Other');
      await settle(second, 'resolve');
      await settle(first, 'reject');

      await waitFor(() => expect(onCategoryError).toHaveBeenCalledWith());

      expect(screen.getByRole('combobox', { name: 'Category' })).toHaveValue(
        'Other'
      );
    });

    it('keeps the newest saved category when an older save succeeds late', async () => {
      const user = userEvent.setup();
      const first = deferred();
      const second = deferred();
      const third = deferred();
      const onCategoryUpdate = vi
        .fn()
        .mockReturnValueOnce(first.promise)
        .mockReturnValueOnce(second.promise)
        .mockReturnValueOnce(third.promise);
      renderItem({ onCategoryUpdate }, saved);

      await pick(user, 'Certificate');
      await pick(user, 'Other');
      await settle(second, 'resolve');
      await settle(first, 'resolve');
      await pick(user, 'Specifications');
      await settle(third, 'reject');

      await waitFor(() =>
        expect(screen.getByRole('combobox', { name: 'Category' })).toHaveValue(
          'Other'
        )
      );
    });

    it('reverts to an empty category when the document never had one', async () => {
      const user = userEvent.setup();
      const failing = deferred();
      const onCategoryUpdate = vi.fn().mockReturnValue(failing.promise);
      const { id, attachmentName, attachmentSize, documentBytes } = attachment;
      renderItem(
        { onCategoryUpdate },
        { id, attachmentName, attachmentSize, documentBytes }
      );

      await pick(user, 'Certificate');
      await settle(failing, 'reject');

      await waitFor(() =>
        expect(screen.getByRole('combobox', { name: 'Category' })).toHaveValue(
          ''
        )
      );
    });

    it.each([[[]], [null]])(
      'leaves the form alone when the list no longer holds the document (%j)',
      async (replacement) => {
        const user = userEvent.setup();
        const pending = deferred();
        const onCategoryUpdate = vi.fn().mockReturnValue(pending.promise);
        renderItem({ onCategoryUpdate }, saved);

        await pick(user, 'Certificate');
        act(() => {
          methodsRef.current?.setValue('attachments', replacement);
        });
        await settle(pending, 'reject');

        expect(methodsRef.current?.getValues('attachments')).toEqual(
          replacement
        );
      }
    );

    it('writes nothing to the form when the row has gone before the save fails', async () => {
      const user = userEvent.setup();
      const pending = deferred();
      const onCategoryUpdate = vi.fn().mockReturnValue(pending.promise);
      const { unmount } = renderItem({ onCategoryUpdate }, saved);

      await pick(user, 'Certificate');
      unmount();
      await settle(pending, 'reject');

      expect(
        methodsRef.current?.getValues('attachments.0.attachmentCategory')
      ).toBe('Certificate');
    });
  });

  it('does not report an error when the category saves', async () => {
    const user = userEvent.setup();
    const onCategoryUpdate = vi.fn().mockResolvedValue(undefined);
    const onCategoryError = vi.fn();
    renderItem({ onCategoryUpdate, onCategoryError });

    await user.selectOptions(
      screen.getByRole('combobox', { name: 'Category' }),
      'Certificate'
    );

    await waitFor(() => expect(onCategoryUpdate).toHaveBeenCalledWith());

    expect(onCategoryError).not.toHaveBeenCalled();
    expect(screen.getByRole('combobox', { name: 'Category' })).toHaveValue(
      'Certificate'
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

    expect(create).toHaveBeenCalledTimes(created);

    unmount();

    expect(revoke).toHaveBeenCalledWith();

    create.mockRestore();
    revoke.mockRestore();
  });
});
