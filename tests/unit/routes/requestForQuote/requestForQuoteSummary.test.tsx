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

vi.mock('@azure/msal-react', async () => {
  const { msalReactModuleMock } = await import('../../helpers/mockMsal');

  return msalReactModuleMock();
});

vi.mock(
  '../../../../ClientApp/src/api/web-api-client',
  async (importOriginal) => {
    const { createClientMockFor, webApiClientModuleMock } =
      await import('../../helpers/mockApiClient');
    const original = await importOriginal<typeof WebApiClient>();

    clients.lookup = createClientMockFor('getLookup');

    return webApiClientModuleMock(original, { LookupClient: clients.lookup });
  }
);

vi.mock('../../../../ClientApp/src/instrumentation/AppLogger', () => ({
  default: { error: vi.fn(), info: vi.fn(), verbose: vi.fn() },
}));

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
}

/** Renders the page inside the Formik context the wizard provides, once the lookups settle. */
const renderPage = async (
  values: RequestForQuoteSummaryValues,
  {
    isSubmitted = false,
    status = { hidden: summaryHidden },
  }: RenderOptions = {}
) => {
  const result = render(
    <MemoryRouter initialEntries={[`/request-for-quote/${REQUEST_ID}/summary`]}>
      <Routes>
        <Route
          path='/request-for-quote/:id/summary'
          element={
            <Formik
              initialValues={values}
              initialStatus={status}
              onSubmit={() => undefined}
            >
              <RequestForQuoteSummary name='' isSubmitted={isSubmitted} />
            </Formik>
          }
        />
        <Route
          path='/request-for-quote/:id/:step'
          element={<LocationProbe />}
        />
      </Routes>
    </MemoryRouter>
  );
  await result.findByText('Request details');
  return result;
};

describe('RequestForQuoteSummary', () => {
  beforeEach(() => {
    cleanup();
    resetMsalMock();
    clients.lookup.methods.getLookup.mockReset();
    mockSummaryLookups(clients.lookup.methods.getLookup);
  });

  it('shows both sections with the values held by Formik', async () => {
    await renderPage(
      fixtureValues('fully populated with the principal contact')
    );

    expect(screen.getByText('Acme Pty Ltd')).toBeInTheDocument();
    expect(screen.getByText(/Acme Trading/)).toBeInTheDocument();
    expect(screen.getByText('Ada')).toBeInTheDocument();
    expect(screen.getByText('Mettler')).toBeInTheDocument();
    expect(screen.getByText('SN-0042')).toBeInTheDocument();
    expect(screen.getByText('Balance')).toBeInTheDocument();
  });

  it('honours the wizard hiding rule for an empty branch name', async () => {
    await renderPage(fixtureValues('no branch or location name'));

    expect(screen.getByText('Acme Trading')).toBeInTheDocument();
    expect(screen.queryByText(/Sydney Branch/)).toBeNull();
  });

  it('shows the contact details unless principalContactHide says otherwise', async () => {
    const values = fixtureValues('fully populated with the principal contact');
    await renderPage(values, {
      status: {
        hidden: {
          organisationAndContact: { principalContactHide: () => true },
        },
      },
    });

    expect(screen.getByText('Acme Pty Ltd')).toBeInTheDocument();
    expect(screen.queryByText('Lovelace', { exact: false })).toBeNull();
  });

  it('copes with a Formik status that carries no hiding rules', async () => {
    await renderPage(
      fixtureValues('fully populated with the principal contact'),
      {
        status: null,
      }
    );

    expect(screen.getByText('Lovelace', { exact: false })).toBeInTheDocument();
  });

  it('hides the serial number row when no serial number is available', async () => {
    const values = fixtureValues('no serial number');
    await renderPage({
      ...values,
      instrumentAndRequest: {
        ...values.instrumentAndRequest,
        hasSerialNumber: YesNo.No,
      },
    });

    expect(screen.queryByText('Serial number')).toBeNull();
  });

  it('offers review guidance and no back button while editable', async () => {
    await renderPage(
      fixtureValues('fully populated with the principal contact')
    );

    expect(
      screen.getByText(/before you submit your request/i)
    ).toBeInTheDocument();
    expect(screen.queryByTestId('back-button')).toBeNull();
  });

  it.each([
    [0, 'organisation-and-contact'],
    [1, 'instrument-and-request'],
  ])('Edit button %i leads to %s while editable', async (index, step) => {
    await renderPage(
      fixtureValues('fully populated with the principal contact')
    );

    const editButtons = screen.getAllByRole('button', {
      name: 'Edit this section',
    });
    expect(editButtons).toHaveLength(2);
    fireEvent.click(editButtons[index] as HTMLElement);

    expect(
      screen.getByText(`/request-for-quote/${REQUEST_ID}/${step}`)
    ).toBeInTheDocument();
  });

  it('swaps guidance and Edit links for a back button once submitted', async () => {
    await renderPage(
      fixtureValues('fully populated with the principal contact'),
      {
        isSubmitted: true,
      }
    );

    expect(screen.queryByText(/before you submit your request/i)).toBeNull();
    expect(screen.queryByRole('button', { name: /edit/i })).toBeNull();
    const back = screen.getByTestId('back-button');
    expect(back).toHaveAttribute('href', '/dashboard');
    expect(within(back).getByText(/back to dashboard/i)).toBeInTheDocument();
    expect(screen.getByText('Acme Pty Ltd')).toBeInTheDocument();
  });
});
