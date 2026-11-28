import userEvent from '@testing-library/user-event';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import ApplicationTimeline from '@/routes/ta/manage/appTimeline';

describe(ApplicationTimeline, () => {
  it('shows the empty state and toggles the recent section', async () => {
    expect.hasAssertions();

    render(<ApplicationTimeline />);

    await expect(
      screen.findByText(
        'No information is available for this section at this time.',
      ),
    ).resolves.toBeInTheDocument();

    const toggle = screen.getByRole('button', { name: 'Recent' });

    expect(toggle).toHaveAttribute('aria-expanded', 'true');

    await userEvent.click(toggle);

    expect(toggle).toHaveAttribute('aria-expanded', 'false');
  });
});
