import { http, HttpResponse } from 'msw/http';
import { expect, waitFor, within } from 'storybook/test';
import preview from '../../../../.storybook/preview';
import ApplicationForTypeApproval from '.';
import { withPortalProviders } from '../../storybook/storybookHarness';

/**
 * Characterization of the type-approval wizard: exact save/submit payloads, hidden
 * fields, reset/untouch behaviour and inline validation. These stories were written
 * and run against the Formik shell first and must pass unchanged on the RHF shell.
 */
const APPLICATION_ID = 'TA-2024-000555';
const BASE = `/ta/${APPLICATION_ID}`;

const orgValues = {
  abn: '12345678901',
  name: 'Gauge Makers Pty Ltd',
  businessOrTradingName: 'Gauge Makers',
  branchOrLocationName: 'Melbourne',
  organisationCount: 1,
  isManufacturer: 'Yes',
  isPrincipalContact: 'Yes',
  isPrincipalInvoiceContact: 'Yes',
  currentContact: {
    title: 'Ms',
    firstName: 'Taylor',
    lastName: 'Nguyen',
    email: 'taylor.nguyen@example.com',
  },
  contact: {},
  invoiceContact: {},
};

const categories = [
  { id: 'cat-weigh', label: 'Weighing instruments' },
  { id: 'cat-meter', label: 'Utility meters' },
  { id: 'cat-none', label: 'No measurement' },
];

const instrumentTypes = [
  { id: 'type-scale', label: 'Non-automatic scale', parentId: 'cat-weigh' },
  { id: 'type-belt', label: 'Belt weigher', parentId: 'cat-weigh' },
  { id: 'type-elec', label: 'Electricity meter', parentId: 'cat-meter' },
  { id: 'type-none', label: 'No instrument', parentId: 'cat-none' },
];

const certificateOptions = [
  { id: 'cert-1', lookupName: 'S 1/6A/91B' },
  { id: 'cert-2', lookupName: 'S 2/6A/92C' },
];

const applicationValues = {
  patternApprovalType: 'NewCertificate',
  newSubOptions: ['CertificateofApproval'],
  instrumentCategory: 'cat-weigh',
  instrumentType: 'type-scale',
  make: 'Acme',
  model: 'A-100',
  summary: 'A new scale',
};

const documentsValues = {
  form: {
    documents: [
      {
        id: 'doc-1',
        attachmentName: 'drawing.pdf',
        attachmentCategory: 'Drawings',
        attachmentMimeType: 'application/pdf',
        attachmentSize: '12 KB',
      },
    ],
  },
};

const summaryValues = {
  organisationAndContact: orgValues,
  applicationAndInstrument: applicationValues,
  supportingDocuments: documentsValues,
};

interface WizardObservations {
  organisationBodies: unknown[];
  applicationBodies: unknown[];
  documentBodies: unknown[];
  submitBodies: unknown[];
}

const state: { observed: WizardObservations } = {
  observed: {
    organisationBodies: [],
    applicationBodies: [],
    documentBodies: [],
    submitBodies: [],
  },
};

const resetObservations = () => {
  state.observed = {
    organisationBodies: [],
    applicationBodies: [],
    documentBodies: [],
    submitBodies: [],
  };
};

const statuses = (...values: string[]) =>
  http.get('/api/request-for-pattern-approval/:id/step-statuses', () =>
    HttpResponse.json(values.map((status) => ({ status }))),
  );

const savedBody =
  (sink: unknown[]) =>
  async ({ request }: { request: Request }) => {
    sink.push(await request.json());
    return new HttpResponse(null, { status: 204 });
  };

