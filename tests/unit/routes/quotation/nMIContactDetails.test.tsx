import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { RequestForQuoteDetails } from '../../../../ClientApp/src/api/web-api-client';

interface SharedContactDetailsProps {
  readonly heading: string;
  readonly quotationData: RequestForQuoteDetails | undefined;
}

vi.mock('../../../../ClientApp/src/routes/common/NMIContactDetails', () => ({
  default: ({ heading, quotationData }: SharedContactDetailsProps) => (
    <div data-testid='shared-contact-details' data-heading={heading}>
      {quotationData?.quotationIdNum}
    </div>
  ),
}));

import NMIContactDetails from '../../../../ClientApp/src/routes/quotation/nMIContactDetails';

describe(NMIContactDetails, () => {
  it('delegates to the shared contact details component', () => {
    expect.assertions(2);

    render(
      <NMIContactDetails quotationData={{ quotationIdNum: 'Q-2024-000456' }} />,
    );

    const sharedContactDetails = screen.getByTestId('shared-contact-details');

    expect(sharedContactDetails).toHaveAttribute(
      'data-heading',
      'Contact your NMI test officer if any of the details are not correct before proceeding.',
    );

    expect(sharedContactDetails).toHaveTextContent('Q-2024-000456');
  });
});
