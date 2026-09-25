import type { Meta, StoryObj } from '@storybook/react-vite';
import { ListBox } from 'react-aria-components';
import { expect } from 'storybook/test';
import AutoSuggestOption from './AutoSuggestOption';

/**
 * `AutoSuggestOption` is a single suggestion row for the `AutoSuggest` combobox. It
 * is a thin wrapper over React Aria's `ListBoxItem` and must be rendered inside a
 * `ListBox` collection, so the stories provide that parent context.
 */
const meta = {
    title: 'Components/Inputs/AutoSuggest/AutoSuggestOption',
    component: AutoSuggestOption,
    parameters: {
        layout: 'centered',
    },
    decorators: [
        (Story) => (
            <ListBox aria-label='Suggestions' selectionMode='single'>
                <Story />
            </ListBox>
        ),
    ],
    args: {
        id: 'opt-1',
        displayText: 'National Measurement Institute',
        ariaLabel: 'National Measurement Institute',
        value: 'nmi',
    },
} satisfies Meta<typeof AutoSuggestOption>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    play: async ({ canvas }) => {
        const option = await canvas.findByRole('option', { name: 'National Measurement Institute' });
        await expect(option).toBeVisible();
    },
};

export const Highlighted: Story = {
    args: {
        selected: 'opt-1',
    },
    play: async ({ canvas }) => {
        const option = await canvas.findByRole('option', { name: 'National Measurement Institute' });
        await expect(option).toHaveClass('highlighted');
    },
};
