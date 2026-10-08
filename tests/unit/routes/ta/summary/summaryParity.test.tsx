import { act, render } from '@testing-library/react';
import { Formik } from 'formik';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  PatternApprovalRequiredValueOptions,
  PatternApprovalRequiredValues,
  State,
  Title,
  YesNo,
} from '../../../../../ClientApp/src/api/web-api-client';
import type { RequestForPatternApprovalAppDetails } from '../../../../../ClientApp/src/api/web-api-client';
import ApplicationAndInstrument from '../../../../../ClientApp/src/routes/ta/applicationAndInstrument';
import OrganisationAndContact from '../../../../../ClientApp/src/routes/ta/organisationAndContact';
import appDetailsProps from '../../../../../ClientApp/src/routes/ta/manage/appDetailsProps';
import ApplicationSummary from '../../../../../ClientApp/src/routes/ta/summary/ApplicationSummary';
import OrganisationSummary from '../../../../../ClientApp/src/routes/ta/summary/OrganisationSummary';
import { resetMsalMock } from '../../../helpers/mockMsal';

vi.mock('@azure/msal-react', async () => {
  const { msalReactModuleMock } = await import('../../../helpers/mockMsal');

  return msalReactModuleMock();
});

vi.mock('../../../../../ClientApp/src/instrumentation/AppLogger', () => ({
  default: { error: vi.fn(), info: vi.fn(), verbose: vi.fn() },
}));

const hidden = appDetailsProps('APP-1', [], {} as never).hidingFields ?? {};

const address = {
  line1: '1 Test St',
  suburb: 'Sydney',
  state: State.NSW,
  postcode: '2000',
  isManuallyEntered: false,
};

const contact = (overrides: Record<string, unknown> = {}) => ({
  title: Title.Dr,
  firstName: 'Ada',
  lastName: 'Lovelace',
  role: 'Engineer',
  phone: '0291234567',
  mobile: '0412345678',
  email: 'ada@example.com',
  ...overrides,
});

const lookups = {
  instrumentCategoryLookup: [
    { id: 'cat-1', label: 'Mass' },
    { id: 'cat-2', label: 'No measurement' },
  ],
  instrumentTypeLookup: [
    { id: 'type-1', label: 'Balance', parentId: 'cat-1' },
    { id: 'type-2', label: 'No instrument', parentId: 'cat-2' },
  ],
};

const manufacturer = {
  isManufacturer: YesNo.Yes,
  name: 'Acme Pty Ltd',
  streetAddress: address,
  isPrincipalContact: YesNo.No,
  contact: contact(),
  isPrincipalInvoiceContact: YesNo.Yes,
  invoiceContact: contact({ firstName: 'Inv' }),
};

const fixtures: Record<string, RequestForPatternApprovalAppDetails> = {
  'new certificate by a manufacturer': {
    organisationAndContact: manufacturer,
    applicationAndInstrument: {
      patternApprovalType: PatternApprovalRequiredValues.NewCertificate,
      newSubOptions: [
        PatternApprovalRequiredValueOptions.CertificateofApproval,
        PatternApprovalRequiredValueOptions.OIMLCertificate,
      ],
      instrumentCategory: 'cat-1',
      instrumentType: 'type-1',
      make: 'Mettler',
      model: 'X1',
      summary: 'Line one\nLine two',
      ...lookups,
    },
  },
  'new certificate with nothing optional filled in': {
    organisationAndContact: { isManufacturer: YesNo.Yes },
    applicationAndInstrument: {
      patternApprovalType: PatternApprovalRequiredValues.NewCertificate,
      ...lookups,
    },
  },
  'variation by an authorised agent with different contacts': {
    organisationAndContact: {
      ...manufacturer,
      isManufacturer: YesNo.No,
      authorisedAgent: {
        manufacturerName: 'Maker GmbH',
        abn: '12345678901',
        streetAddress: address,
      },
      isPrincipalInvoiceContact: YesNo.No,
      contact: contact({ title: Title.Other, titleOther: 'Lord' }),
    },
    applicationAndInstrument: {
      patternApprovalType: PatternApprovalRequiredValues.Variation,
      varSubOptions: [
        PatternApprovalRequiredValueOptions.VariationtoanExistingCoA,
      ],
      certificateNumber: '5/6A/91B',
      summary: 'Add a model',
      ...lookups,
    },
  },
  'other approval': {
    organisationAndContact: manufacturer,
    applicationAndInstrument: {
      patternApprovalType: PatternApprovalRequiredValues.OtherApproval,
      othSubOptions: [
        PatternApprovalRequiredValueOptions.ProvisionalCertificate,
      ],
      summary: 'Provisional please',
      ...lookups,
    },
  },
  'no application type chosen': {
    organisationAndContact: manufacturer,
    applicationAndInstrument: { ...lookups },
  },
};

/** One tag per line, so a mismatch shows as a readable diff. */
const lines = (html: string) => html.split('><');

/**
 * The Formik summary renders `Applying for` as a `ul` that `SummaryDisplay`
 * draws without a value, so the chosen sub-options never show. The new view
 * shows them (asserted separately below); drop them here so every other
 * difference still fails the comparison.
 */
const withoutSubOptionValues = (html: string) =>
  html.replace(
    /(Applying for<\/div>)<p class="mb-0 text-break mb-0">[^<]*<\/p>/g,
    '$1'
  );

const renderLegacy = async (values: RequestForPatternApprovalAppDetails) => {
  const result = render(
    <Formik
      initialValues={values}
      initialStatus={{ hidden }}
      onSubmit={() => undefined}
    >
      <>
        <OrganisationAndContact isSummary name='organisationAndContact' />
        <ApplicationAndInstrument isSummary name='applicationAndInstrument' />
      </>
    </Formik>
  );
  await act(async () => {
    await Promise.resolve();
  });
  return result.container.innerHTML;
};

const renderSummary = (values: RequestForPatternApprovalAppDetails) =>
  render(
    <>
      <OrganisationSummary values={values} hidden={hidden} />
      <ApplicationSummary values={values} hidden={hidden} />
    </>
  ).container.innerHTML;

describe('form-free TA summary parity with the Formik summary', () => {
  beforeEach(() => {
    resetMsalMock();
  });

  it.each(Object.entries(fixtures))(
    'renders the same markup for %s',
    async (_name, values) => {
      const legacy = await renderLegacy(values);
      document.body.innerHTML = '';
      const summary = renderSummary(values);

      expect(lines(withoutSubOptionValues(summary))).toEqual(lines(legacy));
    }
  );

  it('shows the chosen sub-options that the Formik summary leaves blank', () => {
    const { container } = render(
      <ApplicationSummary
        values={fixtures['new certificate by a manufacturer']!}
        hidden={hidden}
      />
    );

    expect(container).toHaveTextContent(
      'NMI Pattern Approval Certificate, International Organisation of Legal Metrology (OIML) Certificate'
    );
  });
});
