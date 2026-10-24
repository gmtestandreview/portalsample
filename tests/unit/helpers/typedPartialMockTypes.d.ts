// Module-shape queries intentionally use `typeof import()` so this ambient registry adds no runtime imports.
/* eslint-disable @typescript-eslint/consistent-type-imports */

type __ExactMockModule<TModule> = Partial<
  Record<keyof TModule | 'default', unknown>
>;

type __TestMockModule1 = typeof import('react-ga4');
type __TestMockModule2 = typeof import('@azure/msal-react');
type __TestMockModule3 = typeof import('@azure/msal-browser');
type __TestMockModule4 = typeof import('@/api/web-api-client');
type __TestMockModule5 = typeof import('@/instrumentation/AppLogger');
type __TestMockModule6 = typeof import('@/storage/targetOrganisation');
type __TestMockModule7 = typeof import('@/terms-config.json');
type __TestMockModule8 = typeof import('@/authentication/authConfig');
type __TestMockModule9 = typeof import('@/routes/common/helperFunctions');
type __TestMockModule10 = typeof import('@/env');
type __TestMockModule11 = typeof import('react-router');
type __TestMockModule12 = typeof import('@/routes/preConditions/PreConditions');
type __TestMockModule13 = typeof import('@/components/ErrorBoundary');
type __TestMockModule14 = typeof import('@/components/BlockUISpinner');
type __TestMockModule15 = typeof import('@/instrumentation/AppInsightsService');
type __TestMockModule16 = typeof import('@azure/msal-browser/redirect-bridge');
type __TestMockModule17 = typeof import('react-aria-components/Breadcrumbs');
type __TestMockModule18 = typeof import('react-aria-components/Link');
type __TestMockModule19 = typeof import('@/assets/GovCrest.svg');
type __TestMockModule20 = typeof import('@/components/RouteLeavingGuard');
type __TestMockModule21 = typeof import('@/components/forms/UnsavedFormPrompt');
type __TestMockModule22 = typeof import('@/analytics/GoogleAnalytics');
type __TestMockModule23 =
  typeof import('@/components/modals/ConfirmationModal');
type __TestMockModule24 =
  typeof import('@/components/forms/WizardForm/WizardStep');
type __TestMockModule25 = typeof import('@/components/SteppedNavigation');
type __TestMockModule26 = typeof import('@/authentication/hooks');
type __TestMockModule27 = typeof import('@/components/modals/ModalContext');
type __TestMockModule28 = typeof import('@/components/modals/ContentModal');
type __TestMockModule29 = typeof import('@/components/Inputs/TextInput');
type __TestMockModule30 = typeof import('@/components/Inputs/NumberInput');
type __TestMockModule31 = typeof import('@/components/Inputs/AddressLookup');
type __TestMockModule32 =
  typeof import('@/components/Inputs/AutoSuggest/AutoSuggestContainer');
type __TestMockModule33 =
  typeof import('@/components/Inputs/DatePicker/CustomDateInput');
type __TestMockModule34 = typeof import('react-datepicker');
type __TestMockModule35 =
  typeof import('@/components/Inputs/DatePicker/CustomDatePicker');
type __TestMockModule36 =
  typeof import('@/components/Inputs/RhfAutoSuggest/RhfAutoSuggestContainer');
type __TestMockModule37 = typeof import('react-aria-components/ComboBox');
type __TestMockModule38 = typeof import('react-aria-components/Group');
type __TestMockModule39 =
  typeof import('@/components/Inputs/AutoSuggest/AutoSuggestOptions');
type __TestMockModule40 = typeof import('@/components/Header');
type __TestMockModule41 = typeof import('@/components/Footer');
type __TestMockModule42 = typeof import('@/components/Utilities/skipLinks');
type __TestMockModule43 =
  typeof import('@/components/Utilities/backToTopButton');
type __TestMockModule44 =
  typeof import('@/components/Utilities/routeChangeScrollTop');
type __TestMockModule45 = typeof import('@/hooks/useRouteAccessibility');
type __TestMockModule46 = typeof import('@/storage/notification');
type __TestMockModule47 = typeof import('@/storage/types');
type __TestMockModule48 =
  typeof import('@/components/Alert/NotificationMessage');
type __TestMockModule49 = typeof import('react-bootstrap');
type __TestMockModule50 = typeof import('@/components/Actions');
type __TestMockModule51 = typeof import('react-bootstrap/Modal');
type __TestMockModule52 = typeof import('@/components/Inputs/RadioButtonGroup');
type __TestMockModule53 =
  typeof import('@/components/SearchFilter/TypeApproval/paFilterMenu');
