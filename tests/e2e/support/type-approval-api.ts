import type { Page, Route } from '@playwright/test';
import {
  ApplicationType,
  CRMLookupTypes,
  FormStepStatus,
} from '../../../ClientApp/src/api/web-api-client';
import {
  createDraftTypeApprovalApplication,
  type ScenarioState,
  type TypeApprovalApplicationState,
} from './scenario-state';

const json = (route: Route, body: unknown, status = 200) =>
  route.fulfill({
    status,
    contentType: 'application/json',
    body: JSON.stringify(body),
  });

const parseJsonBody = (route: Route): Record<string, any> => {
  const body = route.request().postData();
  return body ? (JSON.parse(body) as Record<string, any>) : {};
};

const multipartValue = (body: string, name: string): string | undefined => {
  const escapedName = name.replace(/[.*+?^${}()|[\]\\]/g, String.raw`\$&`);
  return new RegExp(
    String.raw`name="${escapedName}"[^\r\n]*\r?\n(?:[^\r\n]+\r?\n)*\r?\n([^\r\n]*)`,
    'i'
  ).exec(body)?.[1];
};

const multipartFileName = (body: string): string | undefined =>
  /filename="([^"]+)"/i.exec(body)?.[1];

const getApplication = (
  state: ScenarioState,
  referenceId: string
): TypeApprovalApplicationState | undefined =>
  state.typeApprovalApplications.get(referenceId);

const dashboardItem = (application: TypeApprovalApplicationState) => ({
  referenceId: application.referenceId,
  portalReferenceId: application.referenceId,
  title:
    application.applicationAndInstrument.instrumentType === 'pa-nawi'
      ? 'Non-automatic weighing instrument'
      : 'Pattern/type approval application',
  status: application.submitted ? 'Submitted' : 'Draft',
  statusDetail: application.submitted
    ? 'Submitted for NMI assessment'
    : 'Draft application',
  summary:
    application.applicationAndInstrument.summary ??
    'Pattern/type approval application in progress.',
  appliedFor: 'NMI Pattern Approval Certificate',
  assessedAs: application.submitted ? 'Awaiting assessment' : '',
  lastUpdated: '2026-06-01T00:00:00Z',
  unreadMessageCount: application.messages.filter(
    (message) => !message.messageRead
  ).length,
});

const dashboardResponse = (state: ScenarioState, submitted: boolean) => {
  const items = Array.from(state.typeApprovalApplications.values())
    .filter((application) => application.submitted === submitted)
    .map(dashboardItem);
  return {
    currentPage: 1,
    items,
    totalPages: 1,
    pageSize: 10,
    totalCount: items.length,
  };
};

const supportingDocumentsResponse = (
  application: TypeApprovalApplicationState
) => ({
  ...application.supportingDocuments,
  uploadId: `pa-upload-${Math.max(1, application.supportingDocuments.form?.documents?.length ?? 0)}`,
});

const applicationDetailsResponse = (
  application: TypeApprovalApplicationState
) => ({
  applicationDetails: {
    referenceId: application.referenceId,
    title:
      application.applicationAndInstrument.instrumentType === 'pa-nawi'
        ? 'Non-automatic weighing instrument'
        : 'Pattern/type approval application',
    status: application.submitted ? 'Submitted' : 'Draft',
    statusDetail: application.submitted
      ? 'Submitted for NMI assessment'
      : 'Draft application',
    summary: application.applicationAndInstrument.summary,
    appliedFor: 'NMI Pattern Approval Certificate',
    assessedAs: application.submitted ? 'Awaiting assessment' : '',
    certificateNumber: application.applicationAndInstrument.certificateNumber,
    lastUpdated: '2026-06-01T00:00:00Z',
    submittedDate: application.submitted ? '2026-06-01T00:00:00Z' : undefined,
    patternApprovalType: 'NMI Pattern Approval Certificate',
    messageCount: application.messages.filter((message) => !message.messageRead)
      .length,
  },
  organisationAndContact: application.organisationAndContact,
  applicationAndInstrument: application.applicationAndInstrument,
  supportingDocuments: application.supportingDocuments,
});

