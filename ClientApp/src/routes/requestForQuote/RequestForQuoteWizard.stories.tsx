import { http, HttpResponse } from 'msw/http';
import { expect, waitFor, within } from 'storybook/test';
import preview from '../../../../.storybook/preview';
import RequestForQuote from '.';
import { withPortalProviders } from '../../storybook/storybookHarness';

const APPLICATION_ID = 'RFQ-2024-000777';
const BASE = `/request-for-quote/${APPLICATION_ID}`;

const organisationValues = {
  abn: '12345678901',
  name: 'Calibration Services Pty Ltd',
  businessOrTradingName: 'Calibration Services',
  branchOrLocationName: 'Sydney Laboratory',
  organisationCount: 1,
  isPrincipalContact: 'Yes',
  currentContact: {
    title: 'Ms',
    firstName: 'Taylor',
    lastName: 'Nguyen',
    email: 'taylor.nguyen@example.com',
  },
  contact: {},
};

const instrumentValues = {
  hasSerialNumber: 'Yes',
  serialNumber: 'SN-100',
  manufacturer: 'Fluke',
  model: '1524',
  description: 'Reference thermometer',
  numberOfItems: 2,
  measurementCategory: 'electrical',
  instrumentOrArtefactType: 'digital-thermometer',
  preferredInstrumentOrArtefactAvailabilityDate: '2099-06-01T00:00:00Z',
  previousQuoteOrReportNumber: 'Q230123',
  testingAndCalibrationRequirements: 'Calibrate across the field range',
  measurementReportAndCertificateRequired: 'MeasurementReportOnly',
};

const summaryValues = {
  organisationAndContact: {
    ...organisationValues,
    isPrincipalContact: 'No',
    contact: {
      title: 'Other',
      titleOther: 'Dr',
      firstName: 'Sam',
      lastName: 'Lee',
      email: 'sam.lee@example.com',
      businessPhone: '02 1234 5678',
    },
  },
  instrumentAndRequest: {
    ...instrumentValues,
    preferredInstrumentOrArtefactAvailabilityDate: '2099-06-01T00:00:00Z',
  },
};

interface WizardObservations {
  organisationBodies: unknown[];
  instrumentBodies: unknown[];
  submitBodies: unknown[];
}

const state: { observed: WizardObservations } = {
  observed: { organisationBodies: [], instrumentBodies: [], submitBodies: [] },
};

const resetObservations = () => {
  state.observed = {
    organisationBodies: [],
    instrumentBodies: [],
    submitBodies: [],
  };
};

const statuses = (...values: string[]) =>
  http.get('/api/request-for-quote/:id/step-statuses', () =>
    HttpResponse.json(values.map((status) => ({ status }))),
  );

const savedBody =
  (
    sink: unknown[],
    respond: () => Response = () => new HttpResponse(null, { status: 204 }),
  ) =>
  async ({ request }: { request: Request }) => {
    sink.push(await request.json());
    return respond();
  };

const wizardHandlers = (
  organisation: Record<string, unknown> = organisationValues,
  instrument: Record<string, unknown> = instrumentValues,
) => [
  http.get('/api/request-for-quote/:id/organisation-and-contact', () =>
    HttpResponse.json(organisation),
  ),
  http.put(
    '/api/request-for-quote/:id/organisation-and-contact',
    savedBody(state.observed.organisationBodies),
  ),
  http.get('/api/request-for-quote/:id/instrument-and-request', () =>
    HttpResponse.json(instrument),
  ),
  http.put(
    '/api/request-for-quote/:id/instrument-and-request',
    savedBody(state.observed.instrumentBodies),
  ),
  http.get('/api/request-for-quote/:id/summary', () =>
    HttpResponse.json(summaryValues),
  ),
  http.put(
    '/api/request-for-quote/:id/submit',
    savedBody(state.observed.submitBodies),
  ),
];

const meta = preview.meta({
  title: 'Routes/RequestForQuote/Wizard',
  component: RequestForQuote,
  decorators: [withPortalProviders],
  beforeEach: () => {
    resetObservations();
    return resetObservations;
  },
  parameters: {
    layout: 'fullscreen',
    docs: { story: { inline: false } },
    portal: {
      authenticated: true,
      routePath: '/request-for-quote/:id/*',
      initialEntries: [`${BASE}/organisation-and-contact`],
      destinationRoutes: [
        { path: '/', element: <h1>Exit destination</h1> },
        {
          path: '/request-for-quote-success/:id',
          element: <h1>Submitted destination</h1>,
        },
        { path: '/not-found', element: <h1>Not found destination</h1> },
      ],
    },
  },
});

