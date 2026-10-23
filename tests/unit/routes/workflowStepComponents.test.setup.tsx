import { render } from '@testing-library/react';
import type { ReactNode } from 'react';
import { MemoryRouter, Route, Routes } from 'react-router';
import { vi } from 'vitest';
import type { AccountDetails } from '../../../ClientApp/src/authentication/accountContext';
import type * as WebApiClientModule from '../../../ClientApp/src/api/web-api-client';
import type * as HelperFunctionsModule from '../../../ClientApp/src/routes/common/helperFunctions';

type InputChangeEvent = { target: { value: string | null } };
type InputChangeHandler = (event: InputChangeEvent) => void;

const mocks: {
  acquireTokenSilent: ReturnType<typeof vi.fn>;
  instance: { acquireTokenSilent: ReturnType<typeof vi.fn> };
  msalAccounts: Array<{ homeAccountId: string }>;
  setAuthToken: ReturnType<typeof vi.fn>;
  getLookup: ReturnType<typeof vi.fn>;
  getReportRecipient: ReturnType<typeof vi.fn>;
  getDeliveryAndReturn: ReturnType<typeof vi.fn>;
  getPaymentDetails: ReturnType<typeof vi.fn>;
  getSummaryAndAccept: ReturnType<typeof vi.fn>;
  getQuoteOfferPDFByQuoteID: ReturnType<typeof vi.fn>;
  appLoggerError: ReturnType<typeof vi.fn>;
  appLoggerVerbose: ReturnType<typeof vi.fn>;
  useAccountState: ReturnType<typeof vi.fn>;
  setShowRFQSelectModal: ReturnType<typeof vi.fn>;
  formikValues: Record<string, unknown>;
  setFieldValue: ReturnType<typeof vi.fn>;
  setFieldTouched: ReturnType<typeof vi.fn>;
  inputChangeHandlers: Map<string, InputChangeHandler>;
  dashboardNotification: { message: string; severity: string } | null;
  setDashboardNotification: ReturnType<typeof vi.fn>;
  clearDashboardNotification: ReturnType<typeof vi.fn>;
  clearDashboardInfoNotification: ReturnType<typeof vi.fn>;
  openPdfPageInNewTab: ReturnType<typeof vi.fn>;
} = vi.hoisted(() => {
  const acquireTokenSilent = vi.fn();
  const instance = { acquireTokenSilent };
  return {
    acquireTokenSilent,
    instance,
    msalAccounts: [{ homeAccountId: 'account-1' }],
    setAuthToken: vi.fn(),
    getLookup: vi.fn(),
    getReportRecipient: vi.fn(),
    getDeliveryAndReturn: vi.fn(),
    getPaymentDetails: vi.fn(),
    getSummaryAndAccept: vi.fn(),
    getQuoteOfferPDFByQuoteID: vi.fn(),
    appLoggerError: vi.fn(),
    appLoggerVerbose: vi.fn(),
    useAccountState: vi.fn(),
    setShowRFQSelectModal: vi.fn(),
    formikValues: {},
    setFieldValue: vi.fn(),
    setFieldTouched: vi.fn(),
    inputChangeHandlers: new Map<string, InputChangeHandler>(),
    dashboardNotification: null as { message: string; severity: string } | null,
    setDashboardNotification: vi.fn(),
    clearDashboardNotification: vi.fn(),
    clearDashboardInfoNotification: vi.fn(),
    openPdfPageInNewTab: vi.fn(),
  };
});

vi.mock('@azure/msal-react', () => ({
  useMsal: () => ({ accounts: mocks.msalAccounts, instance: mocks.instance }),
  useAccount: (account: { homeAccountId: string }) => account,
}));

vi.mock('../../../ClientApp/src/authentication/hooks', () => ({
  useAccountState: mocks.useAccountState,
}));

vi.mock('../../../ClientApp/src/authentication/authConfig', () => ({
  tokenRequest: { scopes: ['scope'] },
}));

