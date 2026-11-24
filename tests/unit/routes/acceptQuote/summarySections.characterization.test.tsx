import { render, screen, waitFor } from '@testing-library/react';
import RhfForm from '@/components/forms/RhfForm';
import { MemoryRouter, Route, Routes } from 'react-router';
import { describe, expect, it, vi } from 'vitest';
import type * as WebApiClientModule from '@/api/web-api-client';
import {
  InvoiceSentToValues,
  ReportAddressTypeValues,
  ReturnAddressTypeValues,
  ReturnContactTypeValues,
  ReturnMethodValues,
  Title,
  YesNo,
  type SummaryAndAcceptStep,
} from '@/api/web-api-client';
import SummaryAndAccept from '@/routes/acceptQuote/summaryAndAccept';
import summaryAndAcceptProps from '@/routes/acceptQuote/summaryAndAcceptProps';

/**
 * Characterisation of the three read-only sections of the accept-quote
 * summary page (report recipient, delivery and return, payment details).
 *
 * The expected text was captured from the Formik-backed summary components
 * and is the parity contract for the form-free replacements: the text each
 * section shows must not change when the sections stop reading Formik.
 */

const mocks = vi.hoisted(() => {
  const acquireTokenSilent = vi
    .fn<(...args: unknown[]) => unknown>()
    .mockResolvedValue({ accessToken: 'mock-token' });
  return {
    acquireTokenSilent,
    getSummaryAndAccept: vi.fn<(...args: unknown[]) => unknown>(),
    getReportRecipient: vi.fn<(...args: unknown[]) => unknown>(),
    getDeliveryAndReturn: vi.fn<(...args: unknown[]) => unknown>(),
    getPaymentDetails: vi.fn<(...args: unknown[]) => unknown>(),
    accounts: [{ homeAccountId: 'mock-id' }],
    instance: { acquireTokenSilent },
  };
});

vi.mock(
  '@azure/msal-react',
  () =>
    ({
      useMsal: () => ({
        instance: mocks.instance,
        accounts: mocks.accounts,
        inProgress: 'none',
      }),
      useAccount: () => ({ homeAccountId: 'mock-id' }),
    }) satisfies __ExactMockModule<__TestMockModule2>,
);

vi.mock(
  '@/authentication/hooks',
  () =>
    ({
      useAccountState: () => ({
        isLoading: false,
        details: {
          givenName: 'Taylor',
          familyName: 'Nguyen',
          homeAccountId: 'mock-id',
        },
      }),
    }) satisfies __ExactMockModule<__TestMockModule26>,
);

vi.mock('@/api/web-api-client', async (importOriginal) => {
  const actual = await importOriginal<typeof WebApiClientModule>();
  return {
    ...actual,
    AcceptQuoteClient: class {
      setAuthToken = vi.fn<(...args: unknown[]) => unknown>();
      getSummaryAndAccept = mocks.getSummaryAndAccept;
      getReportRecipient = mocks.getReportRecipient;
      getDeliveryAndReturn = mocks.getDeliveryAndReturn;
      getPaymentDetails = mocks.getPaymentDetails;
    },
    DashboardClient: class {
      setAuthToken = vi.fn<(...args: unknown[]) => unknown>();
    },
  } satisfies __ExactMockModule<__TestMockModule4>;
});

vi.mock(
  '@/instrumentation/AppLogger',
  () =>
    ({
      default: {
        verbose: vi.fn<(...args: unknown[]) => unknown>(),
        error: vi.fn<(...args: unknown[]) => unknown>(),
      },
    }) satisfies __ExactMockModule<__TestMockModule5>,
);

vi.mock(
  import('@/routes/acceptQuote/quotationSummary'),
  () =>
    ({
      default: () => <div>Quotation summary marker</div>,
    }) satisfies __ExactMockModule<__TestMockModule73>,
);

