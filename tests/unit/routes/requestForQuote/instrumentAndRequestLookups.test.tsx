import { renderHook } from '@testing-library/react';
import { Formik } from 'formik';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { useInstrumentAndRequestLookups } from '@/routes/requestForQuote/instrumentAndRequest';

// No signed-in account: the lookup effect's guard (`accounts.length > 0`) never
// runs, so measurementCategories stays undefined and the options builder has to
// use its empty-list fallback.
vi.mock('@azure/msal-react', () => ({
  useMsal: () => ({
    accounts: [],
    instance: { acquireTokenSilent: vi.fn() },
  }),
}));

const wrapper = ({ children }: { readonly children: ReactNode }) => (
  <Formik initialValues={{}} onSubmit={() => undefined}>
    {children}
  </Formik>
);

describe(useInstrumentAndRequestLookups, () => {
  it('returns no measurement category options before the lookups resolve', () => {
    const { result } = renderHook(() => useInstrumentAndRequestLookups(), {
      wrapper,
    });

    expect(result.current.getMeasurementCategories()).toEqual([]);
    expect(result.current.isLoading).toBe(true);
  });
});
