import preview from '../../../../.storybook/preview';
import ExternalLinkIcon from './ExternalLinkIcon';

const meta = preview.meta({
  title: 'Components/Icons',
  component: ExternalLinkIcon,
  parameters: {
    layout: 'centered',
  },
});

export const ExternalLink = meta.story({
  render: () => (
    <div className='d-flex align-items-center gap-2 fs-5'>
      <span>Opens in a new tab</span>
      <ExternalLinkIcon />
    </div>
  ),
});
