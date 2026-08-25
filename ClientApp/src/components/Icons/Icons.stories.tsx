import type { Meta, StoryObj } from '@storybook/react-vite';
import ExternalLinkIcon from './ExternalLinkIcon';

const meta = {
    title: 'Components/Icons',
    component: ExternalLinkIcon,
    parameters: {
        layout: 'centered',
    },
} satisfies Meta<typeof ExternalLinkIcon>;

export default meta;
type Story = StoryObj<typeof meta>;

export const ExternalLink: Story = {
    render: () => (
        <div className='d-flex align-items-center gap-2 fs-5'>
            <span>Opens in a new tab</span>
            <ExternalLinkIcon />
        </div>
    ),
};