const wizardHandlers = ({
  organisation = orgValues,
  application = applicationValues,
  documents = documentsValues,
}: {
  organisation?: Record<string, unknown>;
  application?: Record<string, unknown>;
  documents?: Record<string, unknown>;
} = {}) => [
  http.get('/api/lookup', ({ request }) => {
    const lookupType = new URL(request.url).searchParams.get('LookupType');
    return HttpResponse.json(
      lookupType === 'PAPortalCategory' ? categories : instrumentTypes,
    );
  }),
  http.get('/api/lookup/all-info-panel-content', () => HttpResponse.json([])),
  http.get('/api/lookup/nmi-application', () =>
    HttpResponse.json(certificateOptions),
  ),
  http.get(
    '/api/request-for-pattern-approval/:id/organisation-and-contact',
    () => HttpResponse.json(organisation),
  ),
  http.put(
    '/api/request-for-pattern-approval/:id/organisation-and-contact',
    savedBody(state.observed.organisationBodies),
  ),
  http.get(
    '/api/request-for-pattern-approval/:id/application-and-instrument',
    () => HttpResponse.json(application),
  ),
  http.put(
    '/api/request-for-pattern-approval/:id/application-and-instrument',
    savedBody(state.observed.applicationBodies),
  ),
  http.get('/api/request-for-pattern-approval/:id/supporting-documents', () =>
    HttpResponse.json(documents),
  ),
  http.put(
    '/api/request-for-pattern-approval/:id/supporting-documents',
    savedBody(state.observed.documentBodies),
  ),
  http.get('/api/request-for-pattern-approval/:id/summary', () =>
    HttpResponse.json(summaryValues),
  ),
  http.put(
    '/api/request-for-pattern-approval/:id/submit',
    savedBody(state.observed.submitBodies),
  ),
];

const meta = preview.meta({
  title: 'Routes/TypeApproval/Wizard',
  component: ApplicationForTypeApproval,
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
      routePath: '/ta/:id/*',
      initialEntries: [`${BASE}/organisation-details`],
      destinationRoutes: [
        { path: '/', element: <h1>Exit destination</h1> },
        {
          path: '/ta/type-approval-success/:id',
          element: <h1>Submitted destination</h1>,
        },
        { path: '/not-found', element: <h1>Not found destination</h1> },
      ],
    },
  },
});

interface RoleQueries {
  getByRole: (role: string, options?: { name: RegExp }) => HTMLElement;
}

const waitForOrganisationLoaded = async (canvas: RoleQueries) => {
  await waitFor(() =>
    expect(canvas.getByRole('radio', { name: /^Manufacturer/ })).toBeChecked(),
  );
};

const orgSteps = ['NotStarted', 'NotStarted', 'NotStarted', 'NotStarted'];
const appSteps = ['Completed', 'NotStarted', 'NotStarted', 'NotStarted'];

export const OrganisationStepSavesAndMovesOn = meta.story({
  beforeEach({ msw }) {
    msw.use(statuses(...orgSteps));
    msw.use(...wizardHandlers());
  },
  play: async ({ canvas, userEvent }) => {
    await waitForOrganisationLoaded(canvas);
    await userEvent.click(
      await canvas.findByRole('button', { name: 'Save and next' }),
    );

    await expect(
      await canvas.findByRole('heading', { name: 'Application details' }),
    ).toBeVisible();
    await expect(state.observed.organisationBodies).toHaveLength(1);
    await expect(state.observed.organisationBodies[0]).toEqual({
      applicationId: APPLICATION_ID,
      isCompletingStep: true,
      formStep: orgValues,
    });
  },
});

export const OrganisationStepSaveAndExitSavesDraft = meta.story({
  beforeEach({ msw }) {
    msw.use(statuses(...orgSteps));
    msw.use(...wizardHandlers());
  },
  play: async ({ canvas, userEvent }) => {
    await waitForOrganisationLoaded(canvas);
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
    await expect(state.observed.organisationBodies[0]).toEqual({
      applicationId: APPLICATION_ID,
      isCompletingStep: false,
      formStep: orgValues,
    });
  },
});

const agentValues = {
  ...orgValues,
  isManufacturer: 'No',
  authorisedAgent: { manufacturerName: 'Agent Co', abn: '11223344556' },
};

