import preview from '../../../../../.storybook/preview';
import { expect, fn } from 'storybook/test';
import { withReactAriaEvaluation } from '../../../storybook/withReactAriaEvaluation';
import { Link } from './Link';

const meta = preview.meta({
  decorators: [withReactAriaEvaluation],
  title: 'Components/AriaComponents/Link',
  component: Link,
});

export const NavigatesWithHref = meta.story({
  args: {
    children: 'View details',
    href: '#details',
  },
  play: async ({ canvas }) => {
    const link = canvas.getByRole('link', { name: 'View details' });

    await expect(link).toHaveAttribute('href', '#details');
  },
});

export const LinkRoleWithoutHref = meta.story({
  args: {
    children: 'Open help',
    onPress: fn(),
  },
  play: async ({ args, canvas, userEvent }) => {
    const link = canvas.getByRole('link', { name: 'Open help' });

    await expect(link.tagName).toBe('SPAN');
    await expect(link).not.toHaveAttribute('href');

    await userEvent.click(link);

    await expect(args.onPress).toHaveBeenCalledOnce();
  },
});

export const Disabled = meta.story({
  args: {
    children: 'Unavailable resource',
    href: '#unavailable',
    isDisabled: true,
    onPress: fn(),
  },
  play: async ({ args, canvas, userEvent }) => {
    const link = canvas.getByRole('link', { name: 'Unavailable resource' });

    await expect(link).toHaveAttribute('aria-disabled', 'true');

    await userEvent.click(link);

    await expect(args.onPress).not.toHaveBeenCalled();
  },
});
