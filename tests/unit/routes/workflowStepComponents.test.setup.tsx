import { render } from '@testing-library/react';
import type { ReactNode } from 'react';
import { MemoryRouter, Route, Routes } from 'react-router';
import type {
  AccountInfo,
  IPublicClientApplication,
} from '@azure/msal-browser';
import type { FormikProps } from 'formik';
import { vi, type Mock } from 'vitest';
import type {
  AccountDetails,
  AccountDispatchContext,
  AccountStateContext,
} from '../../../ClientApp/src/authentication/accountContext';
import * as WebApiClientModule from '../../../ClientApp/src/api/web-api-client';
import type * as HelperFunctionsModule from '../../../ClientApp/src/routes/common/helperFunctions';
import type * as AppLoggerModule from '../../../ClientApp/src/instrumentation/AppLogger';
import type * as NotificationModule from '../../../ClientApp/src/storage/notification';

interface InputChangeEvent {
  target: { value: string | null };
}
type InputChangeHandler = (event: InputChangeEvent) => void;

const mocks: {
  acquireTokenSilent: Mock<IPublicClientApplication['acquireTokenSilent']>;
  instance: Pick<IPublicClientApplication, 'acquireTokenSilent'>;
  msalAccounts: AccountInfo[];
  setAuthToken: Mock<
    InstanceType<typeof WebApiClientModule.LookupClient>['setAuthToken']
  >;
  getLookup: Mock<
    InstanceType<typeof WebApiClientModule.LookupClient>['getLookup']
  >;
  getReportRecipient: Mock<
    InstanceType<
      typeof WebApiClientModule.AcceptQuoteClient
    >['getReportRecipient']
  >;
  getDeliveryAndReturn: Mock<
    InstanceType<
      typeof WebApiClientModule.AcceptQuoteClient
    >['getDeliveryAndReturn']
  >;
  getPaymentDetails: Mock<
    InstanceType<
      typeof WebApiClientModule.AcceptQuoteClient
    >['getPaymentDetails']
  >;
  getSummaryAndAccept: Mock<
    InstanceType<
      typeof WebApiClientModule.AcceptQuoteClient
    >['getSummaryAndAccept']
  >;
  getQuoteOfferPDFByQuoteID: Mock<
    InstanceType<
      typeof WebApiClientModule.DashboardClient
    >['getQuoteOfferPDFByQuoteID']
  >;
  appLoggerError: Mock<typeof AppLoggerModule.default.error>;
  appLoggerVerbose: Mock<typeof AppLoggerModule.default.verbose>;
  useAccountState: Mock<() => AccountStateContext>;
  setShowRFQSelectModal: Mock<AccountDispatchContext['setShowRFQSelectModal']>;
  formikValues: Record<string, unknown>;
  setFieldValue: Mock<FormikProps<Record<string, unknown>>['setFieldValue']>;
  setFieldTouched: Mock<
    FormikProps<Record<string, unknown>>['setFieldTouched']
  >;
  inputChangeHandlers: Map<string, InputChangeHandler>;
  dashboardNotification: { message: string; severity: string } | null;
  setDashboardNotification: Mock<
    typeof NotificationModule.setDashboardNotification
  >;
  clearDashboardNotification: Mock<
    typeof NotificationModule.clearDashboardNotification
  >;
  clearDashboardInfoNotification: Mock<
    typeof NotificationModule.clearDashboardInfoNotification
  >;
  openPdfPageInNewTab: Mock<typeof HelperFunctionsModule.openPdfPageInNewTab>;
} = vi.hoisted(() => {
  const acquireTokenSilent =
    vi.fn<IPublicClientApplication['acquireTokenSilent']>();
  const instance = { acquireTokenSilent };
  return {
    acquireTokenSilent,
    instance,
    msalAccounts: [
      {
        homeAccountId: 'account-1',
        environment: 'login.microsoftonline.com',
        tenantId: 'tenant-id',
        username: 'user@example.test',
        localAccountId: 'local-account-1',
      },
    ],
    setAuthToken:
      vi.fn<
        InstanceType<typeof WebApiClientModule.LookupClient>['setAuthToken']
      >(),
    getLookup:
      vi.fn<
        InstanceType<typeof WebApiClientModule.LookupClient>['getLookup']
      >(),
    getReportRecipient:
      vi.fn<
        InstanceType<
          typeof WebApiClientModule.AcceptQuoteClient
        >['getReportRecipient']
      >(),
    getDeliveryAndReturn:
      vi.fn<
        InstanceType<
          typeof WebApiClientModule.AcceptQuoteClient
        >['getDeliveryAndReturn']
      >(),
    getPaymentDetails:
      vi.fn<
        InstanceType<
          typeof WebApiClientModule.AcceptQuoteClient
        >['getPaymentDetails']
      >(),
    getSummaryAndAccept:
      vi.fn<
        InstanceType<
          typeof WebApiClientModule.AcceptQuoteClient
        >['getSummaryAndAccept']
      >(),
    getQuoteOfferPDFByQuoteID:
      vi.fn<
        InstanceType<
          typeof WebApiClientModule.DashboardClient
        >['getQuoteOfferPDFByQuoteID']
      >(),
    appLoggerError: vi.fn<typeof AppLoggerModule.default.error>(),
    appLoggerVerbose: vi.fn<typeof AppLoggerModule.default.verbose>(),
    useAccountState: vi.fn<() => AccountStateContext>(),
    setShowRFQSelectModal:
      vi.fn<AccountDispatchContext['setShowRFQSelectModal']>(),
    formikValues: {},
    setFieldValue:
      vi.fn<FormikProps<Record<string, unknown>>['setFieldValue']>(),
    setFieldTouched:
      vi.fn<FormikProps<Record<string, unknown>>['setFieldTouched']>(),
    inputChangeHandlers: new Map<string, InputChangeHandler>(),
    dashboardNotification: null as { message: string; severity: string } | null,
    setDashboardNotification:
      vi.fn<typeof NotificationModule.setDashboardNotification>(),
    clearDashboardNotification:
      vi.fn<typeof NotificationModule.clearDashboardNotification>(),
    clearDashboardInfoNotification:
      vi.fn<typeof NotificationModule.clearDashboardInfoNotification>(),
    openPdfPageInNewTab:
      vi.fn<typeof HelperFunctionsModule.openPdfPageInNewTab>(),
  };
});

