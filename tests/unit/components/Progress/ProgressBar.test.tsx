import { render, screen } from '@testing-library/react';

import { describe, expect, it } from 'vitest';

import ProgressBar from '@/components/Progress/ProgressBar';

describe(ProgressBar, () => {
  it('renders the status and percent as an accessible progress bar', () => {
    expect.assertions(1);
    render(<ProgressBar percent={42} status='Uploading' />);
    const progressBar = screen.getByRole('progressbar', { name: 'Uploading' });
    expect(progressBar).toHaveAttribute('aria-valuenow', '42');
  });
});

describe(ProgressBar, () => {
  it('renders the status and percent as an accessible progress bar', () => {
    expect.assertions(1);
    render(<ProgressBar percent={42} status='Uploading' />);
    const progressBar = screen.getByRole('progressbar', { name: 'Uploading' });
    expect(progressBar).toHaveAttribute('aria-valuemin', '0');
  });
});

describe(ProgressBar, () => {
  it('renders the status and percent as an accessible progress bar', () => {
    expect.assertions(1);
    render(<ProgressBar percent={42} status='Uploading' />);
    const progressBar = screen.getByRole('progressbar', { name: 'Uploading' });
    expect(progressBar).toHaveAttribute('aria-valuemax', '100');
  });
});

describe(ProgressBar, () => {
  it('renders the status and percent as an accessible progress bar', () => {
    expect.assertions(1);
    render(<ProgressBar percent={42} status='Uploading' />);
    const progressBar = screen.getByRole('progressbar', { name: 'Uploading' });
    expect(screen.getByText('Uploading')).toBeInTheDocument();
  });
});

describe(ProgressBar, () => {
  it('renders the status and percent as an accessible progress bar', () => {
    expect.assertions(1);
    render(<ProgressBar percent={42} status='Uploading' />);
    const progressBar = screen.getByRole('progressbar', { name: 'Uploading' });
    expect(screen.getByText('42%')).toBeInTheDocument();
  });
});
