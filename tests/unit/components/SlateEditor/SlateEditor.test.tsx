import { act, fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Editor, Transforms } from 'slate';
import type * as SlateModule from 'slate';
import SlateEditor from '@/components/SlateEditor/SlateEditor';
import { serializeToHtml } from '@/components/SlateEditor/SlateEditor';
import type { CustomElement } from '@/components/SlateEditor/SlateEditor';

/**
 * Slate builds its document as a plain JavaScript model and only mirrors it into the DOM. Driving
 * the component through the DOM would need `beforeinput` plus a live Selection, neither of which
 * jsdom implements - which is why `onChange` never fired here before and `handleChange` went
 * unmeasured.
 *
 * So these tests drive the model instead. `createEditor` is wrapped to keep a reference to the
 * editor the component builds; the editor itself is the real one, unstubbed. Transforms applied to
 * it call `editor.onChange()`, which `<Slate>` forwards to the `onChange` prop - the same path a
 * keystroke takes once the browser has finished translating it.
 */
const captured = vi.hoisted(() => ({ editors: [] as Editor[] }));

vi.mock('slate', async (importOriginal) => {
    const actual = await importOriginal<typeof SlateModule>();

    return {
        ...actual,
        createEditor: () => {
            const editor = actual.createEditor();
            captured.editors.push(editor);
            return editor;
        },
    };
});

/** The editor belonging to the most recently rendered SlateEditor. */
const currentEditor = () => captured.editors[captured.editors.length - 1];

/** Places a collapsed caret in the first text node. Slate ignores marks while there is no selection. */
const placeCaret = async (editor: Editor, offset = 0) => {
    await act(async () => {
        Transforms.select(editor, {
            anchor: { path: [0, 0], offset },
            focus: { path: [0, 0], offset },
        });
    });
};

/**
 * Applies an edit and lets Slate's change notification land.
 *
 * `apply` batches a burst of operations and defers `editor.onChange` to a microtask, so a
 * synchronous `act` returns before `<Slate>` has told the component anything. Awaiting inside `act`
 * drains that microtask and the React update it schedules together.
 */
const applyEdit = async (change: () => void) => {
    await act(async () => {
        change();
    });
};

const paragraph = (text: string): CustomElement[] => [{
    type: 'paragraph',
    children: [{ text }],
}];

describe('SlateEditor helpers', () => {
    it('serializes paragraph text with inline mark formatting', () => {
        const html = serializeToHtml([
            {
                type: 'paragraph',
                children: [
                    { text: 'Bold', bold: true },
                    { text: 'Italic', italic: true },
                    { text: 'Underline', underline: true },
                    { text: 'Plain' },
                ],
            },
        ]);

        expect(html).toBe('<p><strong>Bold</strong><em>Italic</em><u>Underline</u>Plain</p>');
    });

    it('serializes unknown block types as their child content', () => {
        const html = serializeToHtml([
            {
                type: 'heading',
                children: [{ text: 'Heading text' }],
            } as unknown as CustomElement,
        ]);

        expect(html).toBe('Heading text');
    });
});