export const OrganisationStepSavesAndMovesOn = meta.story({
  beforeEach({ msw }) {
    msw.use(statuses('NotStarted', 'NotStarted', 'NotStarted'));
    msw.use(...wizardHandlers());
  },
  play: async ({ canvas, userEvent }) => {
    await expect(
      await canvas.findByText('Calibration Services Pty Ltd'),
    ).toBeVisible();
    await userEvent.click(
      await canvas.findByRole('button', { name: 'Save and next' }),
    );

    await expect(
      await canvas.findByRole('heading', {
        name: 'Instrument/artefact details',
      }),
    ).toBeVisible();
    await expect(state.observed.organisationBodies).toHaveLength(1);
    await expect(state.observed.organisationBodies[0]).toMatchObject({
      applicationId: APPLICATION_ID,
      isCompletingStep: true,
      formStep: {
        abn: '12345678901',
        isPrincipalContact: 'Yes',
        organisationCount: 1,
      },
    });
  },
});

export const OrganisationStepSaveAndExitSavesDraft = meta.story({
  beforeEach({ msw }) {
    msw.use(statuses('NotStarted', 'NotStarted', 'NotStarted'));
    msw.use(...wizardHandlers());
  },
  play: async ({ canvas, userEvent }) => {
    await canvas.findByText('Calibration Services Pty Ltd');
    await userEvent.click(
      await canvas.findByRole('button', {
        name: 'Save and exit',
        hidden: true,
      }),
    );

    await expect(
      await canvas.findByRole('heading', { name: 'Exit destination' }),
    ).toBeVisible();
    await expect(state.observed.organisationBodies).toHaveLength(1);
    await expect(state.observed.organisationBodies[0]).toMatchObject({
      applicationId: APPLICATION_ID,
      isCompletingStep: false,
    });
  },
});

export const DifferentContactRequiresContactDetails = meta.story({
  beforeEach({ msw }) {
    msw.use(statuses('NotStarted', 'NotStarted', 'NotStarted'));
    msw.use(
      ...wizardHandlers({
        ...organisationValues,
        isPrincipalContact: 'No',
        contact: {},
      }),
    );
  },
  play: async ({ canvas, userEvent }) => {
    await canvas.findByText('Calibration Services Pty Ltd');
    await userEvent.click(
      await canvas.findByRole('button', { name: 'Save and next' }),
    );

    await expect(
      await canvas.findByRole('link', { name: /First name/ }),
    ).toBeVisible();
    await expect(state.observed.organisationBodies).toHaveLength(0);
  },
});

export const InstrumentStepSavesPayloadWithApiDate = meta.story({
  parameters: {
    portal: { initialEntries: [`${BASE}/instrument-and-request`] },
  },
  beforeEach({ msw }) {
    msw.use(statuses('Completed', 'NotStarted', 'NotStarted'));
    msw.use(...wizardHandlers());
  },
  play: async ({ canvas, userEvent }) => {
    await canvas.findByRole('heading', { name: 'Instrument/artefact details' });
    await waitFor(() =>
      expect(canvas.getByLabelText('Manufacturer')).toHaveValue('Fluke'),
    );
    await expect(
      canvas.getByLabelText(
        'Preferred Instrument/artefact availability date (optional)',
      ),
    ).toHaveValue('01/06/2099');
    await userEvent.click(
      canvas.getByRole('button', { name: 'Save and next' }),
    );

    await expect(
      await canvas.findByRole('heading', { name: 'Summary and submit' }),
    ).toBeVisible();
    await expect(state.observed.instrumentBodies).toEqual([
      {
        applicationId: APPLICATION_ID,
        isCompletingStep: true,
        formStep: {
          ...instrumentValues,
          preferredInstrumentOrArtefactAvailabilityDate:
            '2099-06-01T00:00:00.000Z',
        },
      },
    ]);
  },
});

export const InstrumentCategoryChangeResetsTypeAndLocksOnNoMeasurement =
  meta.story({
    parameters: {
      portal: { initialEntries: [`${BASE}/instrument-and-request`] },
    },
    beforeEach({ msw }) {
      msw.use(statuses('Completed', 'NotStarted', 'NotStarted'));
      msw.use(...wizardHandlers());
    },
    play: async ({ canvas, userEvent }) => {
      await canvas.findByRole('heading', {
        name: 'Instrument/artefact details',
      });
      await waitFor(() =>
        expect(canvas.getByLabelText('Instrument/artefact type')).toHaveValue(
          'digital-thermometer',
        ),
      );

      await userEvent.selectOptions(
        canvas.getByLabelText('Measurement category'),
        'mass',
      );
      await expect(
        canvas.getByLabelText('Instrument/artefact type'),
      ).toHaveValue('');

      await userEvent.selectOptions(
        canvas.getByLabelText('Measurement category'),
        'no-measurement',
      );
      const readOnlyType = await canvas.findByRole('textbox', {
        name: 'Instrument/artefact type',
      });

      await expect(readOnlyType).toHaveAttribute('readonly');
      await expect(readOnlyType).toHaveValue(
        'No instrument/artefact type available',
      );

      await userEvent.click(
        canvas.getByRole('button', { name: 'Save and exit', hidden: true }),
      );
      await waitFor(() =>
        expect(state.observed.instrumentBodies).toHaveLength(1),
      );
      await expect(state.observed.instrumentBodies[0]).toMatchObject({
        isCompletingStep: false,
        formStep: {
          measurementCategory: 'no-measurement',
          instrumentOrArtefactType: 'no-instrument',
        },
      });
    },
  });

