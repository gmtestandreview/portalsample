import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect } from 'storybook/test';
import CustomBreadcrumb from './index';

/**
 * CustomBreadcrumb Component Storybook Configuration
 *
 * This file defines the Storybook stories for the CustomBreadcrumb component, which provides a breadcrumb navigation UI element.
 * The stories demonstrate different levels of breadcrumb navigation, allowing developers to visualize its behavior in various contexts.
 * 
 * @module Breadcrumb.stories
 * @prop {Meta} meta - Storybook metadata for the CustomBreadcrumb component.
 * @prop {StoryObj} ThreeLevels - Story demonstrating a three-level breadcrumb navigation.
 * @prop {StoryObj} TwoLevels - Story demonstrating a two-level breadcrumb navigation.
 *
 */

const meta = {
    component: CustomBreadcrumb,
    tags: ['ai-generated', 'needs-work', 'docs'],
} satisfies Meta<typeof CustomBreadcrumb>;

export default meta;
type Story = StoryObj<typeof meta>;

export const ThreeLevels: Story = {
  args: {
    breadcrumbs: [
      { to: '/', text: 'Home' },
      { to: '/dashboard', text: 'Dashboard' },
      { text: 'Request for quote' },
    ],
  },
  play: async ({ canvas }) => {
    const navigation = canvas.getByRole('navigation', { name: /breadcrumb/i });
    const lastBreadcrumb = canvas.getByText(/request for quote/i);

    await expect(navigation).toBeInTheDocument();
    await expect(lastBreadcrumb).toHaveAttribute('aria-current', 'page');
  },
};

export const TwoLevels: Story = {
  args: {
    breadcrumbs: [
      { to: '/', text: 'Home' },
      { text: 'Help guide' },
    ],
  },
  play: async ({ canvas }) => {
    const navigation = canvas.getByRole('navigation', { name: /breadcrumb/i });
    const homeLink = canvas.getByRole('link', { name: 'Home' });
    const lastBreadcrumb = canvas.getByText(/help guide/i);

    await expect(navigation).toBeInTheDocument();
    await expect(homeLink).toHaveAttribute('href', '/');
    await expect(lastBreadcrumb).toHaveAttribute('aria-current', 'page');
  },
};
