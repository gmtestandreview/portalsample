import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, screen, userEvent, within } from 'storybook/test';
import AutoSuggest from './index';
import AutoSuggestContainer from './AutoSuggestContainer';
import type { AutoSuggestOption } from './types';
import { withPortalProviders } from '../../../storybook/storybookHarness';

const noopAsync = async () => {};
const noop = () => {};

const mockOptions: AutoSuggestOption<string>[] = [
    { id: 'opt-1', displayText: 'Sydney NSW', value: 'sydney-nsw' },
    { id: 'opt-2', displayText: 'Sydney Olympic Park NSW', value: 'sydney-olympic-park-nsw' },
    { id: 'opt-3', displayText: 'Sydney Airport NSW', value: 'sydney-airport-nsw' },
];

const meta = {
    title: 'Components/Inputs/AutoSuggest',
    component: AutoSuggest,
    decorators: [withPortalProviders],
} satisfies Meta<typeof AutoSuggest>;

export default meta;
type Story = StoryObj<typeof meta>;

export const WithSuggestions: Story = {
    args: {
        name: 'suburb',
        label: 'Suburb',
        getOptions: async (_term: string) => mockOptions,
        onSelectedOption: noopAsync,
        placeholder: 'Type to search...',
    },
    parameters: {
        portal: {
            formik: {
                initialValues: { suburb: '' },
            },
        },
    },
    render: () => (
        <AutoSuggest
            name='suburb'
            label='Suburb'
            getOptions={async (_term: string) => mockOptions}
            onSelectedOption={noopAsync}
            placeholder='Type to search...'
        />
    ),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const user = userEvent.setup();
        const input = canvas.getByRole('combobox', { name: /suburb/i });
        await user.type(input, 'syd');
        const combobox = canvas.getByRole('combobox');
        await expect(combobox).toBeVisible();
        // Typing kicks off the async getOptions; asserting only that the combobox is still
        // visible passes before the results arrive, so React Aria opened its popover and
        // committed the option list after the story had ended. Queried through `screen`
        // rather than `canvas` because the popover renders in a portal, outside the canvas.
        // The accessible name carries the positional announcement AutoSuggestOptions builds,
        // "<displayText> (<n> of <total>)", not the bare display text.
        await expect(await screen.findByRole('option', { name: 'Sydney Olympic Park NSW (2 of 3)' })).toBeVisible();
        // Escape closes the suggestion list. Asserting it also leaves the combobox settled
        // before Storybook unmounts the story: left open, React Aria committed a
        // ComboBoxInner update during the next story in the file.
        await user.keyboard('{Escape}');
        await expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    },
};

export const EmptyState: Story = {
    args: {
        name: 'suburb',
        label: 'Suburb',
        getOptions: async (_term: string) => [],
        onSelectedOption: noopAsync,
        placeholder: 'Type to search...',
    },
    parameters: {
        portal: {
            formik: {
                initialValues: { suburb: '' },
            },
        },
    },
    render: () => (
        <AutoSuggest
            name='suburb'
            label='Suburb'
            getOptions={async (_term: string) => []}
            onSelectedOption={noopAsync}
            placeholder='Type to search...'
        />
    ),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const user = userEvent.setup();
        const input = canvas.getByRole('combobox', { name: /suburb/i });
        await user.type(input, 'xyz');
        const noResult = await canvas.findByText(/no matches found/i);
        await expect(noResult).toBeVisible();
    },
};

export const Loading: Story = {
    args: {
        name: 'suburb',
        label: 'Suburb (loading state)',
        getOptions: async (_term: string) => [],
        onSelectedOption: noopAsync,
        placeholder: 'Loading...',
    },
    parameters: {
        portal: {
            formik: {
                initialValues: { suburb: '' },
            },
        },
    },
    render: () => (
        <AutoSuggestContainer
            name='suburb'
            label='Suburb (loading state)'
            options={[]}
            loading={true}
            onSearchTermChange={noop}
            onCancel={noop}
            onSelectedOption={noopAsync}
            placeholder='Loading...'
        />
    ),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const loadingText = canvas.getByText(/loading options/i);
        await expect(loadingText).toBeVisible();
    },
};
