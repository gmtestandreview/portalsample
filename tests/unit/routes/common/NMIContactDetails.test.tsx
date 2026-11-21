import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { RequestForQuoteDetails } from '../../../../ClientApp/src/api/web-api-client';
import NMIContactDetails from '../../../../ClientApp/src/routes/common/NMIContactDetails';

const quotationData: RequestForQuoteDetails = {
  quotationIdNum: 'Q-2024-000456',
  nmiTestOfficerName: 'Jordan Officer',
  nmiTestOfficerPhone: '02 6213 6800',
  nmiTestOfficerEmail: 'jordan.officer@industry.gov.au',
};

describe(NMIContactDetails, () => {
  it('renders the caller-supplied heading above the officer details', () => {
    expect.assertions(4);

    render(
      <NMIContactDetails
        heading='Contact your NMI test officer about this quote.'
        quotationData={quotationData}
      />,
    );

    expect(
      screen.getByRole('heading', {
        name: 'Contact your NMI test officer about this quote.',
      }),
    ).toBeVisible();
    expect(screen.getByText('Jordan Officer')).toBeVisible();
    expect(screen.getByRole('link', { name: '02 6213 6800' })).toHaveAttribute(
      'href',
      'tel:02 6213 6800',
    );
    expect(
      screen.getByRole('link', { name: 'jordan.officer@industry.gov.au' }),
    ).toHaveAttribute(
      'href',
      `mailto:jordan.officer@industry.gov.au?subject=${encodeURIComponent('Reviewing Quotation ID: Q-2024-000456')}`,
    );
  });

  it('percent-encodes the quotation id in the mailto subject', () => {
    expect.assertions(1);

    render(
      <NMIContactDetails
        heading='Heading'
        quotationData={{
          ...quotationData,
          quotationIdNum: 'Q 1&subject=injected',
        }}
      />,
    );

    expect(
      screen.getByRole('link', { name: 'jordan.officer@industry.gov.au' }),
    ).toHaveAttribute(
      'href',
      'mailto:jordan.officer@industry.gov.au?subject=Reviewing%20Quotation%20ID%3A%20Q%201%26subject%3Dinjected',
    );
  });

  it('omits the contact links when the officer has no phone or email', () => {
    expect.assertions(2);

    render(
      <NMIContactDetails
        heading='Heading'
        quotationData={{ quotationIdNum: 'Q-1' }}
      />,
    );

    expect(screen.queryByRole('link')).toBeNull();
    expect(screen.getByText('Test officer:')).toBeVisible();
  });

  it('renders without quotation data', () => {
    expect.assertions(2);

    render(<NMIContactDetails heading='Heading' quotationData={undefined} />);

    expect(screen.getByRole('heading', { name: 'Heading' })).toBeVisible();
    expect(screen.queryByRole('link')).toBeNull();
  });
});
