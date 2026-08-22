import { act, fireEvent, render, screen } from '@testing-library/react';
import vm from 'node:vm';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router';
import BackToTopButton from '@/components/Utilities/backToTopButton';
import ContactLink from '@/components/Utilities/ContactLink';
import DeliveryInstructions from '@/components/Utilities/deliveryInstructions';
import useBodyClass from '@/components/Utilities/useBodyClass';
import useDebounce from '@/components/Utilities/useDebounce';

const BodyClassHarness = ({ className }: { className: string | string[] }) => {
    useBodyClass(className);
    return <div>Body class harness</div>;
};

const DebounceHarness = ({ value, delay }: { value: string; delay: number }) => {
    const debouncedValue = useDebounce(value, delay);
    return <p>{debouncedValue}</p>;
};

describe('utility runtime components and hooks', () => {
    beforeEach(() => {
        document.body.className = '';
    });

    afterEach(() => {
        vi.useRealTimers();
        document.body.className = '';
    });

    it('renders contact recovery actions', () => {
        render(
            <MemoryRouter>
                <ContactLink />
            </MemoryRouter>,
        );

        expect(screen.getByRole('link', { name: 'Go to dashboard' })).toHaveAttribute('href', '/');
        expect(screen.getByRole('link', { name: 'infotm@measurement.gov.au' }))
            .toHaveAttribute('href', 'mailto:infotm@measurement.gov.au?Subject=Error on NMI Services portal');
    });

    it('scrolls and focuses the configured target from the back to top button', async () => {
        vi.useFakeTimers();
        const target = document.createElement('div');
        target.id = 'summary';
        target.tabIndex = -1;
        document.body.appendChild(target);
        const focus = vi.spyOn(target, 'focus');

        render(<BackToTopButton to='#summary' className='mt-2' />);
        fireEvent.click(screen.getByRole('link', { name: 'Back to top' }));
        act(() => vi.runOnlyPendingTimers());

        expect(screen.getByRole('link', { name: 'Back to top' })).toHaveAttribute('href', '#summary');
        expect(screen.getByRole('link', { name: 'Back to top' })).toHaveClass('mt-2');
        expect(target.scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth', block: undefined });
        expect(focus).toHaveBeenCalled();
    });

    it('renders the back-to-top landmark as a semantic nav element', () => {
        render(<BackToTopButton />);

        expect(screen.getByRole('navigation', { name: 'Back to top navigation' }).tagName).toBe('NAV');
    });

    it('renders delivery instructions only when text is supplied', () => {
        const { rerender } = render(<DeliveryInstructions deliveryInstructions='Use dock 3 on arrival.' />);

        expect(screen.getByRole('heading', { name: 'NMI site specific receiving instructions' })).toBeInTheDocument();
        expect(screen.getByText('Use dock 3 on arrival.')).toBeInTheDocument();

        rerender(<DeliveryInstructions />);
        expect(screen.queryByRole('heading', { name: 'NMI site specific receiving instructions' })).not.toBeInTheDocument();
    });

    it('adds and removes a single body class', () => {
        const { unmount } = render(<BodyClassHarness className='print-mode' />);

        expect(document.body).toHaveClass('print-mode');
        unmount();
        expect(document.body).not.toHaveClass('print-mode');
    });

    it('adds and removes multiple body classes', () => {
        const { unmount } = render(<BodyClassHarness className={['wizard', 'compact']} />);

        expect(document.body).toHaveClass('wizard', 'compact');
        unmount();
        expect(document.body).not.toHaveClass('wizard');
        expect(document.body).not.toHaveClass('compact');
    });

    it('accepts arrays created in another DOM realm', () => {
        const foreignClasses = vm.runInNewContext('["wizard", "compact"]') as string[];

        const { unmount } = render(<BodyClassHarness className={foreignClasses} />);

        expect(document.body).toHaveClass('wizard', 'compact');
        unmount();
        expect(document.body).not.toHaveClass('wizard');
        expect(document.body).not.toHaveClass('compact');
    });

    it('returns the latest value after the debounce delay and cancels stale timers', () => {
        vi.useFakeTimers();
        const { rerender } = render(<DebounceHarness value='first' delay={250} />);

        expect(screen.getByText('first')).toBeInTheDocument();
        rerender(<DebounceHarness value='second' delay={250} />);
        act(() => vi.advanceTimersByTime(249));
        expect(screen.getByText('first')).toBeInTheDocument();

        rerender(<DebounceHarness value='third' delay={250} />);
        act(() => vi.advanceTimersByTime(250));
        expect(screen.getByText('third')).toBeInTheDocument();
        expect(screen.queryByText('second')).not.toBeInTheDocument();
    });
});
