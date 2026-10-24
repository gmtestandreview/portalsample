import preview from '../../../../.storybook/preview';
import HeaderIntroText from './index';

const meta = preview.meta({
  component: HeaderIntroText,
  tags: ['ai-generated', 'needs-work'],
});

export const Default = meta.story({
  args: {
    children: 'Use this portal to submit and manage your service requests.',
  },
});

export const WithClass = meta.story({
  args: {
    children: 'This guide explains account setup and access management.',
    className: 'mb-0',
  },
});
