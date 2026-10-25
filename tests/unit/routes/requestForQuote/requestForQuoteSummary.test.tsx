import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from '@testing-library/react';

import { Formik } from 'formik';

import { MemoryRouter, Route, Routes, useLocation } from 'react-router';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import type * as WebApiClient from '../../../../ClientApp/src/api/web-api-client';

import { YesNo } from '../../../../ClientApp/src/api/web-api-client';

import type { RequestForQuoteSummary as RequestForQuoteSummaryValues } from '../../../../ClientApp/src/api/web-api-client';

import type { AccountDetails } from '../../../../ClientApp/src/authentication/accountContext';

import { AccountStateCtx } from '../../../../ClientApp/src/authentication/accountContext';

import RequestForQuoteSummary from '../../../../ClientApp/src/routes/requestForQuote/requestForQuoteSummary';

import { resetMsalMock } from '../../helpers/mockMsal';

import type { ClientMockOf } from '../../helpers/mockApiClient';

import {
  mockSummaryLookups,
  summaryFixtures,
  summaryHidden,
} from './summaryFixtures';

const clients = vi.hoisted(() => ({
  lookup: undefined as unknown as ClientMockOf<'getLookup'>,
}));

vi.mock(import('@azure/msal-react'), async () => {
  const { msalReactModuleMock } = await import('../../helpers/mockMsal');

  return msalReactModuleMock() satisfies __ExactMockModule<__TestMockModule2>;
});

vi.mock(
  import('../../../../ClientApp/src/api/web-api-client'),
  async (importOriginal) => {
    const { createClientMockFor, webApiClientModuleMock } =
      await import('../../helpers/mockApiClient');
    const original = await importOriginal<typeof WebApiClient>();

    clients.lookup = createClientMockFor('getLookup');

    return webApiClientModuleMock(original, {
      LookupClient: clients.lookup,
    }) satisfies __ExactMockModule<__TestMockModule4>;
  },
);

vi.mock(
  import('../../../../ClientApp/src/instrumentation/AppLogger'),
  () =>
    ({
      default: { error: vi.fn(), info: vi.fn(), verbose: vi.fn() },
    }) satisfies __ExactMockModule<__TestMockModule5>,
);

const REQUEST_ID = 'RFQ-1';

/** Stands in for the step an Edit button navigates to. */
const LocationProbe = () => <p>{useLocation().pathname}</p>;

const fixtureValues = (name: string): RequestForQuoteSummaryValues => {
  const found = summaryFixtures.find((fixture) => fixture.name === name);
  if (!found) throw new Error(`Missing fixture: ${name}`);
  return found.values;
};

interface RenderOptions {
  readonly isSubmitted?: boolean;
  readonly status?: unknown;
  /** The signed-in account; omitted means no account provider at all. */
  readonly account?: Partial<AccountDetails>;
}

/** Renders the page inside the Formik context the wizard provides, once the lookups settle. */
const renderPage = async (
  values: RequestForQuoteSummaryValues,
  {
    isSubmitted = false,
    status = { hidden: summaryHidden },
    account,
  }: RenderOptions = {},
) => {
  const page = (
    <Formik
      initialValues={values}
      initialStatus={status}
      onSubmit={() => undefined}
    >
      <RequestForQuoteSummary name='' isSubmitted={isSubmitted} />
    </Formik>
  );
  const result = render(
    <MemoryRouter initialEntries={[`/request-for-quote/${REQUEST_ID}/summary`]}>
      <Routes>
        <Route
          path='/request-for-quote/:id/summary'
          element={
            account ? (
              <AccountStateCtx.Provider
                value={{ details: account as AccountDetails }}
              >
                {page}
              </AccountStateCtx.Provider>
            ) : (
              page
            )
          }
        />
        <Route
          path='/request-for-quote/:id/:step'
          element={<LocationProbe />}
        />
      </Routes>
    </MemoryRouter>,
  );
  await result.findByText('Request details');
  return result;
};

describe(RequestForQuoteSummary, () => {
  beforeEach(() => {
    cleanup();
    resetMsalMock();
    clients.lookup.methods.getLookup.mockReset();
    mockSummaryLookups(clients.lookup.methods.getLookup);
  });
  it('shows both sections with the values held by Formik', async () => {
    expect.assertions(1);
    await renderPage(
      fixtureValues('fully populated with the principal contact'),
    );
    expect(screen.getByText('Acme Pty Ltd')).toBeInTheDocument();
  });
});

describe(RequestForQuoteSummary, () => {
  beforeEach(() => {
    cleanup();
    resetMsalMock();
    clients.lookup.methods.getLookup.mockReset();
    mockSummaryLookups(clients.lookup.methods.getLookup);
  });
  it('shows both sections with the values held by Formik', async () => {
    expect.assertions(1);
    await renderPage(
      fixtureValues('fully populated with the principal contact'),
    );
    expect(screen.getByText(/Acme Trading/)).toBeInTheDocument();
  });
});

describe(RequestForQuoteSummary, () => {
  beforeEach(() => {
    cleanup();
    resetMsalMock();
    clients.lookup.methods.getLookup.mockReset();
    mockSummaryLookups(clients.lookup.methods.getLookup);
  });
  it('shows both sections with the values held by Formik', async () => {
    expect.assertions(1);
    await renderPage(
      fixtureValues('fully populated with the principal contact'),
    );
    expect(screen.getByText('Ada')).toBeInTheDocument();
  });
});

describe(RequestForQuoteSummary, () => {
  beforeEach(() => {
    cleanup();
    resetMsalMock();
    clients.lookup.methods.getLookup.mockReset();
    mockSummaryLookups(clients.lookup.methods.getLookup);
  });
  it('shows both sections with the values held by Formik', async () => {
    expect.assertions(1);
    await renderPage(
      fixtureValues('fully populated with the principal contact'),
    );
    expect(screen.getByText('Mettler')).toBeInTheDocument();
  });
});

describe(RequestForQuoteSummary, () => {
  beforeEach(() => {
    cleanup();
    resetMsalMock();
    clients.lookup.methods.getLookup.mockReset();
    mockSummaryLookups(clients.lookup.methods.getLookup);
  });
  it('shows both sections with the values held by Formik', async () => {
    expect.assertions(1);
    await renderPage(
      fixtureValues('fully populated with the principal contact'),
    );
    expect(screen.getByText('SN-0042')).toBeInTheDocument();
  });
});
