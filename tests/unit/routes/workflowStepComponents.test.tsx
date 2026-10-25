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
    expect.assertions(3);
    const OrganisationAndContact = (
      await import('../../../ClientApp/src/routes/requestForQuote/organisationAndContact')
    ).default;

    renderRoute(
      '/request-for-quote/RFQ-1/organisation-and-contact',
      <OrganisationAndContact />,
      '/request-for-quote/:id/*',
    );

    expect(screen.getByText('Organisation details')).toBeInTheDocument();
    expect(
      screen.getByText(/This "Recalibration Request" is prefilled/),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('open-manage-branch-division-button'));

    expect(mocks.setShowRFQSelectModal).toHaveBeenCalledWith(
      true,
      'RFQ-1',
      '/request-for-quote/RFQ-1/organisation-and-contact',
    );
  }, 30_000);
});

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
  it('disables the branch selector until the branch answer is No', async () => {
    expect.assertions(1);
    mocks.formikValues['isCorrectBranchOrLocation'] = undefined;
    const OrganisationAndContact = (
      await import('../../../ClientApp/src/routes/requestForQuote/organisationAndContact')
    ).default;

    renderRoute(
      '/request-for-quote/RFQ-1/organisation-and-contact',
      <OrganisationAndContact />,
      '/request-for-quote/:id/*',
    );

    expect(
      screen.getByTestId('open-manage-branch-division-button'),
    ).toBeDisabled();
  }, 30_000);
});

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
  it('opens the branch selector with an empty request id when the route id is omitted', async () => {
    expect.assertions(1);
    const OrganisationAndContact = (
      await import('../../../ClientApp/src/routes/requestForQuote/organisationAndContact')
    ).default;

    renderRoute(
      '/organisation-and-contact',
      <OrganisationAndContact />,
      '/organisation-and-contact',
    );
    fireEvent.click(screen.getByTestId('open-manage-branch-division-button'));

    expect(mocks.setShowRFQSelectModal).toHaveBeenCalledWith(
      true,
      '',
      '/organisation-and-contact',
    );
  });
});