type __TestMockModule54 = typeof import('@/components/get-started/get-started');
type __TestMockModule55 = typeof import('slate');
type __TestMockModule56 =
  typeof import('@storybook/addon-vitest/vitest-plugin');
type __TestMockModule57 = typeof import('@microsoft/applicationinsights-web');
type __TestMockModule58 =
  typeof import('@microsoft/applicationinsights-react-js');
type __TestMockModule59 = typeof import('@/components/Utilities/useBodyClass');
type __TestMockModule60 = typeof import('@/components/forms/WizardForm');
type __TestMockModule61 = typeof import('@/routes/acceptQuote/reportRecipient');
type __TestMockModule62 =
  typeof import('@/routes/acceptQuote/deliveryAndReturn');
type __TestMockModule63 = typeof import('@/routes/acceptQuote/paymentDetails');
type __TestMockModule64 =
  typeof import('@/routes/acceptQuote/summaryAndAccept');
type __TestMockModule65 =
  typeof import('@/routes/acceptQuote/reportRecipientProps');
type __TestMockModule66 =
  typeof import('@/routes/acceptQuote/deliveryAndReturnProps');
type __TestMockModule67 =
  typeof import('@/routes/acceptQuote/paymentDetailsProps');
type __TestMockModule68 =
  typeof import('@/routes/acceptQuote/summaryAndAcceptProps');
type __TestMockModule69 = typeof import('@/components/Inputs/RhfAddressLookup');
type __TestMockModule70 = typeof import('@/components/forms/HidableField');
type __TestMockModule71 =
  typeof import('@/components/forms/CommonForms/ContactDetails');
type __TestMockModule72 = typeof import('@/storage/sessionStorageCache');
type __TestMockModule73 =
  typeof import('@/routes/acceptQuote/quotationSummary');
type __TestMockModule74 = typeof import('@/components/Accordion');
type __TestMockModule75 = typeof import('@/components/Buttons/EditButton');
type __TestMockModule76 = typeof import('@/components/HeaderIntroText');
type __TestMockModule77 = typeof import('@/components/InTextLink');
type __TestMockModule78 = typeof import('@/components/Icons/ExternalLinkIcon');
type __TestMockModule79 = typeof import('@/components/Inputs/Checkbox');
type __TestMockModule80 =
  typeof import('@/components/Inputs/OrganisationNameLookup');
type __TestMockModule81 = typeof import('@/routes/account/accountDetails');
type __TestMockModule82 = typeof import('@/routes/account/organisationDetails');
type __TestMockModule83 = typeof import('@/routes/contact/contactDetails');
type __TestMockModule84 =
  typeof import('@/routes/account/create/createAccountProps');
type __TestMockModule85 =
  typeof import('@/routes/account/update/updateAccountProps');
type __TestMockModule86 =
  typeof import('@/routes/account/addBranch/addBranchProps');
type __TestMockModule87 =
  typeof import('@/routes/contact/create/createContactProps');
type __TestMockModule88 =
  typeof import('@/routes/contact/update/updateContactProps');
type __TestMockModule89 = typeof import('@/components/Utilities/useHtmlTitle');
type __TestMockModule90 = typeof import('@/components/forms/FormBanner');
type __TestMockModule91 = typeof import('@/routes/common/openWindow');
type __TestMockModule92 = typeof import('@/hooks/useUserServices');
type __TestMockModule93 = typeof import('@/components/Welcome');
type __TestMockModule94 = typeof import('@/components/tiles/StandardPathway');
type __TestMockModule95 = typeof import('@/components/RequestList/noRequests');
type __TestMockModule96 =
  typeof import('@/components/RequestList/paRequestItem');
type __TestMockModule97 =
  typeof import('@/components/SearchFilter/TypeApproval/paSearchFilter');
type __TestMockModule98 = typeof import('@/components/Pagination');
type __TestMockModule99 = typeof import('@/components/PaginationHeader');
type __TestMockModule100 = typeof import('@/routes/common/errorRoutes');
type __TestMockModule101 =
  typeof import('@/routes/common/dashboardNotifications');
type __TestMockModule102 = typeof import('react-number-format');
type __TestMockModule103 = typeof import('@/routes/common/constants');
type __TestMockModule104 = typeof import('@/components/Utilities/useDebounce');
type __TestMockModule105 = typeof import('@/components/SearchFilter');
type __TestMockModule106 =
  typeof import('@/components/RequestList/requestItem');
