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

interface AllowedDifference {
  /** The only fixture the difference may appear in. */
  readonly fixture: string;
  readonly reason: string;
  readonly from: RegExp;
  readonly to: string;
}

/**
 * Differences between the Formik branch and the twin that are accepted. Each is scoped to the one
 * fixture that shows it; every other fixture must match exactly.
 */
const ALLOWED_DIFFERENCES: readonly AllowedDifference[] = [
  {
    fixture: 'no serial number but a stale serial number value',
    reason:
      'The Formik summary has no serialNumber hiding rule, so a serial number left over from before ' +
      'the answer became "No" still shows. The twin hides it using the step rule.',
    from: /<div class="mb-4 "><div class="form-label mb-0">Serial number<\/div><p class="mb-0 text-break ">SN-STALE<\/p><\/div>/,
    to: '',
  },
];

const normalise = (fixtureName: string, html: string) =>
  ALLOWED_DIFFERENCES.filter((d) => d.fixture === fixtureName).reduce(
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
    async (name, fixture) => {
      const legacy = (await renderFormikInstrument(fixture)).container
        .innerHTML;
      cleanup();
      const twinRender = render(
        <RfqInstrumentSummary values={fixture.values} hidden={summaryHidden} />
      );
      await twinRender.findByText('Request details');

      expect(lines(normalise(name, twinRender.container.innerHTML))).toEqual(
        lines(normalise(name, legacy))
      );
    }
  );

  it('only needs the allowed difference because the Formik summary shows the stale serial number', async () => {
    const stale = summaryFixtures.find(
      (f) => f.name === ALLOWED_DIFFERENCES[0]?.fixture
    );
    if (!stale) throw new Error('Missing stale serial number fixture');

    const legacy = (await renderFormikInstrument(stale)).container.innerHTML;
    cleanup();
    const twinRender = render(
      <RfqInstrumentSummary values={stale.values} hidden={summaryHidden} />
    );
    await twinRender.findByText('Request details');

    expect(legacy).toContain('SN-STALE');
    expect(twinRender.container.innerHTML).not.toContain('SN-STALE');
  });
});
