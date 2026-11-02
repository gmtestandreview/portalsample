import preview from '../../../../.storybook/preview';
import { expect, waitFor } from 'storybook/test';
import ServicesWeOffer from './index';
import { withPortalProviders } from '../../storybook/storybookHarness';

const meta = preview.meta({
  title: 'Routes/ServicesWeOffer',
  component: ServicesWeOffer,
  decorators: [withPortalProviders],
  parameters: {
    layout: 'fullscreen',
    portal: {
      initialEntries: ['/services-we-offer'],
      accountDetails: {
        userProfile: { services: [] },
      },
    },
  },
});

export const Default = meta.story({
  play: async ({ canvasElement }) => {
    await waitFor(() =>
      expect(canvasElement.querySelector('[aria-live="off"]')).toHaveAttribute(
        'aria-busy',
        'false',
      ),
    );
  },
});