export const AuthorisedAgentFieldsFollowOrganisationType = meta.story({
  beforeEach({ msw }) {
    msw.use(statuses(...orgSteps));
    msw.use(...wizardHandlers({ organisation: agentValues }));
  },
  play: async ({ canvas, userEvent }) => {
    await waitFor(() =>
      expect(
        canvas.getByRole('radio', { name: /^Authorised Agent/ }),
      ).toBeChecked(),
    );
    await expect(canvas.getByLabelText('Manufacturer name')).toHaveValue(
      'Agent Co',
    );
    await expect(canvas.getByLabelText('Company Identifier')).toHaveValue(
      '11 223 344 556',
    );

    await userEvent.click(canvas.getByRole('radio', { name: /^Manufacturer/ }));
    await expect(canvas.queryByLabelText('Manufacturer name')).toBeNull();

    await userEvent.click(
      canvas.getByRole('button', { name: 'Save and exit', hidden: true }),
    );
    await waitFor(() =>
      expect(state.observed.organisationBodies).toHaveLength(1),
    );
    await expect(state.observed.organisationBodies[0]).toEqual({
      applicationId: APPLICATION_ID,
      isCompletingStep: false,
      // Hidden agent fields are not stripped from the payload.
      formStep: { ...agentValues, isManufacturer: 'Yes' },
    });
  },
});

export const AuthorisedAgentPayloadKeepsAgentFields = meta.story({
  beforeEach({ msw }) {
    msw.use(statuses(...orgSteps));
    msw.use(...wizardHandlers({ organisation: agentValues }));
  },
  play: async ({ canvas, userEvent }) => {
    await waitFor(() =>
      expect(
        canvas.getByRole('radio', { name: /^Authorised Agent/ }),
      ).toBeChecked(),
    );
    await userEvent.type(canvas.getByLabelText('Manufacturer name'), ' Ltd');
    await userEvent.click(
      canvas.getByRole('button', { name: 'Save and exit', hidden: true }),
    );
    await waitFor(() =>
      expect(state.observed.organisationBodies).toHaveLength(1),
    );
    await expect(state.observed.organisationBodies[0]).toEqual({
      applicationId: APPLICATION_ID,
      isCompletingStep: false,
      formStep: {
        ...agentValues,
        authorisedAgent: {
          manufacturerName: 'Agent Co Ltd',
          abn: '11223344556',
        },
      },
    });
  },
});

export const DifferentContactRequiresContactDetails = meta.story({
  beforeEach({ msw }) {
    msw.use(statuses(...orgSteps));
    msw.use(
      ...wizardHandlers({
        organisation: { ...orgValues, isPrincipalContact: 'No', contact: {} },
      }),
    );
  },
  play: async ({ canvas, userEvent }) => {
    await waitFor(() =>
      expect(
        canvas.getAllByRole('radio', { name: /A different contact person/ })[0],
      ).toBeChecked(),
    );
    await userEvent.click(
      await canvas.findByRole('button', { name: 'Save and next' }),
    );

    await expect(
      await canvas.findByRole('link', { name: /First name/ }),
    ).toBeVisible();
    await expect(state.observed.organisationBodies).toHaveLength(0);
    await expect(
      await canvas.findByRole('link', { name: /Last name/ }),
    ).toBeVisible();
    await expect(
      await canvas.findByRole('link', { name: /Email/ }),
    ).toBeVisible();
  },
});

/**
 * RHF deviation from Formik, which showed these fields in the error summary only:
 * each missing contact field now also carries `aria-invalid` and an accessible
 * description naming the problem.
 */
export const DifferentContactShowsInlineErrors = meta.story({
  beforeEach({ msw }) {
    msw.use(statuses(...orgSteps));
    msw.use(
      ...wizardHandlers({
        organisation: { ...orgValues, isPrincipalContact: 'No', contact: {} },
      }),
    );
  },
  play: async ({ canvas, userEvent }) => {
    await waitFor(() =>
      expect(
        canvas.getAllByRole('radio', { name: /A different contact person/ })[0],
      ).toBeChecked(),
    );
    await userEvent.click(
      await canvas.findByRole('button', { name: 'Save and next' }),
    );
    await canvas.findByRole('link', { name: /First name/ });

    for (const [label, message] of [
      ['First name', /First name/i],
      ['Last name', /Last name/i],
      ['Email', /Email/i],
    ] as const) {
      const field = canvas.getAllByLabelText(label, { exact: false })[0];

      await waitFor(() =>
        expect(field).toHaveAttribute('aria-invalid', 'true'),
      );
      await expect(field).toHaveAccessibleDescription(message);
    }
  },
});

