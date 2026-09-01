import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import SlateEditor from '@/components/SlateEditor/SlateEditor';
import { serializeToHtml } from '@/components/SlateEditor/SlateEditor';
import type { CustomElement } from '@/components/SlateEditor/SlateEditor';

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
});
