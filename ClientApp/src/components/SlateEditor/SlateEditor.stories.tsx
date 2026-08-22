import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { within, expect, fn } from 'storybook/test';
import SlateEditor, { type CustomElement } from './SlateEditor';

/**
 * `SlateEditor` is the rich-text message composer used in the type-approval messaging
 * thread. It provides Bold/Italic/Underline marks, a live character counter against a
 * `maxCharacters` budget, and a Send action. Content is sanitised (DOMPurify) and
 * serialised to HTML on submit. The stories wrap it in local state so the editor is
 * controlled, mirroring its real usage.
 */
const initialValue: CustomElement[] = [
    { type: 'paragraph', children: [{ text: 'Thanks for the update on the application.' }] },
];

const meta = {
    title: 'Components/SlateEditor',
    component: SlateEditor,
    parameters: {
        layout: 'padded',
    },
    args: {
        value: initialValue,
        setValue: fn(),
        onSubmit: fn(),
        placeholder: 'Type your message…',
        maxCharacters: 500,
    },
    render: (args) => {
        const [value, setValue] = useState<CustomElement[]>(args.value);
        return (
            <SlateEditor
                {...args}
                value={value}
                setValue={(next) => {
                    setValue(next);
                    args.setValue(next);
                }}
            />
        );
    },
    tags: ['autodocs'],
} satisfies Meta<typeof SlateEditor>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        // The Slate Editable surface is exposed as a textbox.
        await expect(canvas.getByRole('textbox')).toBeVisible();
        await expect(canvas.getByRole('button', { name: /send/i })).toBeVisible();
        // Formatting controls are present.
        await expect(canvas.getByRole('button', { name: /bold/i })).toBeVisible();
    },
};

export const Empty: Story = {
    args: {
        value: [{ type: 'paragraph', children: [{ text: '' }] }],
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        // Live counter starts at zero out of the budget.
        await expect(canvas.getByText(/0/)).toBeVisible();
        await expect(canvas.getByText(/500/)).toBeVisible();
    },
};