const notFound = (route: Route, referenceId: string) =>
  json(
    route,
    {
      status: 404,
      title: `Type-approval application ${referenceId} was not found`,
    },
    404
  );

interface MockContext {
  route: Route;
  state: ScenarioState;
  method: string;
  url: URL;
  pathname: string;
}

interface ApplicationContext extends MockContext {
  application: TypeApprovalApplicationState;
  referenceId: string;
}

interface MockRoute {
  matches: (context: MockContext) => boolean;
  handle: (context: MockContext) => Promise<void>;
}

type ApplicationHandler = (context: ApplicationContext) => Promise<void>;

const exactPath =
  (path: string, method?: string) =>
  ({ pathname, method: requestMethod }: MockContext): boolean =>
    pathname === path && (method === undefined || requestMethod === method);

const patternPath =
  (pattern: RegExp, method: string) =>
  ({ pathname, method: requestMethod }: MockContext): boolean =>
    pattern.test(pathname) && requestMethod === method;

const stepStatusFor = (command: Record<string, any>): FormStepStatus =>
  command['isCompletingStep'] ? FormStepStatus.Completed : FormStepStatus.Saved;

const unreadMessageCount = (application: TypeApprovalApplicationState) =>
  application.messages.filter((message) => !message.messageRead).length;

const INFO_PANEL_ITEMS = [
  {
    id: 1,
    instrumentTypeTitle: 'Non-automatic weighing instrument',
    instrumentTypeId: 'pa-nawi',
    instrumentCategoryTitle: 'Weighing instruments',
    instrumentCategoryId: 'pa-weighing',
    requirements: 'Technical specification documents',
    requirementsLink: 'https://example.gov.au/type-approval-requirements',
    eligibleForOiml: true,
  },
];

const handleCreateApplication = async ({ route, state }: MockContext) => {
  const command = parseJsonBody(route);
  if (command['applicationType'] !== ApplicationType.PatternApproval) {
    await route.fallback();
    return;
  }
  const referenceId = `PA-2026-${String(state.nextTypeApprovalApplicationNumber).padStart(6, '0')}`;
  state.nextTypeApprovalApplicationNumber += 1;
  state.activeTypeApprovalReferenceId = referenceId;
  state.typeApprovalApplications.set(
    referenceId,
    createDraftTypeApprovalApplication(referenceId)
  );
  await json(route, {
    referenceId,
    applicationType: ApplicationType.PatternApproval,
  });
};

const handleLookup = async ({ route, url }: MockContext) => {
  const lookupType = url.searchParams.get('LookupType');
  if (lookupType === CRMLookupTypes.PAPortalCategory) {
    await json(route, [{ id: 'pa-weighing', label: 'Weighing instruments' }]);
    return;
  }
  if (lookupType === CRMLookupTypes.PAPortalInstrumentType) {
    await json(route, [
      {
        id: 'pa-nawi',
        label: 'Non-automatic weighing instrument',
        parentId: 'pa-weighing',
      },
    ]);
    return;
  }
  await route.fallback();
};

const handleProgressStatus = async ({ route, pathname }: MockContext) => {
  const uploadId = pathname.split('/').at(-1) ?? '';
  await json(route, {
    uploadId,
    status: 'Completed',
    totalFiles: 1,
    completedFiles: 1,
    percent: 100,
    files: [
      {
        fileName: 'pattern-approval-evidence.pdf',
        status: 'Completed',
        bytesUploaded: 34,
        totalBytes: 34,
      },
    ],
  });
};

const handleNewUpload = async ({ route, state }: MockContext) => {
  const uploadId = `pa-upload-${state.nextTypeApprovalUploadNumber}`;
  state.nextTypeApprovalUploadNumber += 1;
  await json(route, uploadId);
};