vi.mock(
  '../../../ClientApp/src/api/web-api-client',
  async (importOriginal) => {
    const actual = await importOriginal<typeof WebApiClientModule>();

    return {
      ...actual,
      CRMLookupTypes: {
        TCPortalMeasurementCategory: 'TCPortalMeasurementCategory',
        TCArtefactTypePortalCategory: 'TCArtefactTypePortalCategory',
      },
      LookupClient: vi.fn(function LookupClientMock() {
        return { setAuthToken: mocks.setAuthToken, getLookup: mocks.getLookup };
      }),
      AcceptQuoteClient: vi.fn(function AcceptQuoteClientMock() {
        return {
          setAuthToken: mocks.setAuthToken,
          getReportRecipient: mocks.getReportRecipient,
          getDeliveryAndReturn: mocks.getDeliveryAndReturn,
          getPaymentDetails: mocks.getPaymentDetails,
          getSummaryAndAccept: mocks.getSummaryAndAccept,
        };
      }),
      AccountsClient: vi.fn(function AccountsClientMock() {
        return { setAuthToken: mocks.setAuthToken };
      }),
      DashboardClient: vi.fn(function DashboardClientMock() {
        return {
          setAuthToken: mocks.setAuthToken,
          getQuoteOfferPDFByQuoteID: mocks.getQuoteOfferPDFByQuoteID,
        };
      }),
    };
  }
);

vi.mock('formik', () => {
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
  };
});

vi.mock('../../../ClientApp/src/components/Inputs/TextInput', () => ({
  default: ({ label, name }: { label: string; name: string }) => (
    <div data-testid='text-input' data-name={name}>
      {label}
    </div>
  ),
}));

vi.mock(
  '../../../ClientApp/src/components/Inputs/TextAreaInput',
  () => ({
    default: ({ label, name }: { label: string; name: string }) => (
      <div data-testid='textarea-input' data-name={name}>
        {label}
      </div>
    ),
  })
);

vi.mock(
  '../../../ClientApp/src/components/Inputs/RadioButtonGroup',
  () => ({
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
  })
);

vi.mock('../../../ClientApp/src/components/Inputs/SelectInput', () => ({
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
}));

vi.mock('../../../ClientApp/src/components/Inputs/NumberInput', () => ({
  default: ({ label, name }: { label: string; name: string }) => (
    <div data-testid='number-input' data-name={name}>
      {label}
    </div>
  ),
}));

vi.mock('../../../ClientApp/src/components/Inputs/DatePicker', () => ({
  default: ({ label, name }: { label: string; name: string }) => (
    <div data-testid='date-picker' data-name={name}>
      {label}
    </div>
  ),
}));

vi.mock(
  '../../../ClientApp/src/components/Inputs/AddressLookup',
  () => ({
    default: ({ label, name }: { label: string; name: string }) => (
      <div data-testid='address-lookup' data-name={name}>
        {label}
      </div>
    ),
  })
);

vi.mock(
  '../../../ClientApp/src/components/Inputs/RhfAddressLookup',
  () => ({
    default: ({ label, name }: { label: string; name: string }) => (
      <div data-testid='address-lookup' data-name={name}>
        {label}
      </div>
    ),
  })
);

vi.mock('../../../ClientApp/src/components/Inputs/Checkbox', () => ({
  default: ({ label, name }: { label: string; name: string }) => (
    <div data-testid='checkbox' data-name={name}>
      {label}
    </div>
  ),
}));

vi.mock('../../../ClientApp/src/components/forms/HidableField', () => ({
  default: ({ children, name }: { children: ReactNode; name: string }) => (
    <div data-testid='hidable-field' data-name={name}>
      {children}
    </div>
  ),
}));

vi.mock(
  '../../../ClientApp/src/components/forms/CommonForms/ContactDetails',
  () => ({
    default: ({ name }: { name: string }) => (
      <div data-testid='contact-details'>{name}</div>
    ),
  })
);

vi.mock(
  '../../../ClientApp/src/components/modals/ModalContext',
  () => ({
    useModalDispatch: () => ({
      setShowRFQSelectModal: mocks.setShowRFQSelectModal,
    }),
  })
);

