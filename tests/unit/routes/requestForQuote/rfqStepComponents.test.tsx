import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router';
import { describe, expect, it, vi } from 'vitest';
import type * as WebApiClient from '../../../../ClientApp/src/api/web-api-client';
import type { InstrumentAndRequestStep } from '../../../../ClientApp/src/api/web-api-client';
import { YesNo } from '../../../../ClientApp/src/api/web-api-client';
import RhfForm from '../../../../ClientApp/src/components/forms/RhfForm';
import { ModalDispatchContext } from '../../../../ClientApp/src/components/modals/ModalContext';
import type { ModalDispatch } from '../../../../ClientApp/src/components/modals/ModalContext';
import InstrumentAndRequest from '../../../../ClientApp/src/routes/requestForQuote/instrumentAndRequest';
import OrganisationAndContact from '../../../../ClientApp/src/routes/requestForQuote/organisationAndContact';
import { grantToken, resetMsalMock, signOut } from '../../helpers/mockMsal';
import type { ClientMockOf } from '../../helpers/mockApiClient';

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

const setShowRFQSelectModal = vi.fn<ModalDispatch['setShowRFQSelectModal']>();
const modalDispatch: ModalDispatch = {
  setShowBranchSelector: vi.fn<ModalDispatch['setShowBranchSelector']>(),
  setShowRFQDeleteModal: vi.fn<ModalDispatch['setShowRFQDeleteModal']>(),
  setShowRFQSelectModal,
};

const renderStep = (
  path: string,
  routePath: string,
  initialValues: Record<string, unknown>,
  step: React.ReactElement,
) =>
  render(
    <ModalDispatchContext value={modalDispatch}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route
            path={routePath}
            element={
              <RhfForm initialValues={initialValues} onSubmit={() => undefined}>
                {step}
              </RhfForm>
            }
          />
        </Routes>
      </MemoryRouter>
    </ModalDispatchContext>,
  );

const organisationValues: Record<string, unknown> = {
  sourceReferenceId: 'SOURCE-1',
  isCorrectBranchOrLocation: YesNo.No,
  organisationCount: '2',
  businessOrTradingName: 'Trading',
  branchOrLocationName: 'Branch',
  name: 'National Measurement Institute',
  abn: '12345678901',
  currentContact: {
    title: 'Dr' as unknown,
    firstName: 'Alex',
    lastName: 'Tester',
    email: 'alex@example.test',
  },
};

const resetMocks = () => {
  resetMsalMock();
  grantToken();
  setShowRFQSelectModal.mockReset();
  clients.lookup.methods.getLookup.mockReset();
  clients.lookup.methods.getLookup
    .mockResolvedValueOnce([
      { id: 'measurement-1', label: 'Mass' },
      { id: 'no-measurement', label: 'No measurement' },
    ])
    .mockResolvedValueOnce([
      { id: 'artefact-1', parentId: 'measurement-1', label: 'Balance' },
      {
        id: 'no-instrument',
        parentId: 'no-measurement',
        label: 'No instrument',
      },
    ]);
};

const renderInstrument = (initialValues: Partial<InstrumentAndRequestStep>) =>
  renderStep(
    '/request-for-quote/RFQ-1/instrument-and-request',
    '/request-for-quote/:id/*',
    initialValues,
    <InstrumentAndRequest />,
  );

