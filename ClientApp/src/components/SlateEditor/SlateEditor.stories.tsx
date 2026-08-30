import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { within, expect, fn, userEvent } from 'storybook/test';
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
} satisfies Meta<typeof SlateEditor>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        // The Slate Editable surface is exposed as a textbox. Slate renders a contenteditable
        // div, which takes no accessible name from its placeholder the way a native input
        // would, so the name is asserted by role rather than just the element's presence.
        await expect(canvas.getByRole('textbox', { name: 'Type your message…' })).toBeVisible();
        await expect(canvas.getByRole('button', { name: /send/i })).toBeVisible();
        // Formatting controls are present.
        await expect(canvas.getByRole('button', { name: /bold/i })).toBeVisible();
        // Typing is what drives Slate's Editable through act; the three assertions above are
        // static chrome, so without an interaction the editor kept updating after the story
        // had ended and the warning surfaced against whichever story ran next.
        await userEvent.type(canvas.getByRole('textbox'), ' Noted.');
        await expect(canvas.getByText('Thanks for the update on the application. Noted.')).toBeVisible();
        // The counter measures serialised HTML length, not visible characters: the 48
        // characters above plus the <p></p> wrapper.
        await expect(canvas.getByText(/55\s*\/\s*500/)).toBeVisible();
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
        const textbox = canvas.getByRole('textbox');
        await userEvent.click(textbox);
        await userEvent.type(textbox, 'Hi');
        await expect(canvas.getByText(/9\s*\/\s*500/)).toBeVisible();
    },
};
