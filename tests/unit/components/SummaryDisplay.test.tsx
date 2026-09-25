import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import SummaryDisplay from '@/components/SummaryDisplay';

describe('SummaryDisplay', () => {
    it('renders the label, span value, descriptor, and custom classes by default', () => {
        const { container } = render(
            <SummaryDisplay
                label='Instrument'
                value='Thermometer'
                descriptor='Calibrated annually'
                containerClassName='summary-container'
                className='summary-value'
            />,
        );

        expect(screen.getByText('Instrument')).toHaveClass('form-label');
        expect(screen.getByText('Thermometer')).toHaveClass('text-break', 'summary-value');
        expect(screen.getByText('Calibrated annually')).toBeInTheDocument();
        expect(container.firstElementChild).toHaveClass('mb-4', 'summary-container');
    });

    it('renders ReactNode labels without treating them as phone labels', () => {
        render(
            <SummaryDisplay
                label={<span>Phone contact</span>}
                value='0212345678'
            />,
        );

        expect(screen.getByText('Phone contact')).toBeInTheDocument();
        expect(screen.getByText('0212345678')).not.toHaveAttribute('aria-hidden');
        expect(screen.queryByText('0 2 1 2 3 4 5 6 7 8')).not.toBeInTheDocument();
    });

    it('renders paragraph values without hiding normal text from assistive technology', () => {
        render(<SummaryDisplay label='Address' value='1 National Circuit' as='p' />);

        const value = screen.getByText('1 National Circuit');

        expect(value.tagName).toBe('P');
        expect(value).toHaveClass('mb-0', 'text-break');
        expect(value).not.toHaveAttribute('aria-hidden');
    });

    it('adds spaced screen reader text for phone values rendered as span or paragraph', () => {
        const { rerender } = render(<SummaryDisplay label='Mobile phone' value='0212345678' />);

        expect(screen.getByText('0212345678')).toHaveAttribute('aria-hidden', 'true');
        expect(screen.getByText('0 2 1 2 3 4 5 6 7 8')).toHaveClass('visually-hidden');

        rerender(<SummaryDisplay label='Business phone' value='0298765432' as='p' />);

        const visiblePhone = screen.getByText('0298765432');

        expect(visiblePhone.tagName).toBe('P');
        expect(visiblePhone).toHaveAttribute('aria-hidden', 'true');
        expect(screen.getByText('0 2 9 8 7 6 5 4 3 2')).toHaveClass('visually-hidden');
    });

    it('renders custom body text only when a custom value is present', () => {
        const { rerender } = render(
            <SummaryDisplay
                label='Attachments'
                value='has-files'
                as='custom'
                bodyText={<strong>Two files uploaded</strong>}
            />,
        );

        expect(screen.getByText('Two files uploaded')).toBeInTheDocument();

        rerender(<SummaryDisplay label='Attachments' as='custom' bodyText={<strong>Two files uploaded</strong>} />);

        expect(screen.queryByText('Two files uploaded')).not.toBeInTheDocument();
        expect(screen.getByText('No details added')).toHaveClass('visually-hidden');
    });

    it('renders empty values with a visible dash and hidden no-details text', () => {
        const { container } = render(<SummaryDisplay label='Reference' className='empty-value' />);

        const emptyValue = container.querySelector('.empty-value');

        expect(emptyValue).toHaveTextContent('- No details added');
        expect(screen.getByText('No details added')).toHaveClass('visually-hidden');
    });

    it.each([
        ['number'],
        ['p'],
    ])('renders empty %s values with the no-details fallback', (as) => {
        const { container } = render(<SummaryDisplay label='Reference' as={as} className='empty-value' />);

        const emptyValue = container.querySelector('.empty-value');

        expect(emptyValue).toHaveTextContent('- No details added');
        expect(screen.getByText('No details added')).toHaveClass('visually-hidden');
    });

    it('formats number-style values and provides spaced hidden text', () => {
        render(
            <SummaryDisplay
                label='ABN'
                value='12345678901'
                as='number'
                format='## ### ### ###'
                valueIsNumericString
            />,
        );

        expect(screen.getByText('12 345 678 901')).toHaveAttribute('aria-hidden', 'true');
        expect(screen.getByText('1 2 3 4 5 6 7 8 9 0 1')).toHaveClass('visually-hidden');
    });

    it('renders number-style values without a format pattern', () => {
        render(<SummaryDisplay label='Amount' value='1234' as='number' />);

        expect(screen.getByText('1234')).toHaveAttribute('aria-hidden', 'true');
        expect(screen.getByText('1 2 3 4')).toHaveClass('visually-hidden');
    });

    it('renders no field value for unsupported display modes', () => {
        const { container } = render(<SummaryDisplay label='Unsupported' value='Hidden value' as='aside' />);

        expect(screen.getByText('Unsupported')).toBeInTheDocument();
        expect(screen.queryByText('Hidden value')).not.toBeInTheDocument();
        expect(container.firstElementChild?.textContent).toBe('Unsupported');
    });
});