const streetAddress = {
  line1: '10 Park St',
  suburb: 'Sydney',
  state: 'NSW',
  postcode: '2000',
};
const postalAddress = {
  line1: '20 Postal Ave',
  suburb: 'Melbourne',
  state: 'VIC',
  postcode: '3000',
};
const otherAddress = {
  line1: '30 Other Rd',
  suburb: 'Brisbane',
  state: 'QLD',
  postcode: '4000',
};

const acceptQuotePreInfo = {
  receiptAndDispatchNA: false,
  quotationIdNum: 'Q-2024-001',
};

const requestContact = {
  title: Title.Dr,
  firstName: 'Riley',
  lastName: 'Chen',
  role: 'Metrologist',
  phone: '0291234567',
  mobile: '0412345678',
  email: 'riley@example.com',
};

const otherContact = {
  title: Title.Other,
  titleOther: 'Captain',
  firstName: 'Sam',
  lastName: 'Okafor',
  role: '',
  phone: '',
  mobile: '0400111222',
  email: 'sam@example.com',
};

interface Scenario {
  values: SummaryAndAcceptStep;
  reportRecipient: object;
  deliveryAndReturn: object;
  paymentDetails: object;
}

const hidingFields = summaryAndAcceptProps(
  'quote-1',
  [],
  {} as never,
  {} as never,
  [],
  'Banner',
).hidingFields as never;

const textOf = (id: string) => {
  const section = document.querySelector(`#${id}`);
  // Collapse whitespace so the contract does not depend on JSX line breaks.
  return (section?.textContent ?? '').replaceAll(/\s+/g, ' ').trim();
};

const renderSummary = async (scenario: Scenario) => {
  mocks.getSummaryAndAccept.mockResolvedValue({ acceptQuotePreInfo });
  mocks.getReportRecipient.mockResolvedValue(scenario.reportRecipient);
  mocks.getDeliveryAndReturn.mockResolvedValue(scenario.deliveryAndReturn);
  mocks.getPaymentDetails.mockResolvedValue(scenario.paymentDetails);

  type Values = SummaryAndAcceptStep & Record<string, any>;
  const handleSubmit = (_values: Values) => undefined;

  render(
    <MemoryRouter initialEntries={['/summary/quote-1']}>
      <Routes>
        <Route
          path='/summary/:id'
          element={
            <RhfForm<Values>
              initialValues={scenario.values as Values}
              hidingFields={hidingFields}
              onSubmit={handleSubmit}
              onSaveAndExit={handleSubmit}
            >
              {({ onFormSubmit }) => (
                <form noValidate onSubmit={onFormSubmit}>
                  <SummaryAndAccept
                    cRMQuoteRequestId='crm-1'
                    summaryHidden={hidingFields}
                  />
                </form>
              )}
            </RhfForm>
          }
        />
      </Routes>
    </MemoryRouter>,
  );

  // The step sections load their own data; wait for the slowest one.
  await waitFor(() => {
    expect(mocks.getPaymentDetails).toHaveBeenCalledWith('quote-1');
    expect(mocks.getDeliveryAndReturn).toHaveBeenCalledWith('quote-1');
    expect(mocks.getReportRecipient).toHaveBeenCalledWith('quote-1');
  });
  await screen.findByText('Quotation summary marker');
  // Each section clears its spinner once its own data has settled.
  await waitFor(() => {
    expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
  });
};

