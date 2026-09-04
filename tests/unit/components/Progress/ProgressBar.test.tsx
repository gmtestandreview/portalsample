import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import ProgressBar from '@/components/Progress/ProgressBar';

describe('ProgressBar', () => {
    it('renders the status and percent as an accessible progress bar', () => {
        render(<ProgressBar percent={42} status='Uploading' />);

        const progressBar = screen.getByRole('progressbar', { name: 'Uploading' });
        expect(progressBar).toHaveAttribute('aria-valuenow', '42');
        expect(progressBar).toHaveAttribute('aria-valuemin', '0');
        expect(progressBar).toHaveAttribute('aria-valuemax', '100');
        expect(screen.getByText('Uploading')).toBeInTheDocument();
        expect(screen.getByText('42%')).toBeInTheDocument();
        expect(progressBar.querySelector('.bg-primary')).toHaveStyle({ width: '42%' });
    });
});
