import { cleanup, render } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type * as WebApiClient from '../../../../ClientApp/src/api/web-api-client';
import RfqInstrumentSummary from '../../../../ClientApp/src/routes/requestForQuote/summary/RfqInstrumentSummary';
import { resetMsalMock } from '../../helpers/mockMsal';
import type { ClientMockOf } from '../../helpers/mockApiClient';
import {
  mockSummaryLookups,
  renderFormikInstrument,
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

/** One tag per line, so a mismatch shows as a readable diff. */
const lines = (html: string) => html.split('><');

/**
 * Differences between the Formik branch and the twin that are accepted. Expected to stay empty:
 * the twin reproduces the Formik markup exactly, so any difference is a parity failure.
 */
const ALLOWED_DIFFERENCES: readonly { from: RegExp; to: string }[] = [];

const normalise = (html: string) =>
  ALLOWED_DIFFERENCES.reduce(
    (current, { from, to }) => current.replace(from, to),
    html
  );

describe('form-free RFQ instrument summary parity with the Formik summary', () => {
  beforeEach(() => {
    resetMsalMock();
    clients.lookup.methods.getLookup.mockReset();
    mockSummaryLookups(clients.lookup.methods.getLookup);
  });

  it.each(summaryFixtures.map((f) => [f.name, f] as const))(
    'renders the same markup for %s',
    async (_name, fixture) => {
      const legacy = (await renderFormikInstrument(fixture)).container
        .innerHTML;
      cleanup();
      const twinRender = render(
        <RfqInstrumentSummary values={fixture.values} hidden={summaryHidden} />
      );
      await twinRender.findByText('Request details');

      expect(lines(normalise(twinRender.container.innerHTML))).toEqual(
        lines(normalise(legacy))
      );
    }
  );
});
