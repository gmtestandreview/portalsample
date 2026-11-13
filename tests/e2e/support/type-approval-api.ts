import type { Page, Route } from '@playwright/test';
import { failureKey } from './mock-failure';
import {
  ApplicationType,
  CRMLookupTypes,
  FormStepStatus,
  PatternApprovalRequiredValueOptions,
  PatternApprovalRequiredValues,
  State,
  Title,
  YesNo,
} from '../../../ClientApp/src/api/web-api-client';
import type {
  AddressDetailsDto,
  ApplicationAndInstrumentStep,
  AttachmentDto,
  AuthorisedAgent,
  ContactStep,
  PatternApprovalOrgAndContact,
  SupportingDocumentsForm,
  SupportingDocumentsStep,
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

type JsonObject = Record<string, unknown>;

const isJsonObject = (value: unknown): value is JsonObject =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isEnumValue = <T extends string>(
  value: unknown,
  values: readonly T[],
): value is T => typeof value === 'string' && values.includes(value as T);

const hasOptionalString = (object: JsonObject, key: string): boolean =>
  Reflect.get(object, key) === undefined ||
  typeof Reflect.get(object, key) === 'string';

const hasOptionalNumber = (object: JsonObject, key: string): boolean =>
  Reflect.get(object, key) === undefined ||
  typeof Reflect.get(object, key) === 'number';

const hasOptionalBoolean = (object: JsonObject, key: string): boolean =>
  Reflect.get(object, key) === undefined ||
  typeof Reflect.get(object, key) === 'boolean';

const hasOptionalEnum = (
  object: JsonObject,
  key: string,
  values: readonly string[],
): boolean =>
  Reflect.get(object, key) === undefined ||
  isEnumValue(Reflect.get(object, key), values);

const hasOptionalObject = (
  object: JsonObject,
  key: string,
  guard: (value: unknown) => boolean,
): boolean =>
  Reflect.get(object, key) === undefined || guard(Reflect.get(object, key));

const hasOptionalArray = (
  object: JsonObject,
  key: string,
  guard: (value: unknown) => boolean,
): boolean => {
  const value = Reflect.get(object, key);
  return value === undefined || (Array.isArray(value) && value.every(guard));
};

const isAddressDetails = (value: unknown): value is AddressDetailsDto =>
  isJsonObject(value) &&
  hasOptionalNumber(value, 'id') &&
  hasOptionalNumber(value, 'type') &&
  hasOptionalString(value, 'line1') &&
  hasOptionalString(value, 'line2') &&
  hasOptionalString(value, 'line3') &&
  hasOptionalString(value, 'suburb') &&
  hasOptionalString(value, 'postcode') &&
  hasOptionalEnum(value, 'state', Object.values(State)) &&
  hasOptionalBoolean(value, 'isManuallyEntered') &&
  hasOptionalString(value, 'searchText') &&
  hasOptionalString(value, 'timeStamp');

const isContactStep = (value: unknown): value is ContactStep =>
  isJsonObject(value) &&
  hasOptionalEnum(value, 'title', Object.values(Title)) &&
  hasOptionalString(value, 'titleOther') &&
  hasOptionalString(value, 'firstName') &&
  hasOptionalString(value, 'lastName') &&
  hasOptionalString(value, 'role') &&
  hasOptionalString(value, 'phone') &&
  hasOptionalString(value, 'mobile') &&
  hasOptionalString(value, 'email') &&
  hasOptionalEnum(value, 'formStepStatus', Object.values(FormStepStatus));

const isAuthorisedAgent = (value: unknown): value is AuthorisedAgent =>
  isJsonObject(value) &&
  hasOptionalString(value, 'manufacturerName') &&
  hasOptionalString(value, 'companyIdentifier') &&
  hasOptionalObject(value, 'streetAddress', isAddressDetails) &&
  hasOptionalString(value, 'abn');

const isPatternApprovalOrgAndContact = (
  value: unknown,
): value is PatternApprovalOrgAndContact =>
  isJsonObject(value) &&
  hasOptionalString(value, 'sourceReferenceId') &&
  hasOptionalString(value, 'abn') &&
  hasOptionalString(value, 'name') &&
  hasOptionalString(value, 'businessOrTradingName') &&
  hasOptionalString(value, 'branchOrLocationName') &&
  hasOptionalString(value, 'businessWebsiteAddress') &&
  hasOptionalObject(value, 'streetAddress', isAddressDetails) &&
  hasOptionalObject(value, 'authorisedAgent', isAuthorisedAgent) &&
  hasOptionalBoolean(value, 'principalContactHide') &&
  hasOptionalBoolean(value, 'principalInvoiceContactHide') &&
  hasOptionalBoolean(value, 'isManufacturerHide') &&
  hasOptionalBoolean(value, 'isCurrentOrganisationHide') &&
  hasOptionalEnum(value, 'isManufacturer', Object.values(YesNo)) &&
  hasOptionalEnum(value, 'isPrincipalContact', Object.values(YesNo)) &&
  hasOptionalEnum(value, 'isCorrectBranchOrLocation', Object.values(YesNo)) &&
  hasOptionalEnum(value, 'isPrincipalInvoiceContact', Object.values(YesNo)) &&
  hasOptionalObject(value, 'contact', isContactStep) &&
  hasOptionalObject(value, 'currentContact', isContactStep) &&
  hasOptionalObject(value, 'invoiceContact', isContactStep) &&
  hasOptionalNumber(value, 'organisationCount') &&
  hasOptionalEnum(value, 'formStepStatus', Object.values(FormStepStatus));

const isApplicationAndInstrument = (
  value: unknown,
): value is ApplicationAndInstrumentStep =>
  isJsonObject(value) &&
  hasOptionalString(value, 'sourceReferenceId') &&
  hasOptionalEnum(
    value,
    'patternApprovalType',
    Object.values(PatternApprovalRequiredValues),
  ) &&
  hasOptionalArray(
    value,
    'newSubOptions',
    (item): item is PatternApprovalRequiredValueOptions =>
      isEnumValue(item, Object.values(PatternApprovalRequiredValueOptions)),
  ) &&
  hasOptionalArray(
    value,
    'varSubOptions',
    (item): item is PatternApprovalRequiredValueOptions =>
      isEnumValue(item, Object.values(PatternApprovalRequiredValueOptions)),
  ) &&
  hasOptionalArray(
    value,
    'othSubOptions',
    (item): item is PatternApprovalRequiredValueOptions =>
      isEnumValue(item, Object.values(PatternApprovalRequiredValueOptions)),
  ) &&
  hasOptionalString(value, 'instrumentCategory') &&
  hasOptionalString(value, 'instrumentType') &&
  hasOptionalBoolean(value, 'isApplNewHide') &&
  hasOptionalBoolean(value, 'isApplNewInstrumentHide') &&
  hasOptionalBoolean(value, 'isApplVariationHide') &&
  hasOptionalBoolean(value, 'isApplOtherHide') &&
  hasOptionalBoolean(value, 'isApplOIMLHide') &&
  hasOptionalString(value, 'certificateNumber') &&
  hasOptionalString(value, 'certificateNumberId') &&
  hasOptionalString(value, 'make') &&
  hasOptionalString(value, 'model') &&
  hasOptionalString(value, 'summary') &&
  hasOptionalEnum(value, 'formStepStatus', Object.values(FormStepStatus));

const isAttachment = (value: unknown): value is AttachmentDto =>
  isJsonObject(value) &&
  hasOptionalString(value, 'id') &&
  hasOptionalString(value, 'documentReference') &&
  hasOptionalString(value, 'attachmentMimeType') &&
  hasOptionalString(value, 'attachmentType') &&
  hasOptionalString(value, 'attachmentCategory') &&
  hasOptionalString(value, 'attachmentName') &&
  hasOptionalString(value, 'attachmentSize') &&
  hasOptionalString(value, 'attachmentUrl') &&
  hasOptionalString(value, 'parentTimestamp') &&
  hasOptionalBoolean(value, 'documentLocked') &&
  hasOptionalString(value, 'documentBytes');

const isSupportingDocumentsForm = (
  value: unknown,
): value is SupportingDocumentsForm =>
  isJsonObject(value) &&
  hasOptionalArray(value, 'documents', isAttachment) &&
  hasOptionalString(value, 'instrumentCategory') &&
  hasOptionalString(value, 'instrumentType') &&
  hasOptionalString(value, 'applicationStatus') &&
  hasOptionalEnum(
    value,
    'patternApprovalType',
    Object.values(PatternApprovalRequiredValues),
  );

const isSupportingDocuments = (
  value: unknown,
): value is SupportingDocumentsStep =>
  isJsonObject(value) &&
  hasOptionalObject(value, 'form', isSupportingDocumentsForm) &&
  hasOptionalEnum(value, 'formStepStatus', Object.values(FormStepStatus)) &&
  hasOptionalString(value, 'uploadId');

const requireJsonProperty = <T>(
  object: JsonObject,
  key: string,
  guard: (value: unknown) => value is T,
): T => {
  const value = Reflect.get(object, key);
  if (!guard(value)) {
    throw new TypeError(`Expected ${key} to be a valid JSON object`);
  }
  return value;
};

const parseJsonBody = (route: Route): JsonObject => {
  const body = route.request().postData();
  if (!body) return {};

  const parsed: unknown = JSON.parse(body) as unknown;
  return isJsonObject(parsed) ? parsed : {};
};

const multipartValue = (body: string, name: string): string | undefined => {
  const lines = body.split(/\r?\n/);
  const headerLine = lines.findIndex((line) => line.includes(`name="${name}"`));
  if (headerLine === -1) return undefined;

  const blankLine = lines.findIndex(
    (line, index) => index > headerLine && line === '',
  );
  return blankLine === -1 ? undefined : lines[blankLine + 1];
};

const multipartFileName = (body: string): string | undefined =>
  /filename="([^"]+)"/i.exec(body)?.[1];