vi.mock(
  import('@azure/msal-react') as unknown as string,
  () =>
    ({
      useMsal: () => ({
        accounts: mocks.msalAccounts,
        instance: mocks.instance,
      }),
      useAccount: (account: { homeAccountId: string }) => account,
    }) satisfies __ExactMockModule<__TestMockModule2>,
);

vi.mock(
  import('../../../ClientApp/src/authentication/hooks') as unknown as string,
  () =>
    ({
      useAccountState: mocks.useAccountState,
    }) satisfies __ExactMockModule<__TestMockModule26>,
);

vi.mock(
  import('../../../ClientApp/src/authentication/authConfig') as unknown as string,
  () =>
    ({
      tokenRequest: { scopes: ['scope'] },
    }) satisfies __ExactMockModule<__TestMockModule8>,
);

vi.mock(
  import('../../../ClientApp/src/api/web-api-client') as unknown as string,
  async (importOriginal) => {
    const actual = await importOriginal<typeof WebApiClientModule>();

    return {
      ...actual,
      CRMLookupTypes: {
        TCPortalMeasurementCategory: 'TCPortalMeasurementCategory',
        TCArtefactTypePortalCategory: 'TCArtefactTypePortalCategory',
      },
      LookupClient: vi.fn<
        () => Pick<
          InstanceType<typeof WebApiClientModule.LookupClient>,
          'setAuthToken' | 'getLookup'
        >
      >(function LookupClientMock() {
        return { setAuthToken: mocks.setAuthToken, getLookup: mocks.getLookup };
      }),
      AcceptQuoteClient: vi.fn<
        () => Pick<
          InstanceType<typeof WebApiClientModule.AcceptQuoteClient>,
          | 'setAuthToken'
          | 'getReportRecipient'
          | 'getDeliveryAndReturn'
          | 'getPaymentDetails'
          | 'getSummaryAndAccept'
        >
      >(function AcceptQuoteClientMock() {
        return {
          setAuthToken: mocks.setAuthToken,
          getReportRecipient: mocks.getReportRecipient,
          getDeliveryAndReturn: mocks.getDeliveryAndReturn,
          getPaymentDetails: mocks.getPaymentDetails,
          getSummaryAndAccept: mocks.getSummaryAndAccept,
        };
      }),
      AccountsClient: vi.fn<
        () => Pick<
          InstanceType<typeof WebApiClientModule.AccountsClient>,
          'setAuthToken'
        >
      >(function AccountsClientMock() {
        return { setAuthToken: mocks.setAuthToken };
      }),
      DashboardClient: vi.fn<
        () => Pick<
          InstanceType<typeof WebApiClientModule.DashboardClient>,
          'setAuthToken' | 'getQuoteOfferPDFByQuoteID'
        >
      >(function DashboardClientMock() {
        return {
          setAuthToken: mocks.setAuthToken,
          getQuoteOfferPDFByQuoteID: mocks.getQuoteOfferPDFByQuoteID,
        };
      }),
    } satisfies __ExactMockModule<__TestMockModule4>;
  },
);