export const ApplicationStepSavesPayloadWithSubOptions = meta.story({
  parameters: {
    portal: { initialEntries: [`${BASE}/application-details`] },
  },
  beforeEach({ msw }) {
    msw.use(statuses(...appSteps));
    msw.use(...wizardHandlers());
  },
  play: async ({ canvas, userEvent }) => {
    await canvas.findByRole('heading', { name: 'Instrument details' });
    await waitFor(() =>
      expect(canvas.getByLabelText('Instrument make (optional)')).toHaveValue(
        'Acme',
      ),
    );
    await expect(
      canvas.getByRole('checkbox', {
        name: /NMI Pattern Approval Certificate/,
      }),
    ).toBeChecked();
    await userEvent.click(
      canvas.getByRole('checkbox', { name: /Conversion Certificate/ }),
    );
    await userEvent.click(
      canvas.getByRole('button', { name: 'Save and next' }),
    );

    await expect(
      await canvas.findByRole('heading', { name: 'Supporting documents' }),
    ).toBeVisible();
    await expect(state.observed.applicationBodies).toEqual([
      {
        applicationId: APPLICATION_ID,
        isCompletingStep: true,
        formStep: {
          ...applicationValues,
          newSubOptions: ['CertificateofApproval', 'ConversionCertificate'],
        },
      },
    ]);
  },
});

export const CategoryChangeResetsTypeAndLocksOnNoMeasurement = meta.story({
  parameters: {
    portal: { initialEntries: [`${BASE}/application-details`] },
  },
  beforeEach({ msw }) {
    msw.use(statuses(...appSteps));
    msw.use(...wizardHandlers());
  },
  play: async ({ canvas, userEvent }) => {
    await canvas.findByRole('heading', { name: 'Instrument details' });
    await waitFor(() =>
      expect(
        canvas.getByLabelText('Select the type of your instrument'),
      ).toHaveValue('type-scale'),
    );

    await userEvent.selectOptions(
      canvas.getByLabelText('Select the category of your instrument'),
      'cat-meter',
    );
    await expect(
      canvas.getByLabelText('Select the type of your instrument'),
    ).toHaveValue('');

    await userEvent.selectOptions(
      canvas.getByLabelText('Select the category of your instrument'),
      'cat-none',
    );
    const lockedType = await canvas.findByRole('textbox', {
      name: 'Select the type of your instrument',
    });

    await expect(lockedType).toHaveAttribute('readonly');
    await expect(lockedType).toHaveValue('No instrument');

    await userEvent.click(
      canvas.getByRole('button', { name: 'Save and exit', hidden: true }),
    );
    await waitFor(() =>
      expect(state.observed.applicationBodies).toHaveLength(1),
    );
    await expect(state.observed.applicationBodies[0]).toEqual({
      applicationId: APPLICATION_ID,
      isCompletingStep: false,
      formStep: {
        ...applicationValues,
        instrumentCategory: 'cat-none',
        instrumentType: 'type-none',
      },
    });
  },
});

/**
 * Changing the category clears the type and untouches it, so a message shown for
 * the touched, empty type goes away until the field is touched again.
 */
