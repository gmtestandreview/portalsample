import { render, renderHook, waitFor, within } from '@testing-library/react';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type * as React from 'react';

import type * as WebApiClient from '../../../../ClientApp/src/api/web-api-client';

import { YesNo } from '../../../../ClientApp/src/api/web-api-client';

import AppLogger from '../../../../ClientApp/src/instrumentation/AppLogger';

import RfqInstrumentSummary from '../../../../ClientApp/src/routes/requestForQuote/summary/RfqInstrumentSummary';

import { useRfqInstrumentLookups } from '../../../../ClientApp/src/routes/requestForQuote/summary/useRfqInstrumentLookups';

import type { RfqSummarySectionProps } from '../../../../ClientApp/src/routes/requestForQuote/summary/types';

import { resetMsalMock, signOut } from '../../helpers/mockMsal';

import type { ClientMockOf } from '../../helpers/mockApiClient';

import {
  artefactTypeLookup,
  measurementCategoryLookup,
  mockSummaryLookups,
  summaryFixtures,
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

/**
 * React 18 ignores a state update on an unmounted component without warning, so a missing guard is
 * invisible. Recording the setter calls that carry lookups makes it observable.
 */
const stateSetterCalls = vi.hoisted(() => ({ calls: [] as unknown[] }));

vi.mock(import('react'), async (importOriginal) => {
  const actual = await importOriginal<typeof React>();

  return {
    ...actual,
    useState: (initial: unknown) => {
      const [value, setValue] = actual.useState(initial);

      return [
        value,
        (next: unknown) => {
          stateSetterCalls.calls.push(next);
          setValue(next);
        },
      ];
    },
  } satisfies __ExactMockModule<__TestMockModule123>;
});

const setLookupsCalls = () =>
  stateSetterCalls.calls.filter(
    (next) =>
      typeof next === 'object' && next !== null && 'artefactTypes' in next,
  );

type Values = RfqSummarySectionProps['values'];

const populated = (() => {
  const found = summaryFixtures.find(
    (f) => f.name === 'fully populated with the principal contact',
  );
  if (!found) throw new Error('Missing populated fixture');
  return found.values;
})();

const instrumentValues = (
  overrides: NonNullable<Values['instrumentAndRequest']>,
): Values => ({
  ...populated,
  instrumentAndRequest: { ...populated.instrumentAndRequest, ...overrides },
});

const renderInstrument = (values: Values) =>
  render(<RfqInstrumentSummary values={values} />);

const renderLoaded = async (values: Values) => {
  const result = renderInstrument(values);
  await result.findByText('Request details');
  return result.container;
};

describe(RfqInstrumentSummary, () => {
  beforeEach(() => {
    resetMsalMock();
    vi.mocked(AppLogger.error).mockClear();
    stateSetterCalls.calls.length = 0;
    clients.lookup.methods.getLookup.mockReset();
    mockSummaryLookups(clients.lookup.methods.getLookup);
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });
  it('shows a loading spinner until the lookups arrive, then the sections', async () => {
    expect.assertions(5);
    const result = renderInstrument(populated);

    expect(result.getByText('Loading...')).toBeInTheDocument();
    expect(result.queryByText('Request details')).not.toBeInTheDocument();

    await expect(
      result.findByText('Request details'),
    ).resolves.toBeInTheDocument();
    expect(result.getByText('Instrument/artefact details')).toBeInTheDocument();
    expect(result.queryByText('Loading...')).not.toBeInTheDocument();
  });
});