vi.mock('../../../ClientApp/src/components/BlockUISpinner', () => ({
  default: ({ children }: { children: ReactNode }) => (
    <div data-testid='block-spinner'>{children}</div>
  ),
}));

vi.mock(
  '../../../ClientApp/src/components/Utilities/mailingLabel',
  () => ({
    default: ({ quotationIdNum }: { quotationIdNum?: string }) => (
      <div data-testid='mailing-label'>{quotationIdNum}</div>
    ),
  })
);

vi.mock(
  '../../../ClientApp/src/components/Utilities/deliveryInstructions',
  () => ({
    default: ({ deliveryInstructions }: { deliveryInstructions?: string }) => (
      <div data-testid='delivery-instructions'>{deliveryInstructions}</div>
    ),
  })
);

vi.mock(
  '../../../ClientApp/src/components/Utilities/useBodyClass',
  () => ({
    default: () => {},
  })
);

vi.mock('../../../ClientApp/src/components/Accordion', () => ({
  CustomAccordion: ({ children, id }: { children: ReactNode; id: string }) => (
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
}));

vi.mock('../../../ClientApp/src/components/Buttons/EditButton', () => ({
  default: ({ link }: { link: string }) => (
    <a data-testid='edit-button' href={link}>
      Edit
    </a>
  ),
}));

vi.mock('../../../ClientApp/src/components/HeaderIntroText', () => ({
  default: ({ children }: { children: ReactNode }) => (
    <p data-testid='header-intro'>{children}</p>
  ),
}));

vi.mock('../../../ClientApp/src/components/InTextLink', () => ({
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
}));

vi.mock(
  '../../../ClientApp/src/components/Icons/ExternalLinkIcon',
  () => ({
    default: () => <span data-testid='external-link-icon' />,
  })
);

vi.mock(
  '../../../ClientApp/src/components/Alert/NotificationMessage',
  () => ({
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
  })
);

vi.mock('../../../ClientApp/src/storage/notification', () => ({
  getDashboardNotification: () => mocks.dashboardNotification,
  clearDashboardNotification: mocks.clearDashboardNotification,
  setDashboardNotification: mocks.setDashboardNotification,
  clearDashboardInfoNotification: mocks.clearDashboardInfoNotification,
}));

vi.mock('../../../ClientApp/src/storage/types', () => ({
  NotificationSeverity: { Error: 'error', Info: 'info' },
}));

vi.mock(
  '../../../ClientApp/src/routes/common/helperFunctions',
  async (importOriginal) => {
    const actual = await importOriginal<typeof HelperFunctionsModule>();

    return { ...actual, openPdfPageInNewTab: mocks.openPdfPageInNewTab };
  }
);

vi.mock('../../../ClientApp/src/instrumentation/AppLogger', () => ({
  default: {
    error: mocks.appLoggerError,
    verbose: mocks.appLoggerVerbose,
  },
}));

vi.mock('react-number-format', () => ({
  NumericFormat: ({ value }: { value?: string }) => <span>{value}</span>,
  PatternFormat: ({ value }: { value?: string }) => <span>{value}</span>,
}));

vi.mock(
  '../../../ClientApp/src/routes/acceptQuote/quotationSummary',
  () => ({
    default: () => (
      <div data-testid='quotation-summary'>Quotation summary content</div>
    ),
  })
);

export const accountDetails = {
  homeAccountId: 'account-1',
  givenName: 'Alex',
  familyName: 'Tester',
} as AccountDetails;

export const streetAddress = {
  line1: '1 National Circuit',
  suburb: 'Canberra',
  state: 'ACT',
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
  routePath = '/workflow/:id'
) =>
  render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route path={routePath} element={element} />
      </Routes>
    </MemoryRouter>
  );

export const triggerInputChange = (name: string, value: string | null) => {
  const handler = mocks.inputChangeHandlers.get(name);
  if (!handler)
    throw new Error(`No input change handler registered for ${name}`);

  handler({ target: { value } });
};

export { mocks };