vi.mock(import('formik') as unknown as string, () => {
  const getPath = (path: string, values = mocks.formikValues) =>
    path.split('.').reduce<unknown>((value, part) => {
      if (value === null || typeof value !== 'object') return undefined;
      return Reflect.get(value, part);
    }, values);

  return {
    useFormikContext: () => ({
      initialValues: mocks.formikValues,
      values: mocks.formikValues,
      submitCount: 0,
      setFieldValue: mocks.setFieldValue,
      setFieldTouched: mocks.setFieldTouched,
      getFieldMeta: (name: string) => ({
        initialValue: getPath(name),
      }),
    }),
    useField: (name: string) => [{ value: getPath(name) ?? '' }],
    getIn: (values: Record<string, unknown>, name: string) =>
      getPath(name, values),
  } satisfies __ExactMockModule<__TestMockModule147>;
});

vi.mock(
  import('../../../ClientApp/src/components/Inputs/TextInput') as unknown as string,
  () =>
    ({
      default: ({ label, name }: { label: string; name: string }) => (
        <div data-testid='text-input' data-name={name}>
          {label}
        </div>
      ),
    }) satisfies __ExactMockModule<__TestMockModule29>,
);

vi.mock(
  import('../../../ClientApp/src/components/Inputs/TextAreaInput') as unknown as string,
  () =>
    ({
      default: ({ label, name }: { label: string; name: string }) => (
        <div data-testid='textarea-input' data-name={name}>
          {label}
        </div>
      ),
    }) satisfies __ExactMockModule<__TestMockModule134>,
);

vi.mock(
  import('../../../ClientApp/src/components/Inputs/RadioButtonGroup') as unknown as string,
  () =>
    ({
      default: ({
        legend,
        name,
        options,
      }: {
        legend: string;
        name: string;
        options: { label: string }[];
      }) => (
        <fieldset data-testid='radio-group' data-name={name}>
          <legend>{legend}</legend>
          {options.map((option) => (
            <span key={option.label}>{option.label}</span>
          ))}
        </fieldset>
      ),
    }) satisfies __ExactMockModule<__TestMockModule52>,
);

vi.mock(
  import('../../../ClientApp/src/components/Inputs/SelectInput') as unknown as string,
  () =>
    ({
      default: ({
        label,
        name,
        options,
        onChange,
        readOnly,
      }: {
        label: string;
        name: string;
        options: { value: string; displayText: string }[];
        onChange?: InputChangeHandler;
        readOnly?: boolean;
      }) => {
        if (onChange) mocks.inputChangeHandlers.set(name, onChange);
        return (
          <label>
            {label}
            <input
              data-testid={`select-${name}`}
              data-readonly={readOnly ? 'true' : 'false'}
              value={options[0]?.value ?? ''}
              readOnly
            />
          </label>
        );
      },
    }) satisfies __ExactMockModule<__TestMockModule131>,
);

vi.mock(
  import('../../../ClientApp/src/components/Inputs/NumberInput') as unknown as string,
  () =>
    ({
      default: ({ label, name }: { label: string; name: string }) => (
        <div data-testid='number-input' data-name={name}>
          {label}
        </div>
      ),
    }) satisfies __ExactMockModule<__TestMockModule30>,
);

vi.mock(
  import('../../../ClientApp/src/components/Inputs/DatePicker') as unknown as string,
  () =>
    ({
      default: ({ label, name }: { label: string; name: string }) => (
        <div data-testid='date-picker' data-name={name}>
          {label}
        </div>
      ),
    }) satisfies __ExactMockModule<__TestMockModule148>,
);

vi.mock(
  import('../../../ClientApp/src/components/Inputs/AddressLookup') as unknown as string,
  () =>
    ({
      default: ({ label, name }: { label: string; name: string }) => (
        <div data-testid='address-lookup' data-name={name}>
          {label}
        </div>
      ),
    }) satisfies __ExactMockModule<__TestMockModule31>,
);