describe('accept-quote summary sections (characterisation)', () => {
  describe('report recipient', () => {
    it('shows the organisation name and the custom address for Other', async () => {
      expect.hasAssertions();

      await renderSummary({
        values: {
          reportRecipient: {
            organisationName: 'Acme Labs',
            reportAddressType: ReportAddressTypeValues.Other,
            businessStreetAddress: otherAddress,
          },
        } as SummaryAndAcceptStep,
        reportRecipient: {
          reportAddressType: ReportAddressTypeValues.Other,
          rfqOrganisation: { streetAddress, postalAddress },
        },
        deliveryAndReturn: { acceptQuotePreInfo },
        paymentDetails: { acceptQuotePreInfo },
      });

      await waitFor(() => {
        expect(textOf('reportRecipient')).toContain('30 Other Rd');
      });

      expect(textOf('reportRecipient')).toBe(
        'Report recipientReport recipient organisationOrganisation name for reportAcme LabsOrganisation address for report30 Other Rd, Brisbane QLD 4000Edit',
      );
    });

    it('shows the business street address for BusinessAddress', async () => {
      expect.hasAssertions();

      await renderSummary({
        values: {
          reportRecipient: { organisationName: 'Acme Labs' },
        },
        reportRecipient: {
          reportAddressType: ReportAddressTypeValues.BusinessAddress,
          rfqOrganisation: { streetAddress, postalAddress },
        },
        deliveryAndReturn: { acceptQuotePreInfo },
        paymentDetails: { acceptQuotePreInfo },
      });

      await waitFor(() => {
        expect(textOf('reportRecipient')).toContain('10 Park St');
      });

      expect(textOf('reportRecipient')).toBe(
        'Report recipientReport recipient organisationOrganisation name for reportAcme LabsOrganisation address for report10 Park St, Sydney NSW 2000Edit',
      );
    });

    it('shows the postal address for PostalAddress', async () => {
      expect.hasAssertions();

      await renderSummary({
        values: {
          reportRecipient: { organisationName: '' },
        },
        reportRecipient: {
          reportAddressType: ReportAddressTypeValues.PostalAddress,
          rfqOrganisation: {
            postalAddressSameAsStreetAddress: false,
            streetAddress,
            postalAddress,
          },
        },
        deliveryAndReturn: { acceptQuotePreInfo },
        paymentDetails: { acceptQuotePreInfo },
      });

      await waitFor(() => {
        expect(textOf('reportRecipient')).toContain('20 Postal Ave');
      });

      expect(textOf('reportRecipient')).toBe(
        'Report recipientReport recipient organisationOrganisation name for report- No details addedOrganisation address for report20 Postal Ave, Melbourne VIC 3000Edit',
      );
    });
  });

  describe('delivery and return', () => {
    const deliveryResponse = (returnAddressType: ReturnAddressTypeValues) => ({
      acceptQuotePreInfo,
      returnAddressType,
      returnOrganisationName: 'Return Org',
      returnAddress: otherAddress,
      rfqOrganisation: {
        postalAddressSameAsStreetAddress: false,
        streetAddress,
        postalAddress,
      },
    });

    it('shows the requesting contact when the main person receives the return', async () => {
      expect.hasAssertions();

      await renderSummary({
        values: {
          requestForQuote: { contact: requestContact },
          deliveryAndReturn: {
            returnContactType: ReturnContactTypeValues.SamePerson,
            returnMethod: ReturnMethodValues.ClientToArrange,
          },
        },
        reportRecipient: { rfqOrganisation: {} },
        deliveryAndReturn: deliveryResponse(
          ReturnAddressTypeValues.BusinessAddress,
        ),
        paymentDetails: { acceptQuotePreInfo },
      });

      await waitFor(() => {
        expect(textOf('deliveryAndReturn')).toContain('10 Park St');
      });

      expect(textOf('deliveryAndReturn')).toBe(
        'Instrument/artefact delivery and returnInstrument/artefact deliveryPlease deliver the instrument/artefact to NMI with the following label attachedDeliver to:Quotation ID: Q-2024-001ATTN: Print shipping address label Copyshipping address label to clipboardInstrument/artefact returnReturn contact personPlease select your contact person for the returned instrument/artefact when the job has completedThe main contact person for this requestReturn contact person detailsTitle (optional)DrFirst nameRileyLast nameChenRole (optional)MetrologistBusiness phone02 9123 45670 2 9 1 2 3 4 5 6 7Mobile phone0412 345 6780 4 1 2 3 4 5 6 7 8Email addressriley@example.comInstrument/artefact return addressReturn organisation name (optional)Return OrgReturn address10 Park St, Sydney NSW 2000Return methodChoose your return method for the instrument/artefactClient to arrange when completedEdit',
      );
    });

    it('shows a different contact, including a custom title', async () => {
      expect.hasAssertions();

      await renderSummary({
        values: {
          requestForQuote: { contact: requestContact },
          deliveryAndReturn: {
            returnContactType: ReturnContactTypeValues.DifferentPerson,
            returnMethod: ReturnMethodValues.ClientWillCollect,
            contact: otherContact,
          },
        },
        reportRecipient: { rfqOrganisation: {} },
        deliveryAndReturn: deliveryResponse(ReturnAddressTypeValues.Other),
        paymentDetails: { acceptQuotePreInfo },
      });

      await waitFor(() => {
        expect(textOf('deliveryAndReturn')).toContain('30 Other Rd');
      });

      expect(textOf('deliveryAndReturn')).toBe(
        'Instrument/artefact delivery and returnInstrument/artefact deliveryPlease deliver the instrument/artefact to NMI with the following label attachedDeliver to:Quotation ID: Q-2024-001ATTN: Print shipping address label Copyshipping address label to clipboardInstrument/artefact returnReturn contact personPlease select your contact person for the returned instrument/artefact when the job has completedA different return contact personReturn contact person detailsTitle (optional)OtherTitle, if "Other"CaptainFirst nameSamLast nameOkaforRole (optional)- No details addedBusiness phone- No details addedMobile phone0400 111 2220 4 0 0 1 1 1 2 2 2Email addresssam@example.comInstrument/artefact return addressReturn organisation name (optional)Return OrgReturn address30 Other Rd, Brisbane QLD 4000Return methodChoose your return method for the instrument/artefactClient will collect/pickup when completedEdit',
      );
    });

    it('shows no details for a contact that was never added', async () => {
      expect.hasAssertions();

      await renderSummary({
        values: {
          requestForQuote: { contact: requestContact },
          deliveryAndReturn: {
            returnContactType: ReturnContactTypeValues.DifferentPerson,
            returnMethod: ReturnMethodValues.ClientWillProvide,
            contact: '' as never,
          },
        },
        reportRecipient: { rfqOrganisation: {} },
        deliveryAndReturn: deliveryResponse(
          ReturnAddressTypeValues.PostalAddress,
        ),
        paymentDetails: { acceptQuotePreInfo },
      });

      await waitFor(() => {
        expect(textOf('deliveryAndReturn')).toContain('20 Postal Ave');
      });

      expect(textOf('deliveryAndReturn')).toBe(
        'Instrument/artefact delivery and returnInstrument/artefact deliveryPlease deliver the instrument/artefact to NMI with the following label attachedDeliver to:Quotation ID: Q-2024-001ATTN: Print shipping address label Copyshipping address label to clipboardInstrument/artefact returnReturn contact personPlease select your contact person for the returned instrument/artefact when the job has completedA different return contact personReturn contact person detailsNo details addedInstrument/artefact return addressReturn organisation name (optional)Return OrgReturn address20 Postal Ave, Melbourne VIC 3000Return methodChoose your return method for the instrument/artefactClient will provide carrier details belowEdit',
      );
    });

    it('shows only the no-delivery notice when delivery is not applicable', async () => {
      expect.hasAssertions();

      await renderSummary({
        values: {
          requestForQuote: { contact: requestContact },
          deliveryAndReturn: {},
        },
        reportRecipient: { rfqOrganisation: {} },
        deliveryAndReturn: {
          acceptQuotePreInfo: { receiptAndDispatchNA: true },
        },
        paymentDetails: { acceptQuotePreInfo },
      });

      await waitFor(() => {
        expect(textOf('deliveryAndReturn')).toContain('does not require');
      });

      expect(textOf('deliveryAndReturn')).toBe(
        'Instrument/artefact delivery and returnImportant informationThis quotation does not require the delivery or return of the instrument/artefact to the NMI.Contact your NMI test officer for further details.Edit',
      );
    });
  });

  describe('payment details', () => {
    it('shows the requesting contact when the invoice goes to the main person', async () => {
      expect.hasAssertions();

      await renderSummary({
        values: {
          requestForQuote: { contact: requestContact },
          paymentDetails: {
            purchaseOrderNo: 'PO-1234',
            invoiceSentTo: InvoiceSentToValues.SamePerson,
          },
        },
        reportRecipient: { rfqOrganisation: {} },
        deliveryAndReturn: { acceptQuotePreInfo },
        paymentDetails: { acceptQuotePreInfo },
      });

      await waitFor(() => {
        expect(textOf('paymentDetails')).toContain('PO-1234');
      });

      expect(textOf('paymentDetails')).toBe(
        'Payment detailsPurchase Order (PO) number (optional)PO-1234The invoice will be sent to the following contactThe main contact person for this requestInvoice contact personTitle (optional)DrFirst nameRileyLast nameChenRole (optional)MetrologistBusiness phone02 9123 45670 2 9 1 2 3 4 5 6 7Mobile phone0412 345 6780 4 1 2 3 4 5 6 7 8Email addressriley@example.comEdit',
      );
    });

    it('shows a different invoice contact with optional labels', async () => {
      expect.hasAssertions();

      await renderSummary({
        values: {
          requestForQuote: { contact: requestContact },
          paymentDetails: {
            purchaseOrderNo: '',
            invoiceSentTo: InvoiceSentToValues.DifferentPerson,
            contact: otherContact,
          },
        },
        reportRecipient: { rfqOrganisation: {} },
        deliveryAndReturn: { acceptQuotePreInfo },
        paymentDetails: { acceptQuotePreInfo },
      });

      await waitFor(() => {
        expect(textOf('paymentDetails')).toContain('Captain');
      });

      expect(textOf('paymentDetails')).toBe(
        'Payment detailsPurchase Order (PO) number (optional)- No details addedThe invoice will be sent to the following contactA different invoice contact personInvoice contact personTitle (optional)OtherTitle, if "Other"CaptainFirst name (optional)SamLast name (optional)OkaforRole (optional)- No details addedBusiness phone (optional)- No details addedMobile phone (optional)0400 111 2220 4 0 0 1 1 1 2 2 2Email addresssam@example.comEdit',
      );
    });

    it('shows no details for an invoice contact that was never added', async () => {
      expect.hasAssertions();

      await renderSummary({
        values: {
          requestForQuote: { contact: requestContact },
          paymentDetails: {
            invoiceSentTo: InvoiceSentToValues.DifferentPerson,
            contact: '' as never,
          },
        },
        reportRecipient: { rfqOrganisation: {} },
        deliveryAndReturn: { acceptQuotePreInfo },
        paymentDetails: { acceptQuotePreInfo },
      });

      await waitFor(() => {
        expect(textOf('paymentDetails')).toContain('No details added');
      });

      expect(textOf('paymentDetails')).toBe(
        'Payment detailsPurchase Order (PO) number (optional)- No details addedThe invoice will be sent to the following contactA different invoice contact personInvoice contact personNo details addedEdit',
      );
    });
  });

  it('keeps the associated-dispute answer out of the read-only sections', async () => {
    expect.hasAssertions();

    await renderSummary({
      values: { associatedDisputes: YesNo.No },
      reportRecipient: { rfqOrganisation: {} },
      deliveryAndReturn: { acceptQuotePreInfo },
      paymentDetails: { acceptQuotePreInfo },
    });

    expect(textOf('reportRecipient')).not.toContain('dispute');
  });
});
