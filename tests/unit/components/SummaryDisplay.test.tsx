import { render, screen } from '@testing-library/react';

import { describe, expect, it } from 'vitest';

import SummaryDisplay from '@/components/SummaryDisplay';

describe(SummaryDisplay, () => {
  it('renders the label, span value, descriptor, and custom classes by default', () => {
    expect.assertions(4);
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
    expect(screen.getByText('Thermometer')).toHaveClass(
      'text-break',
      'summary-value',
    );
    expect(screen.getByText('Calibrated annually')).toBeInTheDocument();
    expect(container.firstElementChild).toHaveClass(
      'mb-4',
      'summary-container',
    );
  });
});