// function suite titles are required by vitest/prefer-describe-function-title.
describe(OrganisationAndContact, () => {
  it('shows the recalibration notice and opens the branch selector', () => {
    expect.hasAssertions();

    resetMocks();
    renderStep(
      '/request-for-quote/RFQ-1/organisation-and-contact',
      '/request-for-quote/:id/*',
      organisationValues,
      <OrganisationAndContact />,
    );

    expect(screen.getByText('Organisation details')).toBeInTheDocument();
    expect(
      screen.getByText(/This "Recalibration Request" is prefilled/),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('open-manage-branch-division-button'));

    expect(setShowRFQSelectModal).toHaveBeenCalledWith(
      true,
      'RFQ-1',
      '/request-for-quote/RFQ-1/organisation-and-contact',
    );
  });

  it('disables the branch selector until the branch answer is No', () => {
    expect.hasAssertions();

    resetMocks();
    renderStep(
      '/request-for-quote/RFQ-1/organisation-and-contact',
      '/request-for-quote/:id/*',
      { ...organisationValues, isCorrectBranchOrLocation: undefined },
      <OrganisationAndContact />,
    );

    expect(
      screen.getByTestId('open-manage-branch-division-button'),
    ).toBeDisabled();
  });

  it('omits the branch selector when the organisation values are absent', () => {
    expect.hasAssertions();

    resetMocks();
    renderStep(
      '/request-for-quote/RFQ-1/organisation-and-contact',
      '/request-for-quote/:id/*',
      { name: 'National Measurement Institute' },
      <OrganisationAndContact />,
    );

    expect(screen.getByText('Organisation details')).toBeInTheDocument();
    expect(
      screen.queryByTestId('open-manage-branch-division-button'),
    ).not.toBeInTheDocument();
  });

  it('opens the branch selector with an empty request id when the route id is omitted', () => {
    expect.hasAssertions();

    resetMocks();
    renderStep(
      '/organisation-and-contact',
      '/organisation-and-contact',
      organisationValues,
      <OrganisationAndContact />,
    );
    fireEvent.click(screen.getByTestId('open-manage-branch-division-button'));

    expect(setShowRFQSelectModal).toHaveBeenCalledWith(
      true,
      '',
      '/organisation-and-contact',
    );
  });
});

// function suite titles are required by vitest/prefer-describe-function-title.
describe(InstrumentAndRequest, () => {
  it('renders both sections once the lookups load', async () => {
    expect.hasAssertions();

    resetMocks();
    renderInstrument({ measurementCategory: 'measurement-1' });

    await expect(
      screen.findByText('Instrument/artefact details'),
    ).resolves.toBeInTheDocument();
    expect(
      screen.getByText('Testing/calibration requirements'),
    ).toBeInTheDocument();
  });

  it('locks the instrument type for an initial no-measurement category', async () => {
    expect.hasAssertions();

    resetMocks();
    renderInstrument({ measurementCategory: 'no-measurement' });

    await waitFor(() => {
      expect(screen.getByLabelText('Instrument/artefact type')).toHaveAttribute(
        'readonly',
      );
    });
  });

  it('offers an empty artefact list when there is no measurement category', async () => {
    expect.hasAssertions();

    resetMocks();
    renderInstrument({});

    await screen.findByText('Instrument/artefact details');

    expect(
      screen.getByLabelText('Instrument/artefact type'),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('option', { name: 'Balance' }),
    ).not.toBeInTheDocument();
  });

  it('clears the instrument type and offers its options on a regular category change', async () => {
    expect.hasAssertions();

    resetMocks();
    renderInstrument({
      measurementCategory: 'no-measurement',
      instrumentOrArtefactType: 'no-instrument',
    });
    await screen.findByText('Instrument/artefact details');

    await userEvent.selectOptions(
      screen.getByLabelText('Measurement category'),
      'measurement-1',
    );

    const type = screen.getByLabelText('Instrument/artefact type');
    await waitFor(() => {
      expect(type).toHaveValue('');
    });

    expect(type).not.toHaveAttribute('readonly');
    expect(screen.getByRole('option', { name: 'Balance' })).toBeInTheDocument();
  });

  it('defaults and locks the instrument type when the no-measurement category is chosen', async () => {
    expect.hasAssertions();

    resetMocks();
    renderInstrument({
      measurementCategory: 'measurement-1',
      instrumentOrArtefactType: 'artefact-1',
    });
    await screen.findByText('Instrument/artefact details');

    await userEvent.selectOptions(
      screen.getByLabelText('Measurement category'),
      'no-measurement',
    );

    await waitFor(() => {
      expect(screen.getByLabelText('Instrument/artefact type')).toHaveValue(
        'No instrument',
      );
    });

    expect(screen.getByLabelText('Instrument/artefact type')).toHaveAttribute(
      'readonly',
    );
  });

  it('keeps the lookups loading when no MSAL account is available', () => {
    expect.hasAssertions();

    resetMocks();
    signOut();
    renderInstrument({});

    expect(
      screen.queryByText('Instrument/artefact details'),
    ).not.toBeInTheDocument();
    expect(clients.lookup.methods.getLookup).not.toHaveBeenCalled();
  });
});
