import { describe, it, expect } from 'vitest';
import { act, render, screen, waitFor } from '@testing-library/react';
import type * as WebApiClientModule from '@/api/web-api-client';
import InstrumentInfoPanel from '@/routes/ta/instrumentInfoPanel';

const mocks = vi.hoisted(() => {
  const acquireTokenSilent = vi.fn<(...args: unknown[]) => unknown>();

  return {
    acquireTokenSilent,
    getInfoPanelContent: vi.fn<(...args: unknown[]) => unknown>(),
    msalContext: {
      accounts: [{ localAccountId: 'account-id' }],
      instance: {
        acquireTokenSilent,
      },
    },
    setAuthToken: vi.fn<(...args: unknown[]) => unknown>(),
  };
});

vi.mock(
  import('@azure/msal-react'),
  (() =>
    ({
      useMsal: () => mocks.msalContext,
    }) satisfies __ExactMockModule<__TestMockModule2>) as unknown as __DynamicPartialMockFactory<__TestMockModule2>,
);

vi.mock(import('@/api/web-api-client'), (async (
  importOriginal: Parameters<__DynamicPartialMockFactory<__TestMockModule4>>[0],
) => {
  const actual = await importOriginal<typeof WebApiClientModule>();

  return {
    ...actual,
    LookupClient: vi.fn<(...args: unknown[]) => unknown>(
      function LookupClientMock() {
        return {
          getInfoPanelContent: mocks.getInfoPanelContent,
          setAuthToken: mocks.setAuthToken,
        };
      },
    ),
  } satisfies __ExactMockModule<__TestMockModule4>;
}) as unknown as __DynamicPartialMockFactory<__TestMockModule4>);

const categoryId = '11111111-1111-4111-8111-111111111111';
const typeId = '22222222-2222-4222-8222-222222222222';
const emptyGuid = '00000000-0000-0000-0000-000000000000';

const resetInstrumentInfoPanelMocks = () => {
  vi.clearAllMocks();
  mocks.acquireTokenSilent.mockResolvedValue({ accessToken: 'lookup-token' });
  mocks.getInfoPanelContent.mockResolvedValue([
    {
      requirements: 'Pattern approval evidence checklist',
      requirementsLink: 'https://example.test/pattern-approval-requirements',
    },
  ]);
};

// function suite titles are required by vitest/prefer-describe-function-title.
describe(InstrumentInfoPanel, () => {
  it('renders the hidden empty state and does not fetch lookup data when no instrument is selected', () => {
    expect.hasAssertions();

    resetInstrumentInfoPanelMocks();

    render(<InstrumentInfoPanel name='instrument' />);

    expect(
      screen.getByText('There are no References for this instrument type.'),
    ).toHaveClass('visually-hidden');
    expect(mocks.acquireTokenSilent).not.toHaveBeenCalled();
    expect(mocks.getInfoPanelContent).not.toHaveBeenCalled();
  });

  it('shows default guidance and new-customer credit form when only a category is selected', () => {
    expect.hasAssertions();

    resetInstrumentInfoPanelMocks();

    render(
      <InstrumentInfoPanel
        name='instrument'
        selectedInstrumentCategoryId={categoryId}
      />,
    );

    expect(screen.getByRole('alert')).toHaveAttribute('id', 'instrument-panel');
    expect(
      screen.getByText('References for this instrument type'),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/select an instrument category and type/i),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', {
        name: /download credit check application form/i,
      }),
    ).toHaveAttribute(
      'href',
      'https://www.industry.gov.au/sites/default/files/2025-07/NMI-credit-application-form.pdf',
    );
    expect(mocks.getInfoPanelContent).not.toHaveBeenCalled();
  });

  it('loads and renders lookup resource links for a valid category and type', async () => {
    expect.hasAssertions();

    resetInstrumentInfoPanelMocks();

    let resolveInfoPanelContent: (
      value: { requirements: string; requirementsLink: string }[],
    ) => void;
    const infoPanelContent = new Promise<
      { requirements: string; requirementsLink: string }[]
    >((resolve) => {
      resolveInfoPanelContent = resolve;
    });
    mocks.getInfoPanelContent.mockReturnValue(infoPanelContent);

    render(
      <InstrumentInfoPanel
        name='instrument'
        selectedInstrumentCategoryId={categoryId}
        selectedInstrumentTypeId={typeId}
        isNewCustomer={false}
      />,
    );

    await expect(
      screen.findByText('Loading data...'),
    ).resolves.toBeInTheDocument();

    await act(async () => {
      resolveInfoPanelContent!([
        {
          requirements: 'Pattern approval evidence checklist',
          requirementsLink:
            'https://example.test/pattern-approval-requirements',
        },
      ]);
      await infoPanelContent;
    });

    const requirementsLink = await screen.findByRole('link', {
      name: /pattern approval evidence checklist/i,
    });

    expect({
      requirementsHref: requirementsLink.getAttribute('href'),
      guidance: screen.queryByText(/select an instrument category and type/i),
      creditCheckLink: screen.queryByRole('link', {
        name: /download credit check application form/i,
      }),
    }).toStrictEqual({
      requirementsHref: 'https://example.test/pattern-approval-requirements',
      guidance: null,
      creditCheckLink: null,
    });

    await waitFor(() => {
      expect(mocks.setAuthToken).toHaveBeenCalledWith('lookup-token');
    });

    expect(mocks.getInfoPanelContent).toHaveBeenCalledWith(typeId, categoryId);
  });

  it('keeps default guidance and skips the lookup for empty or invalid GUID selections', () => {
    expect.hasAssertions();

    resetInstrumentInfoPanelMocks();

    const { rerender } = render(
      <InstrumentInfoPanel
        name='instrument'
        selectedInstrumentCategoryId={emptyGuid}
        selectedInstrumentTypeId={typeId}
      />,
    );

    expect({
      alert: screen.getByRole('alert').textContent,
      guidance: screen.getByText(/select an instrument category and type/i)
        .textContent,
      calls: mocks.getInfoPanelContent.mock.calls,
    }).toStrictEqual({
      alert: expect.any(String) as unknown,
      guidance: expect.stringMatching(
        /select an instrument category and type/i,
      ) as unknown,
      calls: [],
    });

    rerender(
      <InstrumentInfoPanel
        name='instrument'
        selectedInstrumentCategoryId='not-a-guid'
        selectedInstrumentTypeId='also-not-a-guid'
      />,
    );

    expect({
      alert: screen.getByRole('alert').textContent,
      guidance: screen.getByText(/select an instrument category and type/i)
        .textContent,
      calls: mocks.getInfoPanelContent.mock.calls,
    }).toStrictEqual({
      alert: expect.any(String) as unknown,
      guidance: expect.stringMatching(
        /select an instrument category and type/i,
      ) as unknown,
      calls: [],
    });
  });
});
