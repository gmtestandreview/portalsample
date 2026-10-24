import preview from '../../../../.storybook/preview';
import BodyText from './index';

/**
 * BodyText Component Storybook Configuration
 * This file defines the Storybook stories for the BodyText component, which is used to display body text content in the UI.
 * The stories demonstrate the default and emphasized states of the BodyText component, allowing developers to visualize its behavior in different contexts.
 * @module BodyText.stories
 * @prop {Meta} meta - Storybook metadata for the BodyText component.
 * @prop {StoryObj} Default - Story demonstrating the default state of the BodyText component.
 * @prop {StoryObj} Emphasis - Story demonstrating the emphasized state of the BodyText component.
 *
 */

const meta = preview.meta({
  component: BodyText,
  tags: ['ai-generated', 'needs-work'],
});

export const Default = meta.story({
  args: {
    children:
      'This service helps organisations manage calibration and measurement requests.',
  },
});

export const Emphasis = meta.story({
  args: {
    children: 'Read this guidance before continuing to the next step.',
    className: 'fw-bold',
  },
});