type __TestMockModule107 =
  typeof import('@/components/RequestList/instrumentItem');
type __TestMockModule108 = typeof import('@/routes/common/enums');
type __TestMockModule109 =
  typeof import('@/components/modals/BranchSelectorModal/enums');
type __TestMockModule110 = typeof import('@/components/Layout');
type __TestMockModule111 =
  typeof import('@/components/modals/TermsAndCondition');
type __TestMockModule112 =
  typeof import('@/components/modals/BranchSelectorModal');
type __TestMockModule113 = typeof import('@/components/modals/RFQDeleteModal');
type __TestMockModule114 =
  typeof import('@/components/Utilities/routeAccessibleNavigation');
type __TestMockModule115 = typeof import('@/components/Breadcrumb');
type __TestMockModule116 =
  typeof import('@/components/Utilities/ViewPdfQuoteTerms');
type __TestMockModule117 = typeof import('@/components/Utilities/ViewPdfQuote');
type __TestMockModule118 =
  typeof import('@/components/Utilities/ViewMeasurementReport');
type __TestMockModule119 = typeof import('@/components/Utilities/mailingLabel');
type __TestMockModule120 =
  typeof import('@/components/Utilities/deliveryInstructions');
type __TestMockModule121 = typeof import('@/components/Pill/QuoteStatusPill');
type __TestMockModule122 = typeof import('@/components/Pill/StatusPill');
type __TestMockModule123 = typeof import('react');
type __TestMockModule124 = typeof import('@/routes/ta/manage/appDocuments');
type __TestMockModule125 = typeof import('@/routes/ta/manage/appMessages');
type __TestMockModule126 = typeof import('@/routes/ta/manage/appDetailsProps');
type __TestMockModule127 =
  typeof import('@/components/Buttons/BackToDashboardButton');
type __TestMockModule128 =
  typeof import('@/routes/ta/summary/OrganisationSummary');
type __TestMockModule129 =
  typeof import('@/routes/ta/summary/ApplicationSummary');
type __TestMockModule130 = typeof import('@/routes/ta/rhfSupportingDocuments');
type __TestMockModule131 = typeof import('@/components/Inputs/SelectInput');
type __TestMockModule132 = typeof import('@/components/Inputs/CheckboxGroup');
type __TestMockModule133 = typeof import('@/components/Inputs/RadioButton');
type __TestMockModule134 = typeof import('@/components/Inputs/TextAreaInput');
type __TestMockModule135 =
  typeof import('@/components/Inputs/CertificateNumberLookup');
type __TestMockModule136 = typeof import('@/routes/ta/instrumentInfoPanel');
type __TestMockModule137 = typeof import('@/components/SummaryDisplay');
type __TestMockModule138 = typeof import('@/routes/ta/organisationAndContact');
type __TestMockModule139 =
  typeof import('@/routes/ta/applicationAndInstrument');
type __TestMockModule140 = typeof import('@/routes/ta/summaryAndSubmit');
type __TestMockModule141 = typeof import('@/routes/ta/supportingDocuments');
type __TestMockModule142 =
  typeof import('@/components/SlateEditor/SlateEditor');
type __TestMockModule143 = typeof import('@/components/Inputs/AuthorisedAgent');
type __TestMockModule144 = typeof import('@/routes/ta/manage/appDetails');
type __TestMockModule145 = typeof import('@/components/Inputs/RhfAttachment');
type __TestMockModule146 =
  typeof import('@/components/Inputs/Attachment/index-new');
type __TestMockModule147 = typeof import('formik');
type __TestMockModule148 = typeof import('@/components/Inputs/DatePicker');
type __TestMockModule149 =
  typeof import('@/routes/requestForQuote/organisationAndContact');
type __TestMockModule150 =
  typeof import('@/routes/requestForQuote/instrumentAndRequest');
type __TestMockModule151 =
  typeof import('@/routes/requestForQuote/requestForQuoteSummary');
type __TestMockModule152 = typeof import('@/routes/quotation/quoteDetails');
type __TestMockModule153 =
  typeof import('@/routes/quotation/nMIContactDetails');
type __TestMockModule154 = typeof import('react-dom/client');
type __TestMockModule155 = typeof import('react-router/dom');
type __TestMockModule156 = typeof import('@/authentication/AccountProvider');
type __TestMockModule157 = typeof import('@/App');
type __TestMockModule158 = typeof import('@/trustedtypes');
type __TestMockModule159 = typeof import('dompurify');