vi.mock(
  import('../../../ClientApp/src/components/Inputs/RhfAddressLookup') as unknown as string,
  () =>
    ({
      default: ({ label, name }: { label: string; name: string }) => (
        <div data-testid='address-lookup' data-name={name}>
          {label}
        </div>
      ),
    }) satisfies __ExactMockModule<__TestMockModule69>,
);

vi.mock(
  import('../../../ClientApp/src/components/Inputs/Checkbox') as unknown as string,
  () =>
    ({
      default: ({ label, name }: { label: string; name: string }) => (
        <div data-testid='checkbox' data-name={name}>
          {label}
        </div>
      ),
    }) satisfies __ExactMockModule<__TestMockModule79>,
);

vi.mock(
  import('../../../ClientApp/src/components/forms/HidableField') as unknown as string,
  () =>
    ({
      default: ({ children, name }: { children: ReactNode; name: string }) => (
        <div data-testid='hidable-field' data-name={name}>
          {children}
        </div>
      ),
    }) satisfies __ExactMockModule<__TestMockModule70>,
);

vi.mock(
  import('../../../ClientApp/src/components/forms/CommonForms/ContactDetails') as unknown as string,
  () =>
    ({
      default: ({ name }: { name: string }) => (
        <div data-testid='contact-details'>{name}</div>
      ),
    }) satisfies __ExactMockModule<__TestMockModule71>,
);

vi.mock(
  import('../../../ClientApp/src/components/modals/ModalContext') as unknown as string,
  () =>
    ({
      useModalDispatch: () => ({
        setShowRFQSelectModal: mocks.setShowRFQSelectModal,
      }),
    }) satisfies __ExactMockModule<__TestMockModule27>,
);

vi.mock(
  import('../../../ClientApp/src/components/BlockUISpinner') as unknown as string,
  () =>
    ({
      default: ({ children }: { children: ReactNode }) => (
        <div data-testid='block-spinner'>{children}</div>
      ),
    }) satisfies __ExactMockModule<__TestMockModule14>,
);

vi.mock(
  import('../../../ClientApp/src/components/Utilities/mailingLabel') as unknown as string,
  () =>
    ({
      default: ({ quotationIdNum }: { quotationIdNum?: string }) => (
        <div data-testid='mailing-label'>{quotationIdNum}</div>
      ),
    }) satisfies __ExactMockModule<__TestMockModule119>,
);

vi.mock(
  import('../../../ClientApp/src/components/Utilities/deliveryInstructions') as unknown as string,
  () =>
    ({
      default: ({
        deliveryInstructions,
      }: {
        deliveryInstructions?: string;
      }) => (
        <div data-testid='delivery-instructions'>{deliveryInstructions}</div>
      ),
    }) satisfies __ExactMockModule<__TestMockModule120>,
);

vi.mock(
  import('../../../ClientApp/src/components/Utilities/useBodyClass') as unknown as string,
  () =>
    ({
      default: vi.fn<() => void>(),
    }) satisfies __ExactMockModule<__TestMockModule59>,
);

vi.mock(
  import('../../../ClientApp/src/components/Accordion') as unknown as string,
  () =>
    ({
      CustomAccordion: ({
        children,
        id,
      }: {
        children: ReactNode;
        id: string;
      }) => (
        <section data-testid='accordion' data-id={id}>
          {children}
        </section>
      ),
      CustomAccordionBody: ({
        children,
        name,
      }: {
        children: ReactNode;
        name: string;
      }) => (
        <div data-testid='accordion-body'>
          {name}
          {children}
        </div>
      ),
    }) satisfies __ExactMockModule<__TestMockModule74>,
);

vi.mock(
  import('../../../ClientApp/src/components/Buttons/EditButton') as unknown as string,
  () =>
    ({
      default: ({ link }: { link: string }) => (
        <a data-testid='edit-button' href={link}>
          Edit
        </a>
      ),
    }) satisfies __ExactMockModule<__TestMockModule75>,
);

vi.mock(
  import('../../../ClientApp/src/components/HeaderIntroText') as unknown as string,
  () =>
    ({
      default: ({ children }: { children: ReactNode }) => (
        <p data-testid='header-intro'>{children}</p>
      ),
    }) satisfies __ExactMockModule<__TestMockModule76>,
);

