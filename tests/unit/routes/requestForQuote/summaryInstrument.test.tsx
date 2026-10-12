import { render, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
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

type Values = RfqSummarySectionProps['values'];

const populated = (() => {
  const found = summaryFixtures.find(
    (f) => f.name === 'fully populated with the principal contact'
  );
  if (!found) throw new Error('Missing populated fixture');
  return found.values;
})();

const instrumentValues = (
  overrides: NonNullable<Values['instrumentAndRequest']>
): Values => ({
  ...populated,
  instrumentAndRequest: { ...populated.instrumentAndRequest, ...overrides },
});

const renderInstrument = (values: Values) =>
  render(<RfqInstrumentSummary values={values} hidden={summaryHidden} />);

const renderLoaded = async (values: Values) => {
  const result = renderInstrument(values);
  await result.findByText('Request details');
  return result.container;
};

describe('RfqInstrumentSummary', () => {
  beforeEach(() => {
    resetMsalMock();
    vi.mocked(AppLogger.error).mockClear();
    clients.lookup.methods.getLookup.mockReset();
    mockSummaryLookups(clients.lookup.methods.getLookup);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('shows a loading spinner until the lookups arrive, then the sections', async () => {
    const result = renderInstrument(populated);

    expect(result.getByText('Loading...')).toBeInTheDocument();
    expect(result.queryByText('Request details')).not.toBeInTheDocument();

    expect(await result.findByText('Request details')).toBeInTheDocument();
    expect(result.getByText('Instrument/artefact details')).toBeInTheDocument();
    expect(result.queryByText('Loading...')).not.toBeInTheDocument();
  });

  it('keeps the spinner and logs when the lookups fail to load', async () => {
    const failure = new Error('lookup down');
    clients.lookup.methods.getLookup.mockRejectedValue(failure);

    const result = renderInstrument(populated);

    await waitFor(() =>
      expect(AppLogger.error).toHaveBeenCalledWith(
        'Failed to retrieve look ups',
        failure
      )
    );
    expect(result.getByText('Loading...')).toBeInTheDocument();
    expect(result.queryByText('Request details')).not.toBeInTheDocument();
  });

  it('keeps the spinner and does not load when nobody is signed in', () => {
    signOut();

    const result = renderInstrument(populated);

    expect(result.getByText('Loading...')).toBeInTheDocument();
    expect(clients.lookup.methods.getLookup).not.toHaveBeenCalled();
  });

  it('does not update state or warn when unmounted while the lookups load', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {
      // Only counting calls: any React warning would be reported through here.
    });
    let release: (value: unknown[]) => void = () => undefined;
    clients.lookup.methods.getLookup.mockReturnValue(
      new Promise((resolve) => {
        release = resolve;
      })
    );

    const { unmount } = renderInstrument(populated);
    await waitFor(() =>
      expect(clients.lookup.methods.getLookup).toHaveBeenCalledTimes(2)
    );
    unmount();
    release([]);
    await Promise.resolve();
    await Promise.resolve();

    expect(consoleError).not.toHaveBeenCalled();
  });

  it('shows labels and resolves the lookup ids to their names', async () => {
    const container = await renderLoaded(populated);

    expect(container).toHaveTextContent(
      'Does this instrument/artefact have a serial number available?'
    );
    expect(container).toHaveTextContent('SN-0042');
    expect(container).toHaveTextContent('Mettler');
    expect(container).toHaveTextContent('Mass');
    expect(container).toHaveTextContent('Balance');
    expect(container).not.toHaveTextContent('cat-mass');
    expect(container).toHaveTextContent('15 Mar 2031');
    expect(container).toHaveTextContent(
      'Regulation 13 with measurement report'
    );
  });

  it('hides the serial number when the answer is No, and shows it when the answer is Yes', async () => {
    const hidden = await renderLoaded(
      instrumentValues({ hasSerialNumber: YesNo.No, serialNumber: 'SN-STALE' })
    );
    expect(hidden).not.toHaveTextContent('SN-STALE');
    expect(hidden).not.toHaveTextContent('Serial number');

    const shown = await renderLoaded(
      instrumentValues({ hasSerialNumber: YesNo.Yes, serialNumber: 'SN-0042' })
    );
    expect(shown).toHaveTextContent('Serial number');
    expect(shown).toHaveTextContent('SN-0042');
  });

  it('hides the serial number row when the answer is No or unanswered, even with no value', async () => {
    const no = await renderLoaded(
      instrumentValues({ hasSerialNumber: YesNo.No, serialNumber: undefined })
    );
    expect(no).not.toHaveTextContent('Serial number');

    const unanswered = await renderLoaded({ instrumentAndRequest: {} });
    expect(unanswered).not.toHaveTextContent('Serial number');
  });

  it('shows the serial number row when the answer is Yes, with a placeholder when empty', async () => {
    const container = await renderLoaded(
      instrumentValues({ hasSerialNumber: YesNo.Yes, serialNumber: undefined })
    );

    expect(container).toHaveTextContent('Serial number');
    expect(container).toHaveTextContent('No details added');
  });

  it('shows a dash for an id that matches no lookup', async () => {
    const container = await renderLoaded(
      instrumentValues({
        measurementCategory: 'cat-unknown',
        instrumentOrArtefactType: 'type-unknown',
      })
    );

    expect(container).not.toHaveTextContent('cat-unknown');
    expect(container).not.toHaveTextContent('type-unknown');
    expect(container).toHaveTextContent('Measurement category');
    expect(container).toHaveTextContent('Instrument/artefact type');
  });

  it('falls back to a placeholder for an unrecognised choice answer', async () => {
    const container = await renderLoaded(
      instrumentValues({
        hasSerialNumber: 'Maybe' as unknown as YesNo,
      })
    );

    expect(container).toHaveTextContent('No details added');
  });

  it('shows an unparseable availability date as typed and drops an invalid date object', async () => {
    const typed = await renderLoaded(
      instrumentValues({
        preferredInstrumentOrArtefactAvailabilityDate:
          'next week' as unknown as Date,
      })
    );
    expect(typed).toHaveTextContent('next week');

    const invalid = await renderLoaded(
      instrumentValues({
        preferredInstrumentOrArtefactAvailabilityDate: new Date(Number.NaN),
      })
    );
    expect(invalid).not.toHaveTextContent('Invalid');
  });

  it('shows an empty number of items as a dash, including zero', async () => {
    const container = await renderLoaded(
      instrumentValues({ numberOfItems: 0 })
    );

    expect(container).not.toHaveTextContent('Number of items0');
    expect(container).toHaveTextContent('Number of items');
  });

  it('renders only the headings and unanswered rows for empty values', async () => {
    const container = await renderLoaded({ instrumentAndRequest: {} });

    expect(container).toHaveTextContent('Instrument/artefact details');
    expect(container).toHaveTextContent('Request details');
    expect(container).not.toHaveTextContent('Does this instrument');
    expect(container).not.toHaveTextContent('Measurement category');
  });

  it('renders the headings when there is no instrument step at all', async () => {
    const container = await renderLoaded({});

    expect(container).toHaveTextContent('Request details');
  });
});

describe('useRfqInstrumentLookups', () => {
  beforeEach(() => {
    resetMsalMock();
    clients.lookup.methods.getLookup.mockReset();
    mockSummaryLookups(clients.lookup.methods.getLookup);
  });

  it('sorts alphabetically with the No measurement and No instrument choices last', async () => {
    const { result } = renderHook(() => useRfqInstrumentLookups());

    await waitFor(() => expect(result.current).toBeDefined());

    expect(
      result.current?.measurementCategories.map((o) => o.displayText)
    ).toEqual(['Mass', 'Temperature', 'No measurement category available']);
    expect(result.current?.artefactTypes.map((o) => o.displayText)).toEqual([
      'Balance',
      'Digital thermometer',
      'No instrument/artefact type available',
    ]);
    expect(result.current?.measurementCategories[0]).toEqual({
      displayText: 'Mass',
      value: 'cat-mass',
    });
  });

  it('does not reorder the arrays it was handed', async () => {
    const categories = measurementCategoryLookup.map((x) => ({ ...x }));
    const types = artefactTypeLookup.map((x) => ({ ...x }));
    clients.lookup.methods.getLookup
      .mockResolvedValueOnce(categories)
      .mockResolvedValueOnce(types);

    const { result } = renderHook(() => useRfqInstrumentLookups());
    await waitFor(() => expect(result.current).toBeDefined());

    expect(categories).toEqual(measurementCategoryLookup);
    expect(types).toEqual(artefactTypeLookup);
  });

  it('maps lookups missing an id or label to empty strings', async () => {
    clients.lookup.methods.getLookup
      .mockResolvedValueOnce([{ id: 'only-id', label: '' }])
      .mockResolvedValueOnce([{ label: 'only-label' }, { id: 'no-label' }]);

    const { result } = renderHook(() => useRfqInstrumentLookups());
    await waitFor(() => expect(result.current).toBeDefined());

    expect(result.current?.measurementCategories).toEqual([
      { displayText: '', value: 'only-id' },
    ]);
    expect(result.current?.artefactTypes).toContainEqual({
      displayText: 'only-label',
      value: '',
    });
  });
});
