import { render } from '@testing-library/react';
import { Formik } from 'formik';
import { MemoryRouter } from 'react-router';
import type { Mock } from 'vitest';
import {
  CRMLookupTypes,
  MeasurementReportAndCertificateRequiredValues,
  Title,
  YesNo,
} from '../../../../ClientApp/src/api/web-api-client';
import type {
  LookupResponse,
  RequestForQuoteSummary,
} from '../../../../ClientApp/src/api/web-api-client';
import InstrumentAndRequest from '../../../../ClientApp/src/routes/requestForQuote/instrumentAndRequest';
import OrganisationAndContact from '../../../../ClientApp/src/routes/requestForQuote/organisationAndContact';
import requestForQuoteSummaryProps from '../../../../ClientApp/src/routes/requestForQuote/requestForQuoteSummaryProps';
import type { AccountDetails } from '../../../../ClientApp/src/authentication/accountContext';

/**
 * Parity baseline for the request-for-quote summary.
 *
 * `renderFormikSummary` renders the real Formik-backed summary branches exactly as
 * `requestForQuoteSummary.tsx` mounts them. A form-free twin is later compared against its output.
 * The test file that uses it must register the `@azure/msal-react` mock and a `LookupClient` mock
 * itself (`vi.mock` is hoisted per file), then call `mockSummaryLookups` on the `getLookup` mock.
 */

/** The hiding rules the real summary step ships, not a copy of them. */
export const summaryHidden =
  requestForQuoteSummaryProps(
    'RFQ-1',
    [],
    {} as never,
    {} as AccountDetails,
    [],
    'Request for quote'
  ).hidingFields ?? {};

export const measurementCategoryLookup: LookupResponse[] = [
  { id: 'cat-temp', label: 'Temperature' },
  { id: 'cat-none', label: 'No measurement category available' },
  { id: 'cat-mass', label: 'Mass' },
];

export const artefactTypeLookup: LookupResponse[] = [
  { id: 'type-thermo', label: 'Digital thermometer', parentId: 'cat-temp' },
  {
    id: 'type-none',
    label: 'No instrument/artefact type available',
    parentId: 'cat-none',
  },
  { id: 'type-balance', label: 'Balance', parentId: 'cat-mass' },
];

/**
 * Answers `getLookup` by lookup type, as the real component asks for both in parallel.
 *
 * Each call returns a fresh copy: the component's `sortList` splices the array it is given, so
 * handing back a shared fixture would drop 'No measurement' from it for every later render.
 */
export const mockSummaryLookups = (getLookup: Mock) => {
  getLookup.mockImplementation((lookupType: CRMLookupTypes) =>
    Promise.resolve(
      (lookupType === CRMLookupTypes.TCPortalMeasurementCategory
        ? measurementCategoryLookup
        : artefactTypeLookup
      ).map((item) => ({ ...item }))
    )
  );
};

const contact = {
  title: Title.Dr,
  firstName: 'Ada',
  lastName: 'Lovelace',
  role: 'Engineer',
  phone: '0291234567',
  mobile: '0412345678',
  email: 'ada@example.com',
};

const currentContact = {
  title: Title.Ms,
  firstName: 'Grace',
  lastName: 'Hopper',
  email: 'grace@example.com',
};

const organisation = {
  abn: '12345678901',
  name: 'Acme Pty Ltd',
  businessOrTradingName: 'Acme Trading',
  branchOrLocationName: 'Sydney Branch',
  organisationCount: 2,
  currentContact,
};

// Fixed local-time date so the rendered text never depends on when the suite runs.
const availabilityDate = new Date(2031, 2, 15, 12, 0, 0);

const instrument = {
  hasSerialNumber: YesNo.Yes,
  serialNumber: 'SN-0042',
  manufacturer: 'Mettler',
  model: 'X1',
  description: 'Line one\nLine two',
  numberOfItems: 3,
  measurementCategory: 'cat-mass',
  instrumentOrArtefactType: 'type-balance',
  previousQuoteOrReportNumber: 'Q230123',
  testingAndCalibrationRequirements: 'Calibrate 10 mg to 200 g',
  preferredInstrumentOrArtefactAvailabilityDate: availabilityDate,
  measurementReportAndCertificateRequired:
    MeasurementReportAndCertificateRequiredValues.Regulation13WithMeasurementReport,
};

export interface SummaryFixture {
  readonly name: string;
  readonly values: RequestForQuoteSummary;
}

export const summaryFixtures: readonly SummaryFixture[] = [
  {
    name: 'fully populated with the principal contact',
    values: {
      organisationAndContact: {
        ...organisation,
        isPrincipalContact: YesNo.Yes,
        contact,
      },
      instrumentAndRequest: instrument,
    },
  },
  {
    name: 'different contact whose title is Other',
    values: {
      organisationAndContact: {
        ...organisation,
        isPrincipalContact: YesNo.No,
        contact: { ...contact, title: Title.Other, titleOther: 'Lord' },
      },
      instrumentAndRequest: instrument,
    },
  },
  {
    name: 'no branch or location name',
    values: {
      organisationAndContact: {
        ...organisation,
        branchOrLocationName: undefined,
        isPrincipalContact: YesNo.Yes,
        contact,
      },
      instrumentAndRequest: instrument,
    },
  },
  {
    name: 'no serial number',
    values: {
      organisationAndContact: {
        ...organisation,
        isPrincipalContact: YesNo.Yes,
        contact,
      },
      instrumentAndRequest: {
        ...instrument,
        hasSerialNumber: YesNo.No,
        serialNumber: undefined,
      },
    },
  },
  {
    name: 'no serial number but a stale serial number value',
    values: {
      organisationAndContact: {
        ...organisation,
        isPrincipalContact: YesNo.Yes,
        contact,
      },
      instrumentAndRequest: {
        ...instrument,
        hasSerialNumber: YesNo.No,
        serialNumber: 'SN-STALE',
      },
    },
  },
  {
    name: 'empty answers',
    values: { organisationAndContact: {}, instrumentAndRequest: {} },
  },
  {
    name: 'No measurement category with No instrument type',
    values: {
      organisationAndContact: {
        ...organisation,
        isPrincipalContact: YesNo.Yes,
        contact,
      },
      instrumentAndRequest: {
        ...instrument,
        measurementCategory: 'cat-none',
        instrumentOrArtefactType: 'type-none',
      },
    },
  },
];

/**
 * Render both summary branches inside the Formik context the wizard provides, wait for the lookup
 * effect to settle, and return the render result so callers can query or compare its markup.
 */
export const renderFormikSummary = async (
  fixture: Pick<SummaryFixture, 'values'>
) => {
  const result = render(
    <MemoryRouter>
      <Formik
        initialValues={fixture.values}
        initialStatus={{ hidden: summaryHidden }}
        onSubmit={() => undefined}
      >
        <>
          <OrganisationAndContact isSummary name='organisationAndContact' />
          <InstrumentAndRequest isSummary name='instrumentAndRequest' />
        </>
      </Formik>
    </MemoryRouter>
  );
  await result.findByText('Request details');
  return result;
};

/**
 * Render only the organisation and contact summary branch in its Formik context. It needs no
 * lookups, so there is nothing to wait for.
 */
export const renderFormikOrganisation = (
  fixture: Pick<SummaryFixture, 'values'>
) =>
  render(
    <MemoryRouter>
      <Formik
        initialValues={fixture.values}
        initialStatus={{ hidden: summaryHidden }}
        onSubmit={() => undefined}
      >
        <OrganisationAndContact isSummary name='organisationAndContact' />
      </Formik>
    </MemoryRouter>
  );