export const CategoryChangeUntouchesInstrumentType = meta.story({
  parameters: {
    portal: { initialEntries: [`${BASE}/application-details`] },
  },
  beforeEach({ msw }) {
    msw.use(statuses(...appSteps));
    msw.use(...wizardHandlers());
  },
  play: async ({ canvas, userEvent }) => {
    await canvas.findByRole('heading', { name: 'Instrument details' });
    await waitFor(() =>
      expect(
        canvas.getByLabelText('Select the type of your instrument'),
      ).toHaveValue('type-scale'),
    );

    await userEvent.selectOptions(
      canvas.getByLabelText('Select the category of your instrument'),
      'cat-meter',
    );
    await userEvent.click(
      canvas.getByLabelText('Select the type of your instrument'),
    );
    await userEvent.tab();
    const typeSelect = canvas.getByLabelText(
      'Select the type of your instrument',
    );

    await waitFor(() =>
      expect(typeSelect).toHaveAccessibleDescription(/instrument type/i),
    );

    await userEvent.selectOptions(
      canvas.getByLabelText('Select the category of your instrument'),
      'cat-weigh',
    );

    await waitFor(() =>
      expect(
        canvas.getByLabelText('Select the type of your instrument'),
      ).not.toHaveAccessibleDescription(/instrument type/i),
    );
    await expect(
      canvas.getByLabelText('Select the type of your instrument'),
    ).toHaveValue('');
  },
});

/**
 * Pinned Formik quirk (design Q3): after a failed submit, picking another
 * application type calls `resetForm({errors:{}, touched:{}})`, which clears the
 * errors but also reverts every value (including the chosen type) to the loaded
 * values. The RHF shell must match until a change is approved.
 */
export const ApplicationTypeChangeAfterFailedSubmitResetsToLoadedValues =
  meta.story({
    parameters: {
      portal: { initialEntries: [`${BASE}/application-details`] },
    },
    beforeEach({ msw }) {
      msw.use(statuses(...appSteps));
      msw.use(...wizardHandlers());
    },
    play: async ({ canvas, userEvent }) => {
      await canvas.findByRole('heading', { name: 'Instrument details' });
      await waitFor(() =>
        expect(canvas.getByLabelText('Summary of application')).toHaveValue(
          'A new scale',
        ),
      );
      await userEvent.clear(canvas.getByLabelText('Summary of application'));
      await userEvent.click(
        canvas.getByRole('button', { name: 'Save and next' }),
      );

      await expect(
        await canvas.findByRole('link', { name: /Summary/ }),
      ).toBeVisible();
      await expect(state.observed.applicationBodies).toHaveLength(0);

      await userEvent.click(
        canvas.getByRole('radio', {
          name: /Variation or request a minor edit/,
        }),
      );

      await waitFor(() =>
        expect(canvas.queryByRole('link', { name: /Summary/ })).toBeNull(),
      );
      await expect(
        canvas.getByRole('radio', { name: /New Certificate of Approval/ }),
      ).toBeChecked();
      await expect(canvas.getByLabelText('Summary of application')).toHaveValue(
        'A new scale',
      );
    },
  });

/** Without a failed submit the chosen type simply replaces the old one. */
export const ApplicationTypeChangeBeforeSubmitKeepsOtherValues = meta.story({
  parameters: {
    portal: { initialEntries: [`${BASE}/application-details`] },
  },
  beforeEach({ msw }) {
    msw.use(statuses(...appSteps));
    msw.use(...wizardHandlers());
  },
  play: async ({ canvas, userEvent }) => {
    await canvas.findByRole('heading', { name: 'Instrument details' });
    await waitFor(() =>
      expect(canvas.getByLabelText('Summary of application')).toHaveValue(
        'A new scale',
      ),
    );
    await userEvent.click(canvas.getByRole('radio', { name: /Other options/ }));
    await expect(
      canvas.getByRole('radio', { name: /Other options/ }),
    ).toBeChecked();
    await userEvent.click(
      canvas.getByRole('button', { name: 'Save and exit', hidden: true }),
    );
    await waitFor(() =>
      expect(state.observed.applicationBodies).toHaveLength(1),
    );
    await expect(state.observed.applicationBodies[0]).toEqual({
      applicationId: APPLICATION_ID,
      isCompletingStep: false,
      formStep: { ...applicationValues, patternApprovalType: 'OtherApproval' },
    });
  },
});

