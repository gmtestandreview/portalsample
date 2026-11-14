import { act, renderHook, waitFor } from '@testing-library/react';
import { Formik } from 'formik';
import type { ChangeEvent, ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import type * as WebApiClient from '../../../../ClientApp/src/api/web-api-client';
import type {
  InstrumentAndRequestStep,
  LookupResponse,
} from '../../../../ClientApp/src/api/web-api-client';
import { grantToken, resetMsalMock, signOut } from '../../helpers/mockMsal';
import type { ClientMockOf } from '../../helpers/mockApiClient';
import {
  useInstrumentAndRequestLookups,
  useStableToday,
} from '@/routes/requestForQuote/instrumentAndRequest';

const clients = vi.hoisted(() => ({
  lookup: undefined as unknown as ClientMockOf<'getLookup'>,
}));

vi.mock(import('@azure/msal-react'), (async () => {
  const { msalReactModuleMock } = await import('../../helpers/mockMsal');

  return msalReactModuleMock() satisfies __ExactMockModule<__TestMockModule2>;
}) as unknown as __DynamicPartialMockFactory<__TestMockModule2>);

vi.mock(import('../../../../ClientApp/src/api/web-api-client'), (async (
  importOriginal: Parameters<__DynamicPartialMockFactory<__TestMockModule4>>[0],
) => {
  const { createClientMockFor, webApiClientModuleMock } =
    await import('../../helpers/mockApiClient');
  const original = await importOriginal<typeof WebApiClient>();

  clients.lookup = createClientMockFor('getLookup');

  return webApiClientModuleMock(original, {
    LookupClient: clients.lookup,
  }) satisfies __ExactMockModule<__TestMockModule4>;
}) as unknown as __DynamicPartialMockFactory<__TestMockModule4>);

const wrapperInitialValues = { value: {} as InstrumentAndRequestStep };

const wrapper = ({ children }: { readonly children: ReactNode }) => (
  <Formik<InstrumentAndRequestStep>
    initialValues={wrapperInitialValues.value}
    enableReinitialize
    onSubmit={() => undefined}
  >
    {children}
  </Formik>
);

// function suite titles are required by vitest/prefer-describe-function-title.
describe(useInstrumentAndRequestLookups, () => {
  it('refreshes the current date at local midnight without leaking its timer', () => {
    expect.hasAssertions();

    vi.useFakeTimers();
    try {
      vi.setSystemTime(new Date(2026, 0, 1, 23, 59, 59, 500));
      const { result, rerender, unmount } = renderHook(() => useStableToday());
      const initialDate = result.current;

      rerender();

      expect(result.current).toBe(initialDate);

      act(() => {
        vi.advanceTimersByTime(1000);
      });

      expect(result.current).toStrictEqual(new Date(2026, 0, 2));

      unmount();

      expect(vi.getTimerCount()).toBe(0);
    } finally {
      vi.useRealTimers();
    }
  });

  it('returns no measurement category options before the lookups resolve', () => {
    expect.hasAssertions();

    resetMsalMock();
    clients.lookup.methods.getLookup.mockReset();
    wrapperInitialValues.value = {};

    signOut();

    const { result } = renderHook(() => useInstrumentAndRequestLookups(), {
      wrapper,
    });

    expect(result.current.getMeasurementCategories()).toStrictEqual([]);
    expect(result.current.isLoading).toBe(true);
  });

  it('skips measurement categories that lack an id', async () => {
    expect.hasAssertions();

    resetMsalMock();
    clients.lookup.methods.getLookup.mockReset();
    wrapperInitialValues.value = {};

    grantToken();
    clients.lookup.methods.getLookup
      .mockResolvedValueOnce([
        { id: 'mass', label: 'Mass' },
        { label: 'No id' },
      ])
      .mockResolvedValueOnce([]);

    const { result } = renderHook(() => useInstrumentAndRequestLookups(), {
      wrapper,
    });

    await waitFor(() => {
      expect(result.current.getMeasurementCategories()).toStrictEqual([
        { displayText: 'Mass', value: 'mass' },
      ]);
    });
  });

  it('leaves the artefact types untouched when a category changes before they load', async () => {
    expect.hasAssertions();

    resetMsalMock();
    clients.lookup.methods.getLookup.mockReset();
    wrapperInitialValues.value = {};

    signOut();

    const { result } = renderHook(() => useInstrumentAndRequestLookups(), {
      wrapper,
    });

    await act(async () => {
      result.current.onMeasurementCategoryChange({
        target: { value: 'mass' },
      } as unknown as ChangeEvent<HTMLSelectElement>);
      await Promise.resolve();
    });

    expect(result.current.artefactTypesSelected).toBeUndefined();
    expect(result.current.isInstrumentOrArtefactTypeDisabled).toBe(false);
  });

  it('applies a reinitialized measurement category after pending lookups settle', async () => {
    expect.hasAssertions();

    resetMsalMock();
    clients.lookup.methods.getLookup.mockReset();
    wrapperInitialValues.value = {};

    grantToken();
    const pendingLookups: ((value: LookupResponse[]) => void)[] = [];
    clients.lookup.methods.getLookup.mockImplementation(
      () =>
        new Promise<LookupResponse[]>((resolve) => {
          pendingLookups.push(resolve);
        }),
    );

    const { result, rerender } = renderHook(
      () => useInstrumentAndRequestLookups(),
      { wrapper },
    );

    await waitFor(() => {
      expect(clients.lookup.methods.getLookup).toHaveBeenCalledTimes(2);
    });

    wrapperInitialValues.value = { measurementCategory: 'no-measurement' };
    rerender();

    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
      pendingLookups[0]?.([
        { id: 'category-1', label: 'Category 1' },
        { id: 'no-measurement', label: 'No measurement' },
      ]);
      pendingLookups[1]?.([
        {
          id: 'artefact-1',
          label: 'Artefact 1',
          parentId: 'no-measurement',
        },
      ]);
      await Promise.resolve();
      await Promise.resolve();
      await Promise.resolve();
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.artefactTypesSelected).toStrictEqual([
      { displayText: 'Artefact 1', value: 'artefact-1' },
    ]);
    expect(result.current.isInstrumentOrArtefactTypeDisabled).toBe(true);
  });

  it('rebuilds artefact options when the measurement category changes', async () => {
    expect.hasAssertions();

    resetMsalMock();
    clients.lookup.methods.getLookup.mockReset();
    wrapperInitialValues.value = {};
    grantToken();
    clients.lookup.methods.getLookup
      .mockResolvedValueOnce([
        { id: 'category-1', label: 'Category 1' },
        { id: 'no-measurement', label: 'No measurement' },
      ])
      .mockResolvedValueOnce([
        { id: 'artefact-1', label: 'Artefact 1', parentId: 'category-1' },
      ]);

    const { result } = renderHook(() => useInstrumentAndRequestLookups(), {
      wrapper,
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      result.current.onMeasurementCategoryChange({
        target: { value: 'category-1' },
      } as React.ChangeEvent<HTMLSelectElement>);
      await Promise.resolve();
    });

    expect(result.current.artefactTypesSelected).toStrictEqual([
      { displayText: 'Artefact 1', value: 'artefact-1' },
    ]);
  });
});