const getApplication = (
  state: ScenarioState,
  referenceId: string,
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
    (message) => !message.messageRead,
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
  application: TypeApprovalApplicationState,
) => ({
  ...application.supportingDocuments,
  uploadId: `pa-upload-${Math.max(1, application.supportingDocuments.form?.documents?.length ?? 0)}`,
});

const applicationDetailsResponse = (
  application: TypeApprovalApplicationState,
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
    404,
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

const stepStatusFor = (command: JsonObject): FormStepStatus =>
  Reflect.get(command, 'isCompletingStep')
    ? FormStepStatus.Completed
    : FormStepStatus.Saved;

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
    createDraftTypeApprovalApplication(referenceId),
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
    (candidate) => candidate.id === documentReference,
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
      '/api/pattern-approval/get-pattern-approval-dashboard-drafts',
    ),
    handle: ({ route, state }) => json(route, dashboardResponse(state, false)),
  },
  {
    matches: exactPath(
      '/api/pattern-approval/get-pattern-approval-dashboard-applications',
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
      'POST',
    ),
    handle: handleAddDocuments,
  },
  {
    matches: exactPath(
      '/api/request-for-pattern-approval/delete-document',
      'PUT',
    ),
    handle: handleDeleteDocument,
  },
  {
    matches: exactPath(
      '/api/request-for-pattern-approval/update-category',
      'PUT',
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
    })),
  );