export const NewApplicationDefaultsToNewCertificateInPayload = meta.story({
  parameters: {
    portal: { initialEntries: [`${BASE}/application-details`] },
  },
  beforeEach({ msw }) {
    msw.use(statuses(...appSteps));
    msw.use(...wizardHandlers({ application: {} }));
  },
  play: async ({ canvas, userEvent }) => {
    await canvas.findByRole('heading', { name: 'Instrument details' });
    await expect(
      canvas.getByRole('radio', { name: /New Certificate of Approval/ }),
    ).toBeChecked();
    await userEvent.click(
      canvas.getByRole('button', { name: 'Save and exit', hidden: true }),
    );
    await waitFor(() =>
      expect(state.observed.applicationBodies).toHaveLength(1),
    );
    await expect(state.observed.applicationBodies[0]).toEqual({
      applicationId: APPLICATION_ID,
      isCompletingStep: false,
      formStep: { patternApprovalType: 'NewCertificate' },
    });
  },
});

export const VariationCertificateLookupSavesNumberAndId = meta.story({
  parameters: {
    portal: { initialEntries: [`${BASE}/application-details`] },
  },
  beforeEach({ msw }) {
    msw.use(statuses(...appSteps));
    msw.use(
      ...wizardHandlers({
        application: {
          patternApprovalType: 'Variation',
          varSubOptions: ['VariationtoanExistingCoA'],
          summary: 'Add a model',
        },
      }),
    );
  },
  play: async ({ canvas, userEvent }) => {
    await canvas.findByRole('heading', {
      name: 'Variation details',
      hidden: true,
    });
    await userEvent.type(canvas.getByLabelText('Certificate number'), 'S 1/6A');
    await userEvent.click(
      canvas.getByRole('button', { name: 'Save and exit', hidden: true }),
    );
    await waitFor(() =>
      expect(state.observed.applicationBodies).toHaveLength(1),
    );
    await expect(state.observed.applicationBodies[0]).toEqual({
      applicationId: APPLICATION_ID,
      isCompletingStep: false,
      formStep: {
        patternApprovalType: 'Variation',
        varSubOptions: ['VariationtoanExistingCoA'],
        summary: 'Add a model',
        certificateNumber: 'S 1/6A',
      },
    });
  },
});

const docSteps = ['Completed', 'Completed', 'NotStarted', 'NotStarted'];
const summarySteps = ['Completed', 'Completed', 'Completed', 'NotStarted'];

export const SupportingDocumentsStepSavesLoadedDocuments = meta.story({
  parameters: {
    portal: { initialEntries: [`${BASE}/supporting-documents`] },
  },
  beforeEach({ msw }) {
    msw.use(statuses(...docSteps));
    msw.use(...wizardHandlers());
  },
  play: async ({ canvas, userEvent }) => {
    await expect(await canvas.findByText('drawing.pdf')).toBeVisible();
    await userEvent.click(
      canvas.getByRole('button', { name: 'Save and exit', hidden: true }),
    );
    await waitFor(() => expect(state.observed.documentBodies).toHaveLength(1));
    await expect(state.observed.documentBodies[0]).toEqual({
      applicationId: APPLICATION_ID,
      isCompletingStep: false,
      formStep: documentsValues,
    });
  },
});

/**
 * Pinned Formik behaviour: the wizard step does not block "Save and next" when no
 * document has been uploaded (the required-document message is only raised by the
 * upload controls themselves), so the empty list is saved and the summary opens.
 */
export const SupportingDocumentsStepWithoutDocumentsStillSaves = meta.story({
  parameters: {
    portal: { initialEntries: [`${BASE}/supporting-documents`] },
  },
  beforeEach({ msw }) {
    msw.use(statuses(...docSteps));
    msw.use(...wizardHandlers({ documents: { form: { documents: [] } } }));
  },
  play: async ({ canvas, userEvent }) => {
    await canvas.findByRole('heading', { name: 'Supporting documents' });
    await userEvent.click(
      await canvas.findByRole('button', { name: 'Save and next' }),
    );

    await expect(
      await canvas.findByRole('heading', { name: 'Summary and submit' }),
    ).toBeVisible();
    await expect(state.observed.documentBodies).toEqual([
      {
        applicationId: APPLICATION_ID,
        isCompletingStep: true,
        formStep: {},
      },
    ]);
  },
});

