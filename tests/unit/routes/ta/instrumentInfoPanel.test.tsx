import { describe, beforeEach, it, expect } from 'vitest';

import { act, render, screen, waitFor } from '@testing-library/react';

import type * as WebApiClientModule from '@/api/web-api-client';

import InstrumentInfoPanel from '@/routes/ta/instrumentInfoPanel';

const mocks = vi.hoisted(() => {
  const acquireTokenSilent = vi.fn();

  return {
    acquireTokenSilent,
    getInfoPanelContent: vi.fn(),
    msalContext: {
      accounts: [{ localAccountId: 'account-id' }],
      instance: {
        acquireTokenSilent,
      },
    },
    setAuthToken: vi.fn(),
  };
});

vi.mock(
  import('@azure/msal-react'),
  () =>
    ({
      useMsal: () => mocks.msalContext,
    }) satisfies __ExactMockModule<__TestMockModule2>,
);

vi.mock(import('@/api/web-api-client'), async (importOriginal) => {
  const actual = await importOriginal<typeof WebApiClientModule>();

  return {
    ...actual,
    LookupClient: vi.fn(function LookupClientMock() {
      return {
        getInfoPanelContent: mocks.getInfoPanelContent,
        setAuthToken: mocks.setAuthToken,
      };
    }),
  } satisfies __ExactMockModule<__TestMockModule4>;
});

const categoryId = '11111111-1111-4111-8111-111111111111';

const typeId = '22222222-2222-4222-8222-222222222222';

const emptyGuid = '00000000-0000-0000-0000-000000000000';

describe(InstrumentInfoPanel, () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.acquireTokenSilent.mockResolvedValue({ accessToken: 'lookup-token' });
    mocks.getInfoPanelContent.mockResolvedValue([
      {
        requirements: 'Pattern approval evidence checklist',
        requirementsLink: 'https://example.test/pattern-approval-requirements',
      },
    ]);
  });
  it('renders the hidden empty state and does not fetch lookup data when no instrument is selected', () => {
    expect.assertions(3);
    render(<InstrumentInfoPanel name='instrument' />);

    expect(
      screen.getByText('There are no References for this instrument type.'),
    ).toHaveClass('visually-hidden');
    expect(mocks.acquireTokenSilent).not.toHaveBeenCalled();
    expect(mocks.getInfoPanelContent).not.toHaveBeenCalled();
  });
});
