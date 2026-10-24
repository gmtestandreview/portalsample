import preview from '../../../.storybook/preview';
import { within, expect } from 'storybook/test';
import Home from './Home';
import { withPortalProviders } from '../storybook/storybookHarness';

/**
 * `Home` is the root (`/`) landing surface. It is a thin wrapper that renders the
 * auth-aware `GetStarted` call-to-action, so its coverage mirrors the unauthenticated
 * public-landing experience.
 */
const meta = preview.meta({
  title: 'Components/Home',
  component: Home,
  decorators: [withPortalProviders],
  parameters: {
    layout: 'fullscreen',
    portal: {
      authenticated: false,
      initialEntries: ['/'],
    },
  },
});


export const PublicLanding = meta.story({
  play: async ({
    canvasElement,
  }) => {
    const canvas = within(canvasElement);
    // GetStarted renders a heading; assert the landing surface mounts.
    const heading = await canvas.findByRole('heading', { level: 1 });

    await expect(heading).toBeVisible();
    await expect(heading).toHaveTextContent(
      'National Measurement Institute (NMI) Services portal',
    );
  },
});
