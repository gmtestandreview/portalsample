import type { Meta, StoryObj } from '@storybook/react-vite';
import ButtonGroup from './ButtonGroup';
import LinkButton from './LinkButton';
import EditButton from './EditButton';
import { withPortalProviders } from '../../storybook/storybookHarness';

const meta = {
    title: 'Components/Buttons/Breadth',
    component: ButtonGroup,
    decorators: [withPortalProviders],
    parameters: {
        layout: 'centered',
    },
    tags: ['autodocs'],
} satisfies Meta<typeof ButtonGroup>;

export default meta;
type Story = StoryObj<typeof meta>;

export const GroupedActions: Story = {
    args: {
        left: () => (
            <LinkButton as='Link' to='/dashboard' variant='tertiary'>
                Cancel
            </LinkButton>
        ),
        right: () => (
            <LinkButton as='a' href='https://measurement.gov.au' target='_blank' variant='secondary'>
                External reference
            </LinkButton>
        ),
    },
};

export const EditSection: Story = {
    args: {
        left: () => <></>,
        right: () => <></>,
    },
    render: () => <EditButton link='/request-for-quote/123/organisation-and-contact' />,
};
