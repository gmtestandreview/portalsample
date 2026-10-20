import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect } from 'storybook/test';
import { useParams } from 'react-router';
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
} satisfies Meta<typeof ButtonGroup>;

export default meta;
type Story = StoryObj<typeof meta>;

const EditDestination = () => {
  const { requestId } = useParams();
  return <p>Editing request {requestId} organisation and contact</p>;
};

export const GroupedActions: Story = {
  args: {
    left: () => (
      // eslint-disable-next-line @eslint-react/dom-no-void-elements-with-children -- LinkButton's `as` prop is component-specific and never becomes the rendered host element; eslint-react 5.20.2 lowercases 'Link' and mistakes it for the void <link> tag
      <LinkButton as='Link' to='/dashboard' variant='tertiary'>
        Cancel
      </LinkButton>
    ),
    right: () => (
      <LinkButton
        as='a'
        href='https://measurement.gov.au'
        target='_blank'
        variant='secondary'
      >
        External reference
      </LinkButton>
    ),
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('link', { name: 'Cancel' })).toHaveAttribute(
      'href',
      '/dashboard'
    );
    const externalReference = canvas.getByRole('link', {
      name: 'External reference',
    });
    await expect(externalReference).toHaveAttribute(
      'href',
      'https://measurement.gov.au'
    );
    await expect(externalReference).toHaveAttribute('target', '_blank');
  },
};

export const EditSection: Story = {
  args: {
    left: () => <></>,
    right: () => <></>,
  },
  render: () => (
    <EditButton link='/request-for-quote/123/organisation-and-contact' />
  ),
  parameters: {
    portal: {
      destinationRoutes: [
        {
          path: '/request-for-quote/:requestId/organisation-and-contact',
          element: <EditDestination />,
        },
      ],
    },
  },
  play: async ({ canvas, userEvent }) => {
    const editButton = canvas.getByRole('button', {
      name: 'Edit this section',
    });
    editButton.focus();
    await userEvent.keyboard('{Enter}');
    await expect(
      await canvas.findByText('Editing request 123 organisation and contact')
    ).toBeVisible();
  },
};
