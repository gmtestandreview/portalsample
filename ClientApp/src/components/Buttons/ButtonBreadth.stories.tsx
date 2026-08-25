import type { Meta, StoryObj } from '@storybook/react-vite';
import ButtonGroup from './ButtonGroup';
import LinkButton from './LinkButton';
import EditButton from './EditButton';
import { withPortalProviders } from '../../storybook/storybookHarness';

/**
 * ButtonBreadth Component Storybook Configuration
 *
 * This file defines the Storybook stories for the ButtonBreadth component, which displays a group of buttons arranged in a breadth layout.
 * The stories demonstrate different configurations of the ButtonBreadth component, including grouped actions and an edit section.
 * 
 * @module ButtonBreadth.stories
 * @prop {Meta} meta - Storybook metadata for the ButtonBreadth component.
 * @prop {StoryObj} GroupedActions - Story demonstrating a group of buttons with different actions.
 * @prop {StoryObj} EditSection - Story demonstrating an edit button that navigates to a specific link.
 *
 */

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
