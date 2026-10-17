import { act, fireEvent, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  accountDetails,
  basePreInfo,
  mocks,
  renderRoute,
  streetAddress,
  triggerInputChange,
} from './workflowStepComponents.test.setup';

describe('workflow step components', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.msalAccounts.splice(0, mocks.msalAccounts.length, {
      homeAccountId: 'account-1',
    });
    mocks.acquireTokenSilent.mockResolvedValue({ accessToken: 'access-token' });
    mocks.useAccountState.mockReturnValue({ details: accountDetails });
    mocks.dashboardNotification = null;
    mocks.inputChangeHandlers.clear();
    mocks.formikValues = {
      sourceReferenceId: 'SOURCE-1',
      isCorrectBranchOrLocation: 'No',
      organisationCount: '2',
      businessOrTradingName: 'Trading',
      branchOrLocationName: 'Branch',
      name: 'National Measurement Institute',
      abn: '12345678901',
      currentContact: {
        title: 'Dr',
        firstName: 'Alex',
        lastName: 'Tester',
        email: 'alex@example.test',
      },
      measurementCategory: 'measurement-1',
    };
    mocks.getLookup
      .mockResolvedValueOnce([
        { id: 'measurement-1', label: 'Mass' },
        { id: 'no-measurement', label: 'No measurement' },
      ])
      .mockResolvedValueOnce([
        { id: 'artefact-1', parentId: 'measurement-1', label: 'Balance' },
        {
          id: 'no-instrument',
          parentId: 'no-measurement',
          label: 'No instrument',
        },
      ]);
    mocks.getReportRecipient.mockResolvedValue({
      reportAddressType: 'BusinessAddress',
      acceptQuotePreInfo: basePreInfo,
      rfqOrganisation: {
        streetAddress,
        postalAddressSameAsStreetAddress: true,
        postalAddress: {
          line1: 'PO Box 1',
          suburb: 'Canberra',
          state: 'ACT',
          postcode: '2601',
        },
      },
    });
    mocks.getDeliveryAndReturn.mockResolvedValue({
      acceptQuotePreInfo: basePreInfo,
      rfqOrganisation: {
        streetAddress,
        postalAddressSameAsStreetAddress: false,
        postalAddress: {
          line1: 'PO Box 1',
          suburb: 'Canberra',
          state: 'ACT',
          postcode: '2601',
        },
      },
    });
    mocks.getPaymentDetails.mockResolvedValue({
      acceptQuotePreInfo: { ...basePreInfo, paymentTerms: 'Prepaid' },
    });
    mocks.getSummaryAndAccept.mockResolvedValue({
      acceptQuotePreInfo: basePreInfo,
      requestForQuote: {
        contact: {
          firstName: 'Request',
          lastName: 'Owner',
          role: 'Manager',
          phone: '02 1111 1111',
          email: 'request@example.test',
        },
      },
      rfqOrganisation: {
        businessOrTradingName: 'Trading',
        branchOrLocationName: 'Branch',
        name: 'National Measurement Institute',
        abn: '12345678901',
        streetAddress,
      },
    });
    mocks.getQuoteOfferPDFByQuoteID.mockResolvedValue({
      fileData: btoa('pdf-data'),
      mimeType: 'application/pdf',
      filename: 'quote.pdf',
    });
  });

  it('renders request-for-quote organisation/contact inputs and opens the branch selector', async () => {
    const OrganisationAndContact = (
      await import('../../../ClientApp/src/routes/requestForQuote/organisationAndContact')
    ).default;

    renderRoute(
      '/request-for-quote/RFQ-1/organisation-and-contact',
      <OrganisationAndContact />,
      '/request-for-quote/:id/*'
    );

    expect(screen.getByText('Organisation details')).toBeInTheDocument();
    expect(
      screen.getByText(/This "Recalibration Request" is prefilled/)
    ).toBeInTheDocument();
    fireEvent.click(screen.getByTestId('open-manage-branch-division-button'));

    expect(mocks.setShowRFQSelectModal).toHaveBeenCalledWith(
      true,
      'RFQ-1',
      '/request-for-quote/RFQ-1/organisation-and-contact'
    );
  }, 30_000);

  it('disables the branch selector until the branch answer is No', async () => {
    mocks.formikValues['isCorrectBranchOrLocation'] = undefined;
    const OrganisationAndContact = (
      await import('../../../ClientApp/src/routes/requestForQuote/organisationAndContact')
    ).default;

    renderRoute(
      '/request-for-quote/RFQ-1/organisation-and-contact',
      <OrganisationAndContact />,
      '/request-for-quote/:id/*'
    );

    expect(
      screen.getByTestId('open-manage-branch-division-button')
    ).toBeDisabled();
  }, 30_000);

  it('opens the branch selector with an empty request id when the route id is omitted', async () => {
    const OrganisationAndContact = (
      await import('../../../ClientApp/src/routes/requestForQuote/organisationAndContact')
    ).default;

    renderRoute(
      '/organisation-and-contact',
      <OrganisationAndContact />,
      '/organisation-and-contact'
    );
    fireEvent.click(screen.getByTestId('open-manage-branch-division-button'));

    expect(mocks.setShowRFQSelectModal).toHaveBeenCalledWith(
      true,
      '',
      '/organisation-and-contact'
    );
  });

  it('renders request-for-quote instrument/request inputs and dependent lookup options', async () => {
    const InstrumentAndRequest = (
      await import('../../../ClientApp/src/routes/requestForQuote/instrumentAndRequest')
    ).default;

    renderRoute(
      '/request-for-quote/RFQ-1/instrument-and-request',
      <InstrumentAndRequest />,
      '/request-for-quote/:id/*'
    );

    await waitFor(() =>
      expect(
        screen.getByText('Instrument/artefact details')
      ).toBeInTheDocument()
    );
    expect(
      screen.getByText('Testing/calibration requirements')
    ).toBeInTheDocument();

    await act(async () => {
      triggerInputChange('measurementCategory', 'no-measurement');
    });

    await waitFor(() =>
      expect(mocks.setFieldValue).toHaveBeenCalledWith(
        'instrumentOrArtefactType',
        'no-instrument'
      )
    );
    expect(mocks.setFieldValue).toHaveBeenCalledWith(
      'instrumentOrArtefactType',
      ''
    );
    expect(mocks.setFieldTouched).toHaveBeenCalledWith(
      'instrumentOrArtefactType',
      false
    );
    expect(
      screen.getByTestId('select-instrumentOrArtefactType')
    ).toHaveAttribute('data-readonly', 'true');
  });

  it('keeps request-for-quote summary edit links available for both editable sections', async () => {
    const RequestForQuoteSummary = (
      await import('../../../ClientApp/src/routes/requestForQuote/requestForQuoteSummary')
    ).default;

    renderRoute(
      '/request-for-quote/RFQ-1/summary',
      <RequestForQuoteSummary name='' />,
      '/request-for-quote/:id/*'
    );

    const editLinks = screen.getAllByTestId('edit-button');
    expect(editLinks.map((link) => link.getAttribute('href'))).toEqual([
      '/request-for-quote/RFQ-1/organisation-and-contact',
      '/request-for-quote/RFQ-1/instrument-and-request',
    ]);
  });

  it('initially disables instrument type for the no-measurement category', async () => {
    mocks.formikValues['measurementCategory'] = 'no-measurement';
    const InstrumentAndRequest = (
      await import('../../../ClientApp/src/routes/requestForQuote/instrumentAndRequest')
    ).default;

    renderRoute(
      '/request-for-quote/RFQ-1/instrument-and-request',
      <InstrumentAndRequest />,
      '/request-for-quote/:id/*'
    );

    await waitFor(() =>
      expect(
        screen.getByTestId('select-instrumentOrArtefactType')
      ).toHaveAttribute('data-readonly', 'true')
    );
  });

  it('uses an empty artefact option list when the initial measurement category is unavailable', async () => {
    mocks.formikValues['measurementCategory'] = undefined;
    const InstrumentAndRequest = (
      await import('../../../ClientApp/src/routes/requestForQuote/instrumentAndRequest')
    ).default;

    renderRoute(
      '/request-for-quote/RFQ-1/instrument-and-request',
      <InstrumentAndRequest />,
      '/request-for-quote/:id/*'
    );

    await waitFor(() =>
      expect(
        screen.getByText('Instrument/artefact details')
      ).toBeInTheDocument()
    );
    expect(
      screen.getByTestId('select-instrumentOrArtefactType')
    ).toBeInTheDocument();
  });

  it('normalises missing lookup labels and ids and handles a regular category change', async () => {
    mocks.getLookup.mockReset();
    mocks.getLookup
      .mockResolvedValueOnce([
        { id: 'measurement-1', label: 'Mass' },
        { id: 'no-measurement', label: 'No measurement' },
      ])
      .mockResolvedValueOnce([
        { id: undefined, parentId: 'measurement-1', label: undefined },
        {
          id: 'no-instrument',
          parentId: 'no-measurement',
          label: 'No instrument',
        },
      ]);
    const InstrumentAndRequest = (
      await import('../../../ClientApp/src/routes/requestForQuote/instrumentAndRequest')
    ).default;

    renderRoute(
      '/request-for-quote/RFQ-1/instrument-and-request',
      <InstrumentAndRequest />,
      '/request-for-quote/:id/*'
    );

    await waitFor(() =>
      expect(
        screen.getByText('Instrument/artefact details')
      ).toBeInTheDocument()
    );
    await act(async () => {
      triggerInputChange('measurementCategory', 'measurement-1');
    });

    expect(mocks.setFieldValue).toHaveBeenCalledWith(
      'instrumentOrArtefactType',
      ''
    );
    expect(mocks.setFieldValue).not.toHaveBeenCalledWith(
      'instrumentOrArtefactType',
      'no-instrument'
    );
  });

  it('handles empty and null measurement category changes', async () => {
    const InstrumentAndRequest = (
      await import('../../../ClientApp/src/routes/requestForQuote/instrumentAndRequest')
    ).default;
    renderRoute(
      '/request-for-quote/RFQ-1/instrument-and-request',
      <InstrumentAndRequest />,
      '/request-for-quote/:id/*'
    );

    await waitFor(() =>
      expect(
        screen.getByText('Instrument/artefact details')
      ).toBeInTheDocument()
    );
    await act(async () => {
      triggerInputChange('measurementCategory', '');
      triggerInputChange('measurementCategory', null);
    });

    expect(mocks.setFieldValue).toHaveBeenCalledWith(
      'instrumentOrArtefactType',
      ''
    );
  });

  it('keeps instrument lookups loading when no MSAL account is available', async () => {
    mocks.msalAccounts.length = 0;
    const InstrumentAndRequest = (
      await import('../../../ClientApp/src/routes/requestForQuote/instrumentAndRequest')
    ).default;

    renderRoute(
      '/request-for-quote/RFQ-1/instrument-and-request',
      <InstrumentAndRequest />,
      '/request-for-quote/:id/*'
    );

    expect(screen.getByTestId('block-spinner')).toHaveTextContent('Loading...');
    expect(mocks.getLookup).not.toHaveBeenCalled();
  });

  it('renders request-for-quote summary edit and submitted states', async () => {
    const RequestForQuoteSummary = (
      await import('../../../ClientApp/src/routes/requestForQuote/requestForQuoteSummary')
    ).default;

    const { unmount } = renderRoute(
      '/request-for-quote/RFQ-1/summary',
      <RequestForQuoteSummary />,
      '/request-for-quote/:id/*'
    );

    expect(screen.getByTestId('header-intro')).toBeInTheDocument();
    expect(screen.getAllByTestId('edit-button')).toHaveLength(2);
    await screen.findByText('Request details');
    unmount();

    renderRoute(
      '/request-for-quote/RFQ-1/summary',
      <RequestForQuoteSummary isSubmitted />,
      '/request-for-quote/:id/*'
    );

    expect(screen.queryByTestId('header-intro')).not.toBeInTheDocument();
    expect(screen.getByTestId('back-button')).toHaveAttribute(
      'href',
      '/dashboard'
    );
    await screen.findByText('Request details');
  });

  it('renders report recipient edit and summary address branches', async () => {
    const ReportRecipient = (
      await import('../../../ClientApp/src/routes/acceptQuote/reportRecipient')
    ).default;
    const { unmount } = renderRoute(
      '/accept-quote/AQ-1/report-recipient',
      <ReportRecipient id='AQ-1' name='' />,
      '/accept-quote/:id/*'
    );

    await waitFor(() =>
      expect(
        screen.getByText('Report recipient organisation')
      ).toBeInTheDocument()
    );
    expect(
      screen.getByText('Organisation address for report')
    ).toBeInTheDocument();
    expect(screen.getByTestId('address-lookup')).toHaveAttribute(
      'data-name',
      'businessStreetAddress'
    );
    unmount();

    mocks.getReportRecipient.mockResolvedValueOnce({
      reportAddressType: 'Other',
      rfqOrganisation: {
        streetAddress,
        postalAddressSameAsStreetAddress: true,
      },
    });
    renderRoute(
      '/accept-quote/AQ-1/report-recipient',
      <ReportRecipient id='AQ-1' name='reportRecipient' isSummary />,
      '/accept-quote/:id/*'
    );

    await waitFor(() =>
      expect(screen.getByTestId('address-lookup')).toHaveAttribute(
        'data-name',
        'reportRecipient.businessStreetAddress'
      )
    );
  });

  it('renders delivery/return editable, no-delivery, and summary branches', async () => {
    const DeliveryAndReturn = (
      await import('../../../ClientApp/src/routes/acceptQuote/deliveryAndReturn')
    ).default;
    const { unmount } = renderRoute(
      '/accept-quote/AQ-1/delivery-and-return',
      <DeliveryAndReturn id='AQ-1' name='' />,
      '/accept-quote/:id/*'
    );

    await waitFor(() =>
      expect(
        screen.getByText('Instrument/artefact delivery')
      ).toBeInTheDocument()
    );
    expect(screen.getByTestId('mailing-label')).toHaveTextContent('Q-100');
    expect(screen.getByTestId('delivery-instructions')).toHaveTextContent(
      'Use the loading dock.'
    );
    unmount();

    mocks.getDeliveryAndReturn.mockResolvedValueOnce({
      acceptQuotePreInfo: { receiptAndDispatchNA: true },
    });
    renderRoute(
      '/accept-quote/AQ-1/delivery-and-return',
      <DeliveryAndReturn id='AQ-1' name='deliveryAndReturn' isSummary />,
      '/accept-quote/:id/*'
    );

    await waitFor(() =>
      expect(
        screen.getByText(/does not require the delivery or return/)
      ).toBeInTheDocument()
    );
  });

  it('renders the editable no-delivery information variant', async () => {
    mocks.getDeliveryAndReturn.mockResolvedValueOnce({
      acceptQuotePreInfo: { receiptAndDispatchNA: true },
    });
    const DeliveryAndReturn = (
      await import('../../../ClientApp/src/routes/acceptQuote/deliveryAndReturn')
    ).default;

    renderRoute(
      '/accept-quote/AQ-1/delivery-and-return',
      <DeliveryAndReturn id='AQ-1' name='' />,
      '/accept-quote/:id/*'
    );

    await waitFor(() =>
      expect(
        screen.getByText(/does not require the delivery or return/)
      ).toBeInTheDocument()
    );
    expect(screen.getByRole('status')).toHaveClass('alert-info');
  });

  it.each([
    ['BusinessAddress', '1 National Circuit'],
    ['PostalAddress', 'PO Box 1'],
    ['Other', '9 Return Road'],
  ])(
    'renders the %s return address summary',
    async (returnAddressType, expectedAddress) => {
      mocks.getDeliveryAndReturn.mockResolvedValueOnce({
        returnAddressType,
        returnAddress: {
          line1: '9 Return Road',
          suburb: 'Canberra',
          state: 'ACT',
          postcode: '2602',
        },
        rfqOrganisation: {
          streetAddress,
          postalAddressSameAsStreetAddress: false,
          postalAddress: {
            line1: 'PO Box 1',
            suburb: 'Canberra',
            state: 'ACT',
            postcode: '2601',
          },
        },
      });
      const DeliveryAndReturn = (
        await import('../../../ClientApp/src/routes/acceptQuote/deliveryAndReturn')
      ).default;

      renderRoute(
        '/accept-quote/AQ-1/delivery-and-return',
        <DeliveryAndReturn id='AQ-1' name='deliveryAndReturn' isSummary />,
        '/accept-quote/:id/*'
      );

      await waitFor(() =>
        expect(
          screen.getByText(expectedAddress, { exact: false })
        ).toBeInTheDocument()
      );
    }
  );

  it('renders a return organisation name in the delivery summary', async () => {
    mocks.getDeliveryAndReturn.mockResolvedValueOnce({
      returnAddressType: 'BusinessAddress',
      returnOrganisationName: 'Return Organisation',
      rfqOrganisation: { streetAddress },
    });
    const DeliveryAndReturn = (
      await import('../../../ClientApp/src/routes/acceptQuote/deliveryAndReturn')
    ).default;

    renderRoute(
      '/accept-quote/AQ-1/delivery-and-return',
      <DeliveryAndReturn id='AQ-1' name='deliveryAndReturn' isSummary />,
      '/accept-quote/:id/*'
    );

    await waitFor(() =>
      expect(screen.getByText('Return Organisation')).toBeInTheDocument()
    );
  });

  it('logs delivery and lookup load failures', async () => {
    mocks.getDeliveryAndReturn.mockRejectedValueOnce(
      new Error('delivery failed')
    );
    const DeliveryAndReturn = (
      await import('../../../ClientApp/src/routes/acceptQuote/deliveryAndReturn')
    ).default;
    const { unmount } = renderRoute(
      '/accept-quote/AQ-1/delivery-and-return',
      <DeliveryAndReturn id='AQ-1' name='' />,
      '/accept-quote/:id/*'
    );

    await waitFor(() =>
      expect(mocks.appLoggerError).toHaveBeenCalledWith(
        'Failed to load AcceptQuotePreInfo',
        expect.any(Error),
        { Id: 'AQ-1' }
      )
    );
    unmount();

    mocks.getLookup.mockReset();
    mocks.getLookup.mockRejectedValueOnce(new Error('lookup failed'));
    const InstrumentAndRequest = (
      await import('../../../ClientApp/src/routes/requestForQuote/instrumentAndRequest')
    ).default;
    renderRoute(
      '/request-for-quote/RFQ-1/instrument-and-request',
      <InstrumentAndRequest />,
      '/request-for-quote/:id/*'
    );

    await waitFor(() =>
      expect(mocks.appLoggerError).toHaveBeenCalledWith(
        'Failed to retrieve look ups',
        expect.any(Error)
      )
    );
  });

  it('renders payment details prepaid, postpaid, and summary contact sections', async () => {
    const PaymentDetails = (
      await import('../../../ClientApp/src/routes/acceptQuote/paymentDetails')
    ).default;
    const { unmount } = renderRoute(
      '/accept-quote/AQ-1/payment-details',
      <PaymentDetails id='AQ-1' name='' />,
      '/accept-quote/:id/*'
    );

    await waitFor(() =>
      expect(screen.getByText(/Prepayment required/)).toBeInTheDocument()
    );
    expect(
      screen.getByText('Purchase Order (PO) number (optional)')
    ).toBeInTheDocument();
    unmount();

    mocks.getPaymentDetails.mockResolvedValueOnce({
      acceptQuotePreInfo: { ...basePreInfo, paymentTerms: 'Postpaid' },
    });
    renderRoute(
      '/accept-quote/AQ-1/payment-details',
      <PaymentDetails id='AQ-1' name='paymentDetails' isSummary />,
      '/accept-quote/:id/*'
    );

    await waitFor(() =>
      expect(screen.getAllByText('Invoice contact person')).toHaveLength(2)
    );
    expect(screen.queryByTestId('info-summary')).not.toBeInTheDocument();
  });

  it('logs payment and report recipient load failures', async () => {
    mocks.getPaymentDetails.mockRejectedValueOnce(new Error('payment failed'));
    const PaymentDetails = (
      await import('../../../ClientApp/src/routes/acceptQuote/paymentDetails')
    ).default;
    const { unmount } = renderRoute(
      '/accept-quote/AQ-1/payment-details',
      <PaymentDetails id='AQ-1' name='' />,
      '/accept-quote/:id/*'
    );

    await waitFor(() =>
      expect(mocks.appLoggerError).toHaveBeenCalledWith(
        'Failed to load Payment details',
        expect.any(Error),
        { Id: 'AQ-1' }
      )
    );
    unmount();

    mocks.getReportRecipient.mockRejectedValueOnce(
      new Error('recipient failed')
    );
    const ReportRecipient = (
      await import('../../../ClientApp/src/routes/acceptQuote/reportRecipient')
    ).default;
    renderRoute(
      '/accept-quote/AQ-2/report-recipient',
      <ReportRecipient id='AQ-2' name='' />,
      '/accept-quote/:id/*'
    );

    await waitFor(() =>
      expect(mocks.appLoggerError).toHaveBeenCalledWith(
        'Failed to load AcceptQuotePreInfo',
        expect.any(Error),
        { Id: 'AQ-2' }
      )
    );
  });

  it('uses separate postal address details for report recipients', async () => {
    mocks.getReportRecipient.mockResolvedValueOnce({
      reportAddressType: 'PostalAddress',
      rfqOrganisation: {
        streetAddress,
        postalAddressSameAsStreetAddress: false,
        postalAddress: {
          line1: 'PO Box 44',
          suburb: 'Canberra',
          state: 'ACT',
          postcode: '2601',
        },
      },
    });
    const ReportRecipient = (
      await import('../../../ClientApp/src/routes/acceptQuote/reportRecipient')
    ).default;

    renderRoute(
      '/accept-quote/AQ-1/report-recipient',
      <ReportRecipient id='AQ-1' name='reportRecipient' isSummary />,
      '/accept-quote/:id/*'
    );

    await waitFor(() =>
      expect(screen.getByText(/PO Box 44/)).toBeInTheDocument()
    );
  });

  it('uses the street address as the delivery postal address when configured', async () => {
    mocks.getDeliveryAndReturn.mockResolvedValueOnce({
      returnAddressType: 'PostalAddress',
      rfqOrganisation: {
        streetAddress,
        postalAddressSameAsStreetAddress: true,
      },
    });
    const DeliveryAndReturn = (
      await import('../../../ClientApp/src/routes/acceptQuote/deliveryAndReturn')
    ).default;

    renderRoute(
      '/accept-quote/AQ-1/delivery-and-return',
      <DeliveryAndReturn id='AQ-1' name='deliveryAndReturn' isSummary />,
      '/accept-quote/:id/*'
    );

    await waitFor(() =>
      expect(screen.getByText(/1 National Circuit/)).toBeInTheDocument()
    );
  });

  it('renders summary-and-accept content and downloads quote terms', async () => {
    mocks.dashboardNotification = { message: 'Saved draft', severity: 'info' };
    const SummaryAndAccept = (
      await import('../../../ClientApp/src/routes/acceptQuote/summaryAndAccept')
    ).default;

    renderRoute(
      '/accept-quote/AQ-1/summary-and-accept',
      <SummaryAndAccept id='AQ-1' name='' cRMQuoteRequestId='CRM-1' />,
      '/accept-quote/:id/*'
    );

    await waitFor(() =>
      expect(
        screen.getByText('Quotation terms and conditions')
      ).toBeInTheDocument()
    );
    expect(screen.getByText('Saved draft')).toBeInTheDocument();
    expect(screen.getByText('Alex Tester')).toBeInTheDocument();
    expect(screen.getByText('Request Owner')).toBeInTheDocument();

    const [termsButton] = screen.getAllByRole('button', { name: /Terms/i });
    if (!termsButton) throw new Error('expected a Terms button to be rendered');
    fireEvent.click(termsButton);

    await waitFor(() =>
      expect(mocks.getQuoteOfferPDFByQuoteID).toHaveBeenCalledWith(
        'CRM-Q-100',
        true
      )
    );
    expect(mocks.openPdfPageInNewTab).toHaveBeenCalledWith(
      expect.stringContaining('blob:'),
      '2'
    );
  });

  it('sets the dashboard notification when quote terms download fails and renders submitted action', async () => {
    mocks.getQuoteOfferPDFByQuoteID.mockRejectedValueOnce(
      new Error('download failed')
    );
    const SummaryAndAccept = (
      await import('../../../ClientApp/src/routes/acceptQuote/summaryAndAccept')
    ).default;

    renderRoute(
      '/accept-quote/AQ-2/summary-and-accept',
      <SummaryAndAccept
        id='AQ-2'
        name=''
        isSubmitted
        cRMQuoteRequestId='CRM-2'
      />,
      '/accept-quote/:id/*'
    );

    await waitFor(() =>
      expect(screen.getByTestId('back-button')).toHaveAttribute(
        'href',
        '/submitted-success/AQ-2'
      )
    );
    const [termsButton] = screen.getAllByRole('button', { name: /Terms/i });
    if (!termsButton) throw new Error('expected a Terms button to be rendered');
    fireEvent.click(termsButton);

    await waitFor(() =>
      expect(mocks.setDashboardNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          severity: 'error',
        })
      )
    );
  });

  it('downloads terms from the acceptance link', async () => {
    const SummaryAndAccept = (
      await import('../../../ClientApp/src/routes/acceptQuote/summaryAndAccept')
    ).default;
    renderRoute(
      '/accept-quote/AQ-1/summary-and-accept',
      <SummaryAndAccept id='AQ-1' name='' cRMQuoteRequestId='CRM-1' />,
      '/accept-quote/:id/*'
    );

    await waitFor(() =>
      expect(screen.getAllByRole('button', { name: /terms/i })).toHaveLength(2)
    );
    const secondTermsButton = screen.getAllByRole('button', {
      name: /terms/i,
    })[1];
    if (!secondTermsButton) {
      throw new Error('expected a second Terms button to be rendered');
    }
    fireEvent.click(secondTermsButton);

    await waitFor(() =>
      expect(mocks.getQuoteOfferPDFByQuoteID).toHaveBeenCalled()
    );
  });

  it('does not open incomplete quote terms and renders sparse organisation alternatives', async () => {
    mocks.getQuoteOfferPDFByQuoteID.mockResolvedValueOnce({
      fileData: 'pdf-data',
      mimeType: undefined,
      filename: 'quote.pdf',
    });
    mocks.getSummaryAndAccept.mockResolvedValueOnce({
      acceptQuotePreInfo: basePreInfo,
      rfqOrganisation: {
        businessOrTradingName: 'Trading only',
        branchOrLocationName: undefined,
        streetAddress: {
          line1: '1 National Circuit',
          line2: 'Level 2',
          line3: 'Building A',
          suburb: 'Canberra',
          state: 'ACT',
          postcode: '2600',
        },
      },
    });
    const SummaryAndAccept = (
      await import('../../../ClientApp/src/routes/acceptQuote/summaryAndAccept')
    ).default;

    const { unmount } = renderRoute(
      '/accept-quote/AQ-1/summary-and-accept',
      <SummaryAndAccept id='AQ-1' name='' cRMQuoteRequestId='CRM-1' />,
      '/accept-quote/:id/*'
    );

    await waitFor(() =>
      expect(screen.getByText('Trading only')).toBeInTheDocument()
    );
    expect(screen.getByText('Level 2')).toBeInTheDocument();
    expect(screen.getByText('Building A')).toBeInTheDocument();
    const [termsButton] = screen.getAllByRole('button', { name: /Terms/i });
    if (!termsButton) throw new Error('expected a Terms button to be rendered');
    fireEvent.click(termsButton);
    await waitFor(() =>
      expect(mocks.getQuoteOfferPDFByQuoteID).toHaveBeenCalled()
    );
    expect(mocks.openPdfPageInNewTab).not.toHaveBeenCalled();
    unmount();

    mocks.getSummaryAndAccept.mockResolvedValueOnce({
      acceptQuotePreInfo: basePreInfo,
      rfqOrganisation: {
        businessOrTradingName: undefined,
        branchOrLocationName: 'Branch only',
      },
    });
    renderRoute(
      '/accept-quote/AQ-2/summary-and-accept',
      <SummaryAndAccept id='AQ-2' name='' cRMQuoteRequestId='CRM-2' />,
      '/accept-quote/:id/*'
    );

    await waitFor(() =>
      expect(screen.getByText('Branch only')).toBeInTheDocument()
    );
  });

  it('logs summary-and-accept load failures', async () => {
    mocks.getSummaryAndAccept.mockRejectedValueOnce(
      new Error('summary failed')
    );
    const SummaryAndAccept = (
      await import('../../../ClientApp/src/routes/acceptQuote/summaryAndAccept')
    ).default;

    renderRoute(
      '/accept-quote/AQ-1/summary-and-accept',
      <SummaryAndAccept id='AQ-1' name='' cRMQuoteRequestId='CRM-1' />,
      '/accept-quote/:id/*'
    );

    await waitFor(() =>
      expect(mocks.appLoggerError).toHaveBeenCalledWith(
        'Failed to retrieve getAcceptQuotePreInfo',
        expect.any(Error),
        { Id: 'AQ-1' }
      )
    );
  });
});