const putOrganisationAndContact: ApplicationHandler = async ({
  route,
  application,
}) => {
  const command = parseJsonBody(route);
  const status = stepStatusFor(command);
  application.organisationAndContact = requireJsonProperty(
    command,
    'formStep',
    isPatternApprovalOrgAndContact,
  );
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
  application.applicationAndInstrument = requireJsonProperty(
    command,
    'formStep',
    isApplicationAndInstrument,
  );
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
  application.supportingDocuments = requireJsonProperty(
    command,
    'formStep',
    isSupportingDocuments,
  );
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
    FormStepStatus.Completed,
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
  application.supportingDocuments.form = requireJsonProperty(
    command,
    'form',
    isSupportingDocumentsForm,
  );
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
  const failureKeys = [
    failureKey(method, pathname),
    failureKey(method, `/api/request-for-pattern-approval/*/${resource}`),
  ];
  const failureKeyInUse = failureKeys.find((key) => state.failures.has(key));
  const failure = failureKeyInUse && state.failures.get(failureKeyInUse);
  if (failureKeyInUse && failure) {
    if (failure.once !== false) {
      state.failures.delete(failureKeyInUse);
    }
    await route.fulfill({
      status: failure.status,
      contentType: 'application/json',
      body: JSON.stringify(
        failure.body ?? {
          status: failure.status,
          title: 'Configured E2E failure',
        },
      ),
    });
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
  state: ScenarioState,
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
      candidate.matches(context),
    );
    if (staticRoute) {
      await staticRoute.handle(context);
      return;
    }
    await handleApplicationResource(context);
  });
}
