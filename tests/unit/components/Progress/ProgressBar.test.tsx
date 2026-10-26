import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import ProgressBar from '@/components/Progress/ProgressBar';

describe(ProgressBar, () => {
  it('renders the status and percent as an accessible progress bar', () => {
    expect.hasAssertions();

    render(<ProgressBar percent={42} status='Uploading' />);

    const progressBar = screen.getByRole('progressbar', { name: 'Uploading' });

    expect({
      valueNow: progressBar.getAttribute('aria-valuenow'),
      valueMin: progressBar.getAttribute('aria-valuemin'),
      valueMax: progressBar.getAttribute('aria-valuemax'),
      status: screen.getByText('Uploading').textContent,
      percent: screen.getByText('42%').textContent,
    }).toMatchObject({
      valueNow: '42',
      valueMin: '0',
      valueMax: '100',
      status: 'Uploading',
      percent: ' 42%',
    });
    expect(progressBar.querySelector('.bg-primary')).toHaveStyle({
      width: '42%',
    });
  });
});
