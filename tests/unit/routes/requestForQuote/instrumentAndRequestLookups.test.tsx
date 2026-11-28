import { act, renderHook, waitFor } from '@testing-library/react';
import { FormProvider, useForm, useFormContext } from 'react-hook-form';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import type * as WebApiClient from '../../../../ClientApp/src/api/web-api-client';
import type {
  InstrumentAndRequestStep,
  LookupResponse,
} from '../../../../ClientApp/src/api/web-api-client';
import { grantToken, resetMsalMock, signOut } from '../../helpers/mockMsal';
import type { ClientMockOf } from '../../helpers/mockApiClient';
import { useInstrumentAndRequestLookups } from '@/routes/requestForQuote/useInstrumentAndRequestLookups';
import { useStableToday } from '@/routes/requestForQuote/useStableToday';

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

const Provider = ({ children }: { readonly children: ReactNode }) => {
  // `values` re-syncs the form when it changes, like enableReinitialize.
  const methods = useForm<InstrumentAndRequestStep>({
    values: wrapperInitialValues.value,
  });

  return <FormProvider {...methods}>{children}</FormProvider>;
};

const wrapper = ({ children }: { readonly children: ReactNode }) => (
  <Provider>{children}</Provider>
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

  it('leaves the artefact types untouched when a category changes before they load', () => {
    expect.hasAssertions();

    resetMsalMock();
    clients.lookup.methods.getLookup.mockReset();
    wrapperInitialValues.value = {};

    signOut();

    const { result } = renderHook(() => useInstrumentAndRequestLookups(), {
      wrapper,
    });

    act(() => {
      result.current.onMeasurementCategoryChange('mass');
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

  it('offers no artefact options while the measurement category is blank', async () => {
    expect.hasAssertions();

    resetMsalMock();
    clients.lookup.methods.getLookup.mockReset();
    wrapperInitialValues.value = { measurementCategory: '' };
    grantToken();
    clients.lookup.methods.getLookup
      .mockResolvedValueOnce([{ id: 'category-1', label: 'Category 1' }])
      .mockResolvedValueOnce([
        { id: 'artefact-1', label: 'Artefact 1', parentId: 'category-1' },
      ]);

    const { result } = renderHook(() => useInstrumentAndRequestLookups(), {
      wrapper,
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.artefactTypesSelected).toStrictEqual([]);
  });

  it('rebuilds artefact options when the measurement category field changes', async () => {
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

    const { result } = renderHook(
      () => ({
        form: useFormContext<InstrumentAndRequestStep>(),
        lookups: useInstrumentAndRequestLookups(),
      }),
      { wrapper },
    );

    await waitFor(() => {
      expect(result.current.lookups.isLoading).toBe(false);
    });

    act(() => {
      result.current.form.setValue('measurementCategory', 'category-1');
    });

    expect(result.current.lookups.artefactTypesSelected).toStrictEqual([
      { displayText: 'Artefact 1', value: 'artefact-1' },
    ]);
  });

  it('clears the instrument type, untouches it and keeps it dirty when the category changes', async () => {
    expect.hasAssertions();

    resetMsalMock();
    clients.lookup.methods.getLookup.mockReset();
    wrapperInitialValues.value = {
      measurementCategory: 'category-1',
      instrumentOrArtefactType: 'artefact-1',
    };
    grantToken();
    clients.lookup.methods.getLookup
      .mockResolvedValueOnce([
        { id: 'category-1', label: 'Category 1' },
        { id: 'category-2', label: 'Category 2' },
      ])
      .mockResolvedValueOnce([]);

    const { result } = renderHook(
      () => {
        const form = useFormContext<InstrumentAndRequestStep>();
        // Reading formState during render subscribes the hook to its changes.
        const { dirtyFields, errors, isDirty } = form.formState;

        return {
          form,
          formState: { dirtyFields, errors, isDirty },
          lookups: useInstrumentAndRequestLookups(),
        };
      },
      { wrapper },
    );

    await waitFor(() => {
      expect(result.current.lookups.isLoading).toBe(false);
    });

    act(() => {
      // resetField only acts on registered fields, as in the rendered step.
      result.current.form.register('instrumentOrArtefactType');
      result.current.form.setValue('instrumentOrArtefactType', 'artefact-1', {
        shouldTouch: true,
      });
      result.current.form.setError('instrumentOrArtefactType', {
        message: 'Select an instrument or artefact type.',
      });
      result.current.lookups.onMeasurementCategoryChange('category-2');
    });

    const { form, formState } = result.current;

    expect(form.getValues('instrumentOrArtefactType')).toBe('');
    // Untouched, as resetting touched does.
    expect(form.getFieldState('instrumentOrArtefactType').isTouched).toBe(
      false,
    );
    // The cleared value differs from the saved baseline, so the form stays
    // dirty for the unsaved-changes prompt.
    expect({
      field: formState.dirtyFields.instrumentOrArtefactType,
      form: formState.isDirty,
    }).toStrictEqual({ field: true, form: true });
    // The existing error is kept until the next validation replaces it.
    expect(formState.errors.instrumentOrArtefactType?.message).toBe(
      'Select an instrument or artefact type.',
    );
  });

  it('defaults the instrument type to "No instrument" for the no-measurement category', async () => {
    expect.hasAssertions();

    resetMsalMock();
    clients.lookup.methods.getLookup.mockReset();
    wrapperInitialValues.value = { measurementCategory: 'category-1' };
    grantToken();
    clients.lookup.methods.getLookup
      .mockResolvedValueOnce([
        { id: 'category-1', label: 'Category 1' },
        { id: 'no-measurement', label: 'No measurement' },
      ])
      .mockResolvedValueOnce([
        { id: 'none', label: 'No instrument', parentId: 'no-measurement' },
        { id: 'other', label: 'Other', parentId: 'no-measurement' },
      ]);

    const { result } = renderHook(
      () => ({
        form: useFormContext<InstrumentAndRequestStep>(),
        lookups: useInstrumentAndRequestLookups(),
      }),
      { wrapper },
    );

    await waitFor(() => {
      expect(result.current.lookups.isLoading).toBe(false);
    });

    act(() => {
      result.current.lookups.onMeasurementCategoryChange('no-measurement');
    });

    expect(result.current.form.getValues('instrumentOrArtefactType')).toBe(
      'none',
    );
  });

  it('falls back to empty text for artefact types that lack a label or id', async () => {
    expect.hasAssertions();

    resetMsalMock();
    clients.lookup.methods.getLookup.mockReset();
    wrapperInitialValues.value = { measurementCategory: 'category-1' };
    grantToken();
    clients.lookup.methods.getLookup
      .mockResolvedValueOnce([{ id: 'category-1', label: 'Category 1' }])
      .mockResolvedValueOnce([
        { parentId: 'category-1' },
        { id: 'artefact-2', label: 'Artefact 2', parentId: 'category-1' },
      ]);

    const { result } = renderHook(() => useInstrumentAndRequestLookups(), {
      wrapper,
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.artefactTypesSelected).toStrictEqual(
      expect.arrayContaining([{ displayText: '', value: '' }]),
    );
  });
});
