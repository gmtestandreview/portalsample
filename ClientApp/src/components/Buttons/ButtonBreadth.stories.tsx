import preview from '../../../../.storybook/preview';
import { expect } from 'storybook/test';
import { useParams } from 'react-router';
import { createElement, Fragment } from 'react';
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

const meta = preview.meta({
  title: 'Components/Buttons/Breadth',
  component: ButtonGroup,
  decorators: [withPortalProviders],
  parameters: {
    layout: 'centered',
  },
});

const EditDestination = () => {
  const { requestId } = useParams();
  return <p>Editing request {requestId} organisation and contact</p>;
};

const getRouterLinkAs = (): 'Link' => 'Link';
const renderNothing = () => createElement(Fragment);

const groupedActionsArgs = {
  left: () => (
    <LinkButton as={getRouterLinkAs()} to='/dashboard' variant='tertiary'>
      Cancel
    </LinkButton>
  ),
  right: () => (
    <LinkButton
      as='a'
      href='https://measurement.gov.au'
      target='_blank'
      rel='noreferrer'
      variant='secondary'
    >
      External reference
    </LinkButton>
  ),
};

export const GroupedActions = meta.story({
  args: groupedActionsArgs,
  play: async ({ canvas }) => {
    const links = canvas.getAllByRole('link');

    await expect(links.map((link) => link.textContent)).toEqual([
      'Cancel',
      'External reference',
    ]);

    const externalReference = canvas.getByRole('link', {
      name: 'External reference',
    });

    await expect(externalReference).toHaveAttribute(
      'href',
      'https://measurement.gov.au',
    );
    await expect(externalReference).toHaveAttribute('target', '_blank');

    await expect(canvas.getByRole('link', { name: 'Cancel' })).toHaveAttribute(
      'href',
      '/dashboard',
    );
  },
});

export const GroupedActionsKeyboardNavigation = meta.story({
  parameters: {
    portal: {
      destinationRoutes: [
        { path: '/dashboard', element: <p>Dashboard destination</p> },
      ],
    },
  },
  args: groupedActionsArgs,
  play: async ({ canvas, userEvent }) => {
    const cancel = canvas.getByRole('link', { name: 'Cancel' });

    cancel.focus();
    await userEvent.keyboard('{Enter}');

    await expect(
      await canvas.findByText('Dashboard destination'),
    ).toBeVisible();
  },
});

export const EditSection = meta.story({
  args: {
    left: renderNothing,
    right: renderNothing,
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
      await canvas.findByText('Editing request 123 organisation and contact'),
    ).toBeVisible();
  },
});