vi.mock(
  import('../../../ClientApp/src/components/InTextLink') as unknown as string,
  () =>
    ({
      default: ({
        children,
        onClick,
        className,
      }: {
        children: ReactNode;
        onClick: React.MouseEventHandler<HTMLButtonElement>;
        className?: string;
      }) => (
        <button type='button' className={className} onClick={onClick}>
          {children}
        </button>
      ),
    }) satisfies __ExactMockModule<__TestMockModule77>,
);

vi.mock(
  import('../../../ClientApp/src/components/Icons/ExternalLinkIcon') as unknown as string,
  () =>
    ({
      default: () => <span data-testid='external-link-icon' />,
    }) satisfies __ExactMockModule<__TestMockModule78>,
);

vi.mock(
  import('../../../ClientApp/src/components/Alert/NotificationMessage') as unknown as string,
  () =>
    ({
      default: ({
        message,
        onClose,
      }: {
        message: string;
        onClose: () => void;
      }) => (
        <button
          type='button'
          data-testid='notification-message'
          onClick={onClose}
        >
          {message}
        </button>
      ),
    }) satisfies __ExactMockModule<__TestMockModule48>,
);

vi.mock(
  import('../../../ClientApp/src/storage/notification') as unknown as string,
  () =>
    ({
      getDashboardNotification: () => mocks.dashboardNotification,
      clearDashboardNotification: mocks.clearDashboardNotification,
      setDashboardNotification: mocks.setDashboardNotification,
      clearDashboardInfoNotification: mocks.clearDashboardInfoNotification,
    }) satisfies __ExactMockModule<__TestMockModule46>,
);

vi.mock(
  import('../../../ClientApp/src/storage/types') as unknown as string,
  () =>
    ({
      NotificationSeverity: { Error: 'error', Info: 'info' },
    }) satisfies __ExactMockModule<__TestMockModule47>,
);

vi.mock(
  import('../../../ClientApp/src/routes/common/helperFunctions') as unknown as string,
  async (importOriginal) => {
    const actual = await importOriginal<typeof HelperFunctionsModule>();

    return {
      ...actual,
      openPdfPageInNewTab: mocks.openPdfPageInNewTab,
    } satisfies __ExactMockModule<__TestMockModule9>;
  },
);

vi.mock(
  import('../../../ClientApp/src/instrumentation/AppLogger') as unknown as string,
  () =>
    ({
      default: {
        error: mocks.appLoggerError,
        verbose: mocks.appLoggerVerbose,
      },
    }) satisfies __ExactMockModule<__TestMockModule5>,
);

vi.mock(
  import('react-number-format') as unknown as string,
  () =>
    ({
      NumericFormat: ({ value }: { value?: string }) => <span>{value}</span>,
      PatternFormat: ({ value }: { value?: string }) => <span>{value}</span>,
    }) satisfies __ExactMockModule<__TestMockModule102>,
);

vi.mock(
  import('../../../ClientApp/src/routes/acceptQuote/quotationSummary') as unknown as string,
  () =>
    ({
      default: () => (
        <div data-testid='quotation-summary'>Quotation summary content</div>
      ),
    }) satisfies __ExactMockModule<__TestMockModule73>,
);

export const accountDetails = {
  homeAccountId: 'account-1',
  givenName: 'Alex',
  familyName: 'Tester',
} as AccountDetails;

export const streetAddress: WebApiClientModule.AddressDetailsDto = {
  line1: '1 National Circuit',
  suburb: 'Canberra',
  state: WebApiClientModule.State.ACT,
  postcode: '2600',
};

export const basePreInfo = {
  quotationIdNum: 'Q-100',
  crmQuoteId: 'CRM-Q-100',
  nmiFacilityDeliveryInstructions: 'Use the loading dock.',
  nmiCheckedByName: 'NMI Officer',
  nmiCheckedByJobTitle: 'Approver',
  nmiCheckedByPhone: '02 0000 0000',
  nmiCheckedByEmail: 'officer@example.test',
};

export const renderRoute = (
  initialPath: string,
  element: ReactNode,
  routePath = '/workflow/:id',
) =>
  render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route path={routePath} element={element} />
      </Routes>
    </MemoryRouter>,
  );

export const triggerInputChange = (name: string, value: string | null) => {
  const handler = mocks.inputChangeHandlers.get(name);
  if (!handler)
    throw new Error(`No input change handler registered for ${name}`);

  handler({ target: { value } });
};

export { mocks };