/**
 * Pinned Formik behaviour: the acceptance rules are `boolean().oneOf([true])`, which
 * passes an acceptance that was never touched, so an untouched summary submits after
 * the confirmation dialog and the payload carries no acceptance flags.
 */
export const SummarySubmitsAfterConfirmation = meta.story({
  parameters: { portal: { initialEntries: [`${BASE}/summary`] } },
  beforeEach({ msw }) {
    msw.use(statuses(...summarySteps));
    msw.use(...wizardHandlers());
  },
  play: async ({ canvas, userEvent }) => {
    await expect(await canvas.findByText('Acme')).toBeInTheDocument();

    await userEvent.click(
      await canvas.findByRole('button', { name: 'Submit' }),
    );
    await waitFor(async () =>
      expect(
        await within(document.body).findByText(
          'Are you sure you want to submit this request?',
        ),
      ).toBeVisible(),
    );
    await expect(state.observed.submitBodies).toHaveLength(0);

    await userEvent.click(
      await within(document.body).findByRole('button', {
        name: 'Yes, submit',
      }),
    );

    await expect(
      await canvas.findByRole('heading', { name: 'Submitted destination' }),
    ).toBeVisible();
    await expect(state.observed.submitBodies).toHaveLength(1);
    // The loaded summary also carries the instrument lookup lists, which Formik
    // sends back as part of the step.
    await expect(state.observed.submitBodies[0]).toMatchObject({
      applicationId: APPLICATION_ID,
      isCompletingStep: true,
      formStep: summaryValues,
    });
    await expect(state.observed.submitBodies[0]).not.toHaveProperty(
      'formStep.acceptNMIP106',
    );
  },
});

export const SummaryRejectsAnAcceptanceThatWasUnticked = meta.story({
  parameters: { portal: { initialEntries: [`${BASE}/summary`] } },
  beforeEach({ msw }) {
    msw.use(statuses(...summarySteps));
    msw.use(...wizardHandlers());
  },
  play: async ({ canvas, userEvent }) => {
    await expect(await canvas.findByText('Acme')).toBeInTheDocument();

    const nmiP106 = await canvas.findByRole('checkbox', {
      name: /I have read NMI P 106/,
    });

    await userEvent.click(nmiP106);
    await userEvent.click(nmiP106);
    await userEvent.click(canvas.getByRole('button', { name: 'Submit' }));

    await expect(
      (
        await canvas.findAllByText(
          /You must accept NMI P 106 before submitting/,
        )
      )[0],
    ).toBeVisible();
    await expect(
      within(document.body).queryByText(
        'Are you sure you want to submit this request?',
      ),
    ).toBeNull();
    await expect(state.observed.submitBodies).toHaveLength(0);
  },
});

export const BackLinkReturnsToPreviousStep = meta.story({
  parameters: {
    portal: { initialEntries: [`${BASE}/application-details`] },
  },
  beforeEach({ msw }) {
    msw.use(statuses(...appSteps));
    msw.use(...wizardHandlers());
  },
  play: async ({ canvas, userEvent }) => {
    await canvas.findByRole('heading', { name: 'Instrument details' });
    await waitFor(() =>
      expect(canvas.getByLabelText('Summary of application')).toHaveValue(
        'A new scale',
      ),
    );
    await userEvent.click(canvas.getByRole('link', { name: 'Back' }));
    await expect(
      await canvas.findByRole(
        'radio',
        { name: /^Manufacturer/ },
        { timeout: 5000 },
      ),
    ).toBeVisible();
    await expect(
      canvas.queryByRole('heading', { name: 'Instrument details' }),
    ).toBeNull();
  },
});