describe('SlateEditor', () => {
    it('renders toolbar controls, placeholder label, and the configured character limit', () => {
        render(
            <SlateEditor
                value={paragraph('Hello')}
                setValue={vi.fn()}
                placeholder='Reply to NMI'
                maxCharacters={25}
            />,
        );

        expect(screen.getByRole('textbox', { name: 'Reply to NMI' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Bold' })).toHaveAttribute('title', 'Bold');
        expect(screen.getByRole('button', { name: 'Italic' })).toHaveAttribute('title', 'Italic');
        expect(screen.getByRole('button', { name: 'Underline' })).toHaveAttribute('title', 'Underline');
        expect(document.querySelector('.text-muted')).toHaveTextContent('0 /25');
    });

    it('prevents submitting empty or whitespace-only messages', () => {
        const onSubmit = vi.fn();

        render(
            <SlateEditor
                value={paragraph('   ')}
                setValue={vi.fn()}
                onSubmit={onSubmit}
            />,
        );

        fireEvent.click(screen.getByRole('button', { name: 'Send' }));

        expect(onSubmit).not.toHaveBeenCalled();
        expect(screen.getByText('Message cannot be empty or spaces only')).toBeInTheDocument();
    });

    it('prevents submitting messages that exceed the configured character limit', () => {
        const onSubmit = vi.fn();

        render(
            <SlateEditor
                value={paragraph('abcdef')}
                setValue={vi.fn()}
                onSubmit={onSubmit}
                maxCharacters={5}
            />,
        );

        fireEvent.click(screen.getByRole('button', { name: 'Send' }));

        expect(onSubmit).not.toHaveBeenCalled();
        expect(screen.getByText('Message cannot exceed 5 characters (including formatting)')).toBeInTheDocument();
    });

    it('submits valid messages and supports toolbar mouse interactions', () => {
        const onSubmit = vi.fn();

        render(
            <SlateEditor
                value={paragraph('ready')}
                setValue={vi.fn()}
                onSubmit={onSubmit}
            />,
        );

        fireEvent.mouseDown(screen.getByRole('button', { name: 'Bold' }));
        fireEvent.mouseDown(screen.getByRole('button', { name: 'Italic' }));
        fireEvent.mouseDown(screen.getByRole('button', { name: 'Underline' }));
        fireEvent.click(screen.getByRole('button', { name: 'Send' }));

        expect(onSubmit).toHaveBeenCalledTimes(1);
    });

    it('renders bold, italic and underline marks in the editor body', () => {
        render(
            <SlateEditor
                value={[{
                    type: 'paragraph',
                    children: [
                        { text: 'Bold bit', bold: true },
                        { text: 'Italic bit', italic: true },
                        { text: 'Underlined bit', underline: true },
                        { text: 'Plain bit' },
                    ],
                }]}
                setValue={vi.fn()}
                onSubmit={vi.fn()}
            />,
        );

        expect(screen.getByText('Bold bit').closest('strong')).not.toBeNull();
        expect(screen.getByText('Italic bit').closest('em')).not.toBeNull();
        expect(screen.getByText('Underlined bit').closest('u')).not.toBeNull();
        expect(screen.getByText('Plain bit').closest('strong')).toBeNull();
    });

    it('does not stack the same error when send is pressed repeatedly', () => {
        render(
            <SlateEditor
                value={paragraph('   ')}
                setValue={vi.fn()}
                onSubmit={vi.fn()}
            />,
        );

        const send = screen.getByRole('button', { name: 'Send' });
        fireEvent.click(send);
        fireEvent.click(send);
        fireEvent.click(send);

        expect(screen.getAllByText('Message cannot be empty or spaces only')).toHaveLength(1);
    });

    it('does not stack the length error when send is pressed repeatedly', () => {
        render(
            <SlateEditor
                value={paragraph('abcdef')}
                setValue={vi.fn()}
                onSubmit={vi.fn()}
                maxCharacters={5}
            />,
        );

        const send = screen.getByRole('button', { name: 'Send' });
        fireEvent.click(send);
        fireEvent.click(send);

        expect(screen.getAllByText('Message cannot exceed 5 characters (including formatting)')).toHaveLength(1);
    });

});

describe('SlateEditor document changes', () => {
    beforeEach(() => {
        captured.editors.length = 0;
    });

    it('pushes edits back to the caller and updates the live character count', async () => {
        const setValue = vi.fn();

        render(
            <SlateEditor
                value={paragraph('Hello')}
                setValue={setValue}
                maxCharacters={1000}
            />,
        );

        const editor = currentEditor();
        await placeCaret(editor, 5);
        await applyEdit(() => {
            Transforms.insertText(editor, ' there');
        });

        const lastCall = setValue.mock.calls[setValue.mock.calls.length - 1];
        expect(serializeToHtml(lastCall[0])).toBe('<p>Hello there</p>');
        // Counted over the serialized HTML, not the visible text: the limit exists to bound what
        // gets sent, and the markup travels with it.
        expect(document.querySelector('.text-muted')).toHaveTextContent('18 /1000');
    });

    it('reports a message that grows past the limit while it is being typed', async () => {
        render(
            <SlateEditor
                value={paragraph('abcdef')}
                setValue={vi.fn()}
                maxCharacters={5}
            />,
        );

        const editor = currentEditor();
        await placeCaret(editor, 6);
        await applyEdit(() => {
            Transforms.insertText(editor, 'g');
        });

        expect(screen.getByText('Message cannot exceed 5 characters (including formatting)')).toBeInTheDocument();
    });

    it('does not stack the length error as typing continues past the limit', async () => {
        render(
            <SlateEditor
                value={paragraph('abcdef')}
                setValue={vi.fn()}
                maxCharacters={5}
            />,
        );

        const editor = currentEditor();
        await placeCaret(editor, 6);
        await applyEdit(() => {
            Transforms.insertText(editor, 'g');
        });
        await applyEdit(() => {
            Transforms.insertText(editor, 'h');
        });

        expect(screen.getAllByText('Message cannot exceed 5 characters (including formatting)')).toHaveLength(1);
    });

    it('clears the length error once the message fits again', async () => {
        render(
            <SlateEditor
                value={paragraph('abcdefghijkl')}
                setValue={vi.fn()}
                maxCharacters={20}
            />,
        );

        const editor = currentEditor();
        await placeCaret(editor, 12);
        await applyEdit(() => {
            Transforms.insertText(editor, 'xy');
        });

        expect(screen.getByText('Message cannot exceed 20 characters (including formatting)')).toBeInTheDocument();

        await applyEdit(() => {
            editor.deleteBackward('character');
        });
        await applyEdit(() => {
            editor.deleteBackward('character');
        });

        // Deleting back under the limit has to withdraw the error, otherwise a stale warning blocks
        // a message that is now perfectly valid.
        expect(screen.queryByText('Message cannot exceed 20 characters (including formatting)')).not.toBeInTheDocument();
    });

    it('turns a mark off again when the toolbar button is pressed twice', async () => {
        render(
            <SlateEditor
                value={paragraph('ready')}
                setValue={vi.fn()}
            />,
        );

        const editor = currentEditor();
        // Slate drops marks when there is no selection, so the toolbar is inert until the caret is
        // placed. Without this the second press would re-add the mark rather than remove it.
        await placeCaret(editor, 0);

        const bold = screen.getByRole('button', { name: 'Bold' });

        await applyEdit(() => {
            fireEvent.mouseDown(bold);
        });
        expect(Editor.marks(editor)).toMatchObject({ bold: true });

        await applyEdit(() => {
            fireEvent.mouseDown(bold);
        });
        expect(Editor.marks(editor)?.bold).toBeUndefined();
    });
});

