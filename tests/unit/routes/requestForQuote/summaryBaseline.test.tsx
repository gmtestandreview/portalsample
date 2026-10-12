import { beforeEach, describe, expect, it, vi } from 'vitest';
import type * as WebApiClient from '../../../../ClientApp/src/api/web-api-client';
import { resetMsalMock } from '../../helpers/mockMsal';
import type { ClientMockOf } from '../../helpers/mockApiClient';
import {
  mockSummaryLookups,
  renderFormikSummary,
  summaryFixtures,
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

const fixture = (name: string) => {
  const found = summaryFixtures.find((f) => f.name === name);
  if (!found) throw new Error(`Unknown fixture ${name}`);
  return found;
};

describe('request-for-quote Formik summary baseline', () => {
  beforeEach(() => {
    resetMsalMock();
    clients.lookup.methods.getLookup.mockReset();
    mockSummaryLookups(clients.lookup.methods.getLookup);
  });

  it.each(summaryFixtures.map((f) => [f.name, f] as const))(
    'renders stable markup for %s',
    async (_name, f) => {
      const { container } = await renderFormikSummary(f);

      expect(container.innerHTML.split('><').join('>\n<')).toMatchSnapshot();
    }
  );

  it('shows labels and values for a fully populated request', async () => {
    const { container, getByText } = await renderFormikSummary(
      fixture('fully populated with the principal contact')
    );

    expect(getByText('Organisation')).toBeVisible();
    expect(getByText('Contact')).toBeVisible();
    expect(getByText('Instrument/artefact details')).toBeVisible();
    expect(getByText('Request details')).toBeVisible();
    expect(container).toHaveTextContent('Acme Trading');
    expect(container).toHaveTextContent('Sydney Branch');
    expect(container).toHaveTextContent('Acme Pty Ltd');
    expect(container).toHaveTextContent('ABN: 12 345 678 901');
    expect(container).toHaveTextContent(
      'Who is the main contact person for this request?'
    );
    expect(container).toHaveTextContent('Use my contact details');
    // The 'Use my contact details' descriptor (current contact) is not rendered in the summary.
    expect(container).not.toHaveTextContent('Grace Hopper');
    expect(container).toHaveTextContent('ada@example.com');
    expect(container).toHaveTextContent('Lovelace');
    expect(container).toHaveTextContent('SN-0042');
    expect(container).toHaveTextContent('Mettler');
    expect(container).toHaveTextContent('Balance');
    expect(container).toHaveTextContent('Mass');
    expect(container).toHaveTextContent('Q230123');
    expect(container).toHaveTextContent('Calibrate 10 mg to 200 g');
    expect(container).toHaveTextContent(
      'Regulation 13 with measurement report'
    );
    expect(container).not.toHaveTextContent('Loading...');
  });

  it('shows the free-text title when the contact title is Other', async () => {
    const { container } = await renderFormikSummary(
      fixture('different contact whose title is Other')
    );

    expect(container).toHaveTextContent('A different contact person');
    expect(container).toHaveTextContent('Lord');
  });

  it('omits the branch name from the heading when there is none', async () => {
    const { container } = await renderFormikSummary(
      fixture('no branch or location name')
    );

    expect(container).toHaveTextContent('Acme Trading');
    expect(container).not.toHaveTextContent('Sydney Branch');
  });

  it('shows no serial number when none is available', async () => {
    const { container } = await renderFormikSummary(
      fixture('no serial number')
    );

    expect(container).not.toHaveTextContent('SN-0042');
  });

  // Baseline quirk: the summary step's hiding rules have no `serialNumber` rule (that lives in
  // instrumentAndRequestProps), so the Formik summary still shows a stale serial number.
  it('still shows a stale serial number because the summary has no serialNumber rule', async () => {
    const { container } = await renderFormikSummary(
      fixture('no serial number but a stale serial number value')
    );

    expect(container).toHaveTextContent('SN-STALE');
  });

  it('renders the section headings with no answers', async () => {
    const { container, getByText } = await renderFormikSummary(
      fixture('empty answers')
    );

    expect(getByText('Organisation')).toBeVisible();
    expect(getByText('Request details')).toBeVisible();
    expect(container).not.toHaveTextContent('Loading...');
  });

  it('shows the No measurement and No instrument selections', async () => {
    const { container } = await renderFormikSummary(
      fixture('No measurement category with No instrument type')
    );

    expect(container).toHaveTextContent('No measurement category available');
    expect(container).toHaveTextContent(
      'No instrument/artefact type available'
    );
  });
});
