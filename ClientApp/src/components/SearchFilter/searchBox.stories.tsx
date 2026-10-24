import preview from '../../../../.storybook/preview';
import { within, expect, userEvent, fn } from 'storybook/test';
import SearchBox from './searchBox';

/**
 * `SearchBox` is the dashboard keyword search field. It keeps local input state,
 * exposes a clear affordance once text is entered, and submits the term on Enter (or
 * clears it when emptied). It is purely presentational — submission is delegated to
 * the `onSearchSubmit` callback.
 */
const meta = preview.meta({
  title: 'Components/SearchFilter/SearchBox',
  component: SearchBox,
  parameters: {
    layout: 'padded',
  },
  args: {
    onSearchSubmit: fn(),
    placeholder: 'Search manufacturer, model, serial',
  },
});


export const Empty = meta.story({
  play: async ({
    canvasElement,
  }) => {
    const canvas = within(canvasElement);

    await expect(canvas.getByRole('textbox')).toBeVisible();
    // No clear button until there is a value.
    await expect(canvas.queryByTestId('clear-search-button')).toBeNull();
  },
});

export const TypeAndSubmit = meta.story({
  play: async ({
    canvasElement,
    args,
  }) => {
    const canvas = within(canvasElement);
    const user = userEvent.setup();
    const input = canvas.getByRole('textbox');
    await user.type(input, 'Keysight');

    // Clear button appears once a value is present.
    await expect(canvas.getByTestId('clear-search-button')).toBeVisible();

    await user.keyboard('{Enter}');

    await expect(args.onSearchSubmit).toHaveBeenCalledWith('Keysight');
  },
});

export const Prefilled = meta.story({
  args: {
    initialSearchValue: 'Fluke',
  },
  play: async ({
    canvasElement,
  }) => {
    const canvas = within(canvasElement);

    await expect(canvas.getByRole('textbox')).toHaveValue('Fluke');
    await expect(canvas.getByTestId('clear-search-button')).toBeVisible();
  },
});
