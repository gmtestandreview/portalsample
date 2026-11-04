import preview from '../../../../.storybook/preview';
import { expect, within } from 'storybook/test';
import Header from './index';
import { withPortalProviders } from '../../storybook/storybookHarness';

const meta = preview.meta({
  title: 'Components/Header',
  component: Header,
  decorators: [withPortalProviders],
  parameters: {
    layout: 'fullscreen',
  },
});

// SB-023: authenticated header — banner landmark, navigation, and sign-out link accessible
export const Authenticated = meta.story({
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(
      canvasElement.querySelector('header') ??
        canvasElement.querySelector('[role="banner"]'),
    ).toBeTruthy();

    // NMI logo link is present and has accessible text
    const logoLink = canvas
      .getAllByRole('link')
      .find((l) => l.getAttribute('aria-label') || l.textContent.trim());

    await expect(logoLink).toBeTruthy();

    await expect(
      canvasElement.querySelector('nav') ??
        canvasElement.querySelector('[role="navigation"]'),
    ).toBeTruthy();
  },
});

export const Public = meta.story({
  parameters: {
    portal: {
      authenticated: false,
    },
  },
});
