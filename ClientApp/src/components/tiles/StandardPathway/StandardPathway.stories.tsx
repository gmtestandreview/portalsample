import preview from '../../../../../.storybook/preview';
import StandardPathway from './index';
import { withPortalProviders } from '../../../storybook/storybookHarness';

const meta = preview.meta({
  title: 'Components/Tiles/StandardPathway',
  component: StandardPathway,
  decorators: [withPortalProviders],
  parameters: {
    layout: 'centered',
  },
});

export const InternalNavigation = meta.story({
  args: {
    type: 'internal',
    title: 'Services we offer',
    bodyText:
      'Browse the portal-supported service catalogue before starting a request.',
    linkDescription: 'Open service catalogue',
    to: '/services-we-offer',
  },
});

export const ExternalNavigation = meta.story({
  args: {
    type: 'external',
    title: 'Give us your feedback',
    bodyText:
      'Directs users to the external feedback survey used by the live portal.',
    linkDescription: 'Open feedback survey',
    linkHref: 'https://industry.au1.qualtrics.com/jfe/form/SV_9X41DIbsi8FvCQu',
    target: '_blank',
  },
});