export const SerialNumberIsHiddenAndOmittedWhenNotAvailable = meta.story({
  parameters: {
    portal: { initialEntries: [`${BASE}/instrument-and-request`] },
  },
  beforeEach({ msw }) {
    msw.use(statuses('Completed', 'NotStarted', 'NotStarted'));
    msw.use(...wizardHandlers());
  },
  play: async ({ canvas, userEvent }) => {
    await canvas.findByRole('heading', { name: 'Instrument/artefact details' });
    await waitFor(() =>
      expect(canvas.getByLabelText('Serial number')).toHaveValue('SN-100'),
    );

    await userEvent.click(canvas.getByRole('radio', { name: 'No' }));
    await expect(canvas.queryByLabelText('Serial number')).toBeNull();

    await userEvent.click(
      canvas.getByRole('button', { name: 'Save and next' }),
    );
    await waitFor(() =>
      expect(state.observed.instrumentBodies).toHaveLength(1),
    );
    const body = state.observed.instrumentBodies[0] as {
      formStep: Record<string, unknown>;
    };

    await expect(body.formStep).toMatchObject({ hasSerialNumber: 'No' });
    await expect(body.formStep).not.toHaveProperty('serialNumber');
  },
});

export const InstrumentStepBlocksInvalidSubmit = meta.story({
  parameters: {
    portal: { initialEntries: [`${BASE}/instrument-and-request`] },
  },
  beforeEach({ msw }) {
    msw.use(statuses('Completed', 'NotStarted', 'NotStarted'));
    msw.use(
      ...wizardHandlers(organisationValues, {
        ...instrumentValues,
        manufacturer: '',
        preferredInstrumentOrArtefactAvailabilityDate: '2001-01-01T00:00:00Z',
      }),
    );
  },
  play: async ({ canvas, userEvent }) => {
    await canvas.findByRole('heading', { name: 'Instrument/artefact details' });
    await waitFor(() =>
      expect(canvas.getByLabelText('Model')).toHaveValue('1524'),
    );
    await userEvent.click(
      canvas.getByRole('button', { name: 'Save and next' }),
    );

    await expect(
      await canvas.findByRole('link', { name: /Manufacturer/ }),
    ).toBeVisible();
    await expect(
      await canvas.findByRole('link', { name: /earlier than today/ }),
    ).toBeVisible();
    await expect(state.observed.instrumentBodies).toHaveLength(0);
  },
});

export const SummaryShowsAnswersAndSubmitsAfterConfirmation = meta.story({
  parameters: { portal: { initialEntries: [`${BASE}/summary`] } },
  beforeEach({ msw }) {
    msw.use(statuses('Completed', 'Completed', 'NotStarted'));
    msw.use(...wizardHandlers());
  },
  play: async ({ canvas, userEvent }) => {
    await expect(
      await canvas.findByText('Request details'),
    ).toBeInTheDocument();
    await expect(canvas.getByText('Sam')).toBeInTheDocument();
    await expect(canvas.getByText('Dr')).toBeInTheDocument();
    await expect(canvas.getByText('Fluke')).toBeInTheDocument();

    await userEvent.click(canvas.getByRole('button', { name: 'Submit' }));
    await userEvent.click(
      within(await within(document.body).findByRole('dialog')).getByRole(
        'button',
        { name: 'Yes, submit' },
      ),
    );

    await expect(
      await canvas.findByRole('heading', { name: 'Submitted destination' }),
    ).toBeVisible();
    await expect(state.observed.submitBodies).toHaveLength(1);
    await expect(state.observed.submitBodies[0]).toMatchObject({
      applicationId: APPLICATION_ID,
      isCompletingStep: true,
      formStep: summaryValues,
    });
  },
});

export const BackLinkReturnsToPreviousStep = meta.story({
  parameters: {
    portal: { initialEntries: [`${BASE}/instrument-and-request`] },
  },
  beforeEach({ msw }) {
    msw.use(statuses('Completed', 'NotStarted', 'NotStarted'));
    msw.use(...wizardHandlers());
  },
  play: async ({ canvas, userEvent }) => {
    await canvas.findByRole('heading', { name: 'Instrument/artefact details' });
    await userEvent.click(canvas.getByRole('link', { name: 'Back' }));

    await expect(
      await canvas.findByRole('heading', { name: 'Organisation details' }),
    ).toBeVisible();
  },
});
