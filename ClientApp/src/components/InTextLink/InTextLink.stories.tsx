import preview from '../../../../.storybook/preview';
import { expect } from 'storybook/test';
import InTextLink from './index';

const meta = preview.meta({
  component: InTextLink,
  tags: ['ai-generated'],
});


export const External = meta.story({
  args: {
    children: 'Read external guidance',
    href: 'https://www.measurement.gov.au/',
    target: '_blank',
  },
  play: async ({
    canvas,
  }) => {
    const link = canvas.getByRole('link', { name: /read external guidance/i });

    await expect(link).toHaveAttribute('rel', 'nofollow noreferrer noopener');
    await expect(link).toHaveAttribute('target', '_blank');
  },
});

export const SameTab = meta.story({
  args: {
    children: 'View terms and conditions',
    href: 'https://www.measurement.gov.au/terms',
    target: '_self',
  },
  play: async ({
    canvas,
  }) => {
    const link = canvas.getByRole('link', {
      name: /view terms and conditions/i,
    });

    await expect(link).toHaveAttribute('target', '_self');
  },
});

export const InlineText = meta.story({
  args: {
    children: 'Open support content',
    href: 'https://www.measurement.gov.au/help',
  },
  play: async ({
    canvas,
  }) => {
    const link = canvas.getByRole('link', { name: /open support content/i });

    await expect(link).toBeVisible();
  },
});