const handleAddDocuments = async ({ route, state }: MockContext) => {
  const body = route.request().postData() ?? '';
  const referenceId =
    multipartValue(body, 'ApplicationId') ??
    state.activeTypeApprovalReferenceId ??
    '';
  const application = getApplication(state, referenceId);
  if (!application) {
    await notFound(route, referenceId);
    return;
  }
  const fileName = multipartFileName(body) ?? 'pattern-approval-evidence.pdf';
  const documentId = `pa-document-${state.nextTypeApprovalDocumentNumber}`;
  state.nextTypeApprovalDocumentNumber += 1;
  application.supportingDocuments.form ??= { documents: [] };
  application.supportingDocuments.form.documents ??= [];
  application.supportingDocuments.form.documents.push({
    id: documentId,
    documentReference: documentId,
    attachmentMimeType: 'application/pdf',
    attachmentType: 'Supporting document',
    attachmentName: fileName,
    attachmentSize: '34',
    attachmentUrl: '#',
    documentLocked: false,
  });
  await json(route, supportingDocumentsResponse(application));
};

const handleDeleteDocument = async ({ route, state }: MockContext) => {
  const body = route.request().postData() ?? '';
  const referenceId = multipartValue(body, 'ApplicationId') ?? '';
  const documentReference = multipartValue(body, 'DocumentReference');
  const application = getApplication(state, referenceId);
  if (!application) {
    await notFound(route, referenceId);
    return;
  }
  application.supportingDocuments.form!.documents = (
    application.supportingDocuments.form?.documents ?? []
  ).filter((document) => document.id !== documentReference);
  await json(route, supportingDocumentsResponse(application));
};

const handleUpdateCategory = async ({ route, state }: MockContext) => {
  const body = route.request().postData() ?? '';
  const referenceId = multipartValue(body, 'ApplicationId') ?? '';
  const documentReference = multipartValue(body, 'DocumentReference');
  const category = multipartValue(body, 'NewCategory');
  const application = getApplication(state, referenceId);
  if (!application) {
    await notFound(route, referenceId);
    return;
  }
  const document = application.supportingDocuments.form?.documents?.find(
    (candidate) => candidate.id === documentReference
  );
  if (document) {
    document.attachmentCategory = category;
  }
  await json(route, supportingDocumentsResponse(application));
};

const handleAddMessage = async ({ route, state }: MockContext) => {
  const body = route.request().postData() ?? '';
  const referenceId = multipartValue(body, 'ApplicationId') ?? '';
  const application = getApplication(state, referenceId);
  if (!application) {
    await notFound(route, referenceId);
    return;
  }
  application.messages.unshift({
    id: `pa-message-${state.nextTypeApprovalMessageNumber}`,
    regardingId: referenceId,
    subject: 'Message from applicant',
    body: multipartValue(body, 'body') ?? '',
    footer: 'Test User',
    avatar: 'TU',
    senderName: 'Test User',
    messageSent: new Date('2026-06-02T00:00:00Z'),
    messageRead: true,
    messageFrom: 'Portal',
  });
  state.nextTypeApprovalMessageNumber += 1;
  await json(route, {});
};

