import preview from '../../../../../.storybook/preview';
import { expect, within } from 'storybook/test';
import { withPortalProviders } from '../../../storybook/storybookHarness';
import BackToDashboardButton from '.';

/**
 * BackToDashboardButton Component Storybook Configuration
 *
 * This file defines the Storybook stories for the BackToDashboardButton component, which provides a button that navigates users back to the dashboard.
 * The stories demonstrate the default behavior of the button, as well as variations with custom container and link classes.
 *
 * @module BackToDashboardButton.stories
 * @prop {Meta} meta - Storybook metadata for the BackToDashboardButton component.
 * @prop {StoryObj} Default - Story demonstrating the default state of the BackToDashboardButton.
 * @prop {StoryObj} CustomContainer - Story demonstrating a custom container class applied to the button's wrapper.
 * @prop {StoryObj} CustomClass - Story demonstrating a custom CSS class applied directly to the button link element.
 */

const meta = preview.meta({
  title: 'Components/Buttons/BackToDashboardButton',
  component: BackToDashboardButton,
  decorators: [withPortalProviders],
});


/**
 * Default — renders the button with no additional props.
 * Requires router context (Link) provided by withPortalProviders.
 */
export const Default = meta.story({
  play: async ({
    canvasElement,
  }) => {
    const canvas = within(canvasElement);
    const link = canvas.getByRole('link', { name: /back to dashboard/i });

    await expect(link).toBeInTheDocument();
    await expect(link).toHaveAttribute('href', '/dashboard');
  },
});

/**
 * CustomContainer — applies extra margin to the wrapping div via containerClassName.
 */
export const CustomContainer = meta.story({
  args: {
    containerClassName: 'mt-4',
  },
});

/**
 * CustomClass — applies additional CSS classes directly to the link element.
 */
export const CustomClass = meta.story({
  args: {
    className: 'fw-bold',
  },
});