const STATIC_ROUTES: readonly MockRoute[] = [
  {
    matches: exactPath('/api/application', 'POST'),
    handle: handleCreateApplication,
  },
  {
    matches: exactPath(
      '/api/pattern-approval/get-pattern-approval-dashboard-drafts'
    ),
    handle: ({ route, state }) => json(route, dashboardResponse(state, false)),
  },
  {
    matches: exactPath(
      '/api/pattern-approval/get-pattern-approval-dashboard-applications'
    ),
    handle: ({ route, state }) => json(route, dashboardResponse(state, true)),
  },
  { matches: exactPath('/api/lookup', 'GET'), handle: handleLookup },
  {
    matches: exactPath('/api/lookup/all-info-panel-content'),
    handle: ({ route }) => json(route, INFO_PANEL_ITEMS),
  },
  {
    matches: exactPath('/api/lookup/info-panel-content'),
    handle: ({ route }) => json(route, INFO_PANEL_ITEMS),
  },
  {
    matches: exactPath('/api/lookup/nmi-application'),
    handle: ({ route }) =>
      json(route, [
        {
          id: 'certificate-6-4D-123',
          label: '6/4D/123',
          lookupName: '6/4D/123',
        },
      ]),
  },
  { matches: exactPath('/api/progress', 'GET'), handle: handleNewUpload },
  {
    matches: patternPath(/^\/api\/progress\/[^/]+\/delete$/, 'DELETE'),
    handle: ({ route }) => json(route, true),
  },
  {
    matches: patternPath(/^\/api\/progress\/[^/]+\/files\/[^/]+$/, 'DELETE'),
    handle: ({ route }) => json(route, { cancelled: true }),
  },
  {
    matches: patternPath(/^\/api\/progress\/[^/]+$/, 'GET'),
    handle: handleProgressStatus,
  },
  {
    matches: exactPath(
      '/api/request-for-pattern-approval/add-documents',
      'POST'
    ),
    handle: handleAddDocuments,
  },
  {
    matches: exactPath(
      '/api/request-for-pattern-approval/delete-document',
      'PUT'
    ),
    handle: handleDeleteDocument,
  },
  {
    matches: exactPath(
      '/api/request-for-pattern-approval/update-category',
      'PUT'
    ),
    handle: handleUpdateCategory,
  },
  {
    matches: exactPath('/api/request-for-pattern-approval/add-message', 'PUT'),
    handle: handleAddMessage,
  },
];

const getStepStatuses: ApplicationHandler = ({
  route,
  application,
  referenceId,
}) =>
  json(
    route,
    application.stepStatuses.map((status) => ({
      status,
      crmQuoteRequestId: `crm-${referenceId}`,
    }))
  );

const putOrganisationAndContact: ApplicationHandler = async ({
  route,
  application,
}) => {
  const command = parseJsonBody(route);
  const status = stepStatusFor(command);
  application.organisationAndContact = command['formStep'];
  application.organisationAndContact.formStepStatus = status;
  application.stepStatuses[0] = status;
  await json(route, {});
};

const putApplicationAndInstrument: ApplicationHandler = async ({
  route,
  application,
}) => {
  const command = parseJsonBody(route);
  const status = stepStatusFor(command);
  application.applicationAndInstrument = command['formStep'];
  application.applicationAndInstrument.formStepStatus = status;
  application.stepStatuses[1] = status;
  await json(route, {});
};

const getSupportingDocuments: ApplicationHandler = ({ route, application }) => {
  const { applicationAndInstrument } = application;
  application.supportingDocuments.form ??= { documents: [] };
  application.supportingDocuments.form.instrumentCategory =
    applicationAndInstrument.instrumentCategory;
  application.supportingDocuments.form.instrumentType =
    applicationAndInstrument.instrumentType;
  application.supportingDocuments.form.patternApprovalType =
    applicationAndInstrument.patternApprovalType;
  return json(route, supportingDocumentsResponse(application));
};

const putSupportingDocuments: ApplicationHandler = async ({
  route,
  application,
}) => {
  const command = parseJsonBody(route);
  const status = stepStatusFor(command);
  application.supportingDocuments = command['formStep'];
  application.supportingDocuments.formStepStatus = status;
  application.stepStatuses[2] = status;
  await json(route, {});
};

const getSummary: ApplicationHandler = ({ route, application, referenceId }) =>
  json(route, {
    referenceId,
    acceptNMIP106: false,
    acceptTermsAndConditions: false,
    acceptDeclaration: false,
    organisationAndContact: application.organisationAndContact,
    applicationAndInstrument: application.applicationAndInstrument,
    supportingDocuments: application.supportingDocuments,
    formStepStatus: application.submitted
      ? FormStepStatus.Completed
      : FormStepStatus.NotStarted,
  });

const putSubmit: ApplicationHandler = async ({ route, application }) => {
  application.submitted = true;
  application.stepStatuses = new Array<FormStepStatus>(4).fill(
    FormStepStatus.Completed
  );
  application.supportingDocuments.formStepStatus = FormStepStatus.Completed;
  if (application.supportingDocuments.form) {
    application.supportingDocuments.form.applicationStatus = 'Submitted';
  }
  await json(route, {});
};

const putCommitAppDocuments: ApplicationHandler = async ({
  route,
  application,
}) => {
  const command = parseJsonBody(route);
  application.supportingDocuments.form = command['form'];
  await json(route, supportingDocumentsResponse(application));
};

const getAppMessages: ApplicationHandler = ({
  route,
  application,
  referenceId,
}) =>
  json(route, {
    patternApprovalId: referenceId,
    patternApprovalName:
      applicationDetailsResponse(application).applicationDetails.title,
    requestForPatternApprovalMessageDetails: {
      currentPage: 1,
      items: application.messages,
      totalPages: 1,
      pageSize: 10,
      totalCount: application.messages.length,
    },
  });

const APPLICATION_HANDLERS: ReadonlyMap<string, ApplicationHandler> = new Map([
  ['GET step-statuses', getStepStatuses],
  [
    'GET organisation-and-contact',
    ({ route, application }) => json(route, application.organisationAndContact),
  ],
  ['PUT organisation-and-contact', putOrganisationAndContact],
  [
    'GET application-and-instrument',
    ({ route, application }) =>
      json(route, application.applicationAndInstrument),
  ],
  ['PUT application-and-instrument', putApplicationAndInstrument],
  ['GET supporting-documents', getSupportingDocuments],
  ['PUT supporting-documents', putSupportingDocuments],
  ['GET summary', getSummary],
  ['PUT submit', putSubmit],
  [
    'GET app-details',
    ({ route, application }) =>
      json(route, applicationDetailsResponse(application)),
  ],
  [
    'GET app-documents',
    ({ route, application }) =>
      json(route, supportingDocumentsResponse(application)),
  ],
  ['PUT commit-app-documents', putCommitAppDocuments],
  [
    'GET app-messages-count',
    ({ route, application }) => json(route, unreadMessageCount(application)),
  ],
  ['GET app-messages', getAppMessages],
]);

const APPLICATION_RESOURCE_PATTERN =
  /^\/api\/request-for-pattern-approval\/([^/]+)\/([^/]+)$/;

const handleApplicationResource = async (context: MockContext) => {
  const { route, state, method, pathname } = context;
  const match = APPLICATION_RESOURCE_PATTERN.exec(pathname);
  const encodedReferenceId = match?.[1];
  const resource = match?.[2];
  if (encodedReferenceId === undefined || resource === undefined) {
    await route.fallback();
    return;
  }
  const referenceId = decodeURIComponent(encodedReferenceId);
  const application = getApplication(state, referenceId);
  if (!application) {
    await notFound(route, referenceId);
    return;
  }
  const handler = APPLICATION_HANDLERS.get(`${method} ${resource}`);
  if (!handler) {
    await route.fallback();
    return;
  }
  await handler({ ...context, application, referenceId });
};

export async function installTypeApprovalMockApi(
  page: Page,
  state: ScenarioState
): Promise<void> {
  await page.route('**/api/**', async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const context: MockContext = {
      route,
      state,
      method: request.method(),
      url,
      pathname: url.pathname,
    };
    const staticRoute = STATIC_ROUTES.find((candidate) =>
      candidate.matches(context)
    );
    if (staticRoute) {
      await staticRoute.handle(context);
      return;
    }
    await handleApplicationResource(context);
  });
}
