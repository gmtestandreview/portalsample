# ESLint Baseline

ESLint was introduced on 2026-06-05 for the NMI portal source snapshot.

## Current Status

The accepted rollout warning debt was cleared on 2026-06-28. `npm run lint`
passes with zero diagnostics. New warnings and errors are blockers.

## Historical Rollout Warnings

The following 131 warnings are preserved as the 2026-06-05 rollout record. They
are no longer accepted in the current baseline.

```bash
npm run lint
```

Warnings accepted at rollout:

```text

C:\Users\gregm\offline-site-robots-off\portal.measurement.gov.au\source-map-capture\portal.measurement.gov.au\ClientApp\src\analytics\GoogleAnalytics.tsx
  10:5  warning  'sendPageView' is defined but never used. Allowed unused args must match /^_/u  @typescript-eslint/no-unused-vars

C:\Users\gregm\offline-site-robots-off\portal.measurement.gov.au\source-map-capture\portal.measurement.gov.au\ClientApp\src\components\Alert\Alert.stories.tsx
  2:18  warning  'userEvent' is defined but never used. Allowed unused vars must match /^_/u  @typescript-eslint/no-unused-vars

C:\Users\gregm\offline-site-robots-off\portal.measurement.gov.au\source-map-capture\portal.measurement.gov.au\ClientApp\src\components\Alert\index.tsx
  23:9  warning  'role' is assigned a value but never used. Allowed unused vars must match /^_/u  @typescript-eslint/no-unused-vars

C:\Users\gregm\offline-site-robots-off\portal.measurement.gov.au\source-map-capture\portal.measurement.gov.au\ClientApp\src\components\Alert\types.ts
  16:18  warning  An interface declaring no members is equivalent to its supertype  @typescript-eslint/no-empty-object-type

C:\Users\gregm\offline-site-robots-off\portal.measurement.gov.au\source-map-capture\portal.measurement.gov.au\ClientApp\src\components\Breadcrumb\index.tsx
  1:8  warning  'React' is defined but never used. Allowed unused vars must match /^_/u  @typescript-eslint/no-unused-vars

C:\Users\gregm\offline-site-robots-off\portal.measurement.gov.au\source-map-capture\portal.measurement.gov.au\ClientApp\src\components\Header\NavbarEnvironment.tsx
  1:13  warning  'React' is defined but never used. Allowed unused vars must match /^_/u  @typescript-eslint/no-unused-vars

C:\Users\gregm\offline-site-robots-off\portal.measurement.gov.au\source-map-capture\portal.measurement.gov.au\ClientApp\src\components\Header\NavbarMessage.tsx
  25:7  warning  'SiteMaintenanceMessage' is assigned a value but never used. Allowed unused vars must match /^_/u  @typescript-eslint/no-unused-vars

C:\Users\gregm\offline-site-robots-off\portal.measurement.gov.au\source-map-capture\portal.measurement.gov.au\ClientApp\src\components\Home.tsx
  1:13  warning  'React' is defined but never used. Allowed unused vars must match /^_/u  @typescript-eslint/no-unused-vars

C:\Users\gregm\offline-site-robots-off\portal.measurement.gov.au\source-map-capture\portal.measurement.gov.au\ClientApp\src\components\Icons\ExternalLinkIcon.tsx
  2:8  warning  'React' is defined but never used. Allowed unused vars must match /^_/u  @typescript-eslint/no-unused-vars

C:\Users\gregm\offline-site-robots-off\portal.measurement.gov.au\source-map-capture\portal.measurement.gov.au\ClientApp\src\components\Inputs\AddressLookup\types.ts
  1:15  warning  'ReactNode' is defined but never used. Allowed unused vars must match /^_/u  @typescript-eslint/no-unused-vars

C:\Users\gregm\offline-site-robots-off\portal.measurement.gov.au\source-map-capture\portal.measurement.gov.au\ClientApp\src\components\Inputs\AutoSuggest\AutoSuggestOptions.tsx
  9:9  warning  'name' is assigned a value but never used. Allowed unused vars must match /^_/u  @typescript-eslint/no-unused-vars

C:\Users\gregm\offline-site-robots-off\portal.measurement.gov.au\source-map-capture\portal.measurement.gov.au\ClientApp\src\components\Inputs\DatePicker\CustomDateInput.tsx
  26:9  warning  'handleCloseCalendar' is assigned a value but never used. Allowed unused vars must match /^_/u  @typescript-eslint/no-unused-vars

C:\Users\gregm\offline-site-robots-off\portal.measurement.gov.au\source-map-capture\portal.measurement.gov.au\ClientApp\src\components\Inputs\DatePicker\index.tsx
  21:9  warning  'startDate' is assigned a value but never used. Allowed unused vars must match /^_/u  @typescript-eslint/no-unused-vars

C:\Users\gregm\offline-site-robots-off\portal.measurement.gov.au\source-map-capture\portal.measurement.gov.au\ClientApp\src\components\Inputs\DatePicker\types.ts
  1:56  warning  'MutableRefObject' is defined but never used. Allowed unused vars must match /^_/u  @typescript-eslint/no-unused-vars

C:\Users\gregm\offline-site-robots-off\portal.measurement.gov.au\source-map-capture\portal.measurement.gov.au\ClientApp\src\components\Inputs\OrganisationNameLookup\index.tsx
   90:8   warning  React Hook useEffect has missing dependencies: '_orgNameOptions.value', '_parentField.value', 'matchType', 'maxResults', 'optionsFieldName', 'parentName', and 'parentOptionsName'. Either include them or remove the dependency array  react-hooks/exhaustive-deps
  116:11  warning  'handleBlur' is assigned a value but never used. Allowed unused vars must match /^_/u                                                                                                                                                   @typescript-eslint/no-unused-vars

C:\Users\gregm\offline-site-robots-off\portal.measurement.gov.au\source-map-capture\portal.measurement.gov.au\ClientApp\src\components\Inputs\RadioButtonGroup\index.tsx
  11:37  warning  The `{}` ("empty object") type allows any non-nullish value, including literals like `0` and `""`.
- If that's what you want, disable this lint rule with an inline comment or configure the 'allowObjectTypes' rule option.
- If you want a type meaning "any object", you probably want `object` instead.
- If you want a type meaning "any value", you probably want `unknown` instead  @typescript-eslint/no-empty-object-type

C:\Users\gregm\offline-site-robots-off\portal.measurement.gov.au\source-map-capture\portal.measurement.gov.au\ClientApp\src\components\Inputs\RadioButton\index.tsx
  5:32  warning  The `{}` ("empty object") type allows any non-nullish value, including literals like `0` and `""`.
- If that's what you want, disable this lint rule with an inline comment or configure the 'allowObjectTypes' rule option.
- If you want a type meaning "any object", you probably want `object` instead.
- If you want a type meaning "any value", you probably want `unknown` instead  @typescript-eslint/no-empty-object-type

C:\Users\gregm\offline-site-robots-off\portal.measurement.gov.au\source-map-capture\portal.measurement.gov.au\ClientApp\src\components\Inputs\TextAreaInput\index.tsx
  38:26  warning  'event' is defined but never used. Allowed unused args must match /^_/u  @typescript-eslint/no-unused-vars

C:\Users\gregm\offline-site-robots-off\portal.measurement.gov.au\source-map-capture\portal.measurement.gov.au\ClientApp\src\components\RequestList\instrumentItem.tsx
  131:7   warning  'renderQuotationContent' is assigned a value but never used. Allowed unused vars must match /^_/u             @typescript-eslint/no-unused-vars
  211:7   warning  'renderInstrumentReportsDtoContent' is assigned a value but never used. Allowed unused vars must match /^_/u  @typescript-eslint/no-unused-vars
  420:44  warning  'lastUpdated' is assigned a value but never used. Allowed unused vars must match /^_/u                        @typescript-eslint/no-unused-vars
  420:57  warning  'quote' is assigned a value but never used. Allowed unused vars must match /^_/u                              @typescript-eslint/no-unused-vars
  420:64  warning  'report' is assigned a value but never used. Allowed unused vars must match /^_/u                             @typescript-eslint/no-unused-vars

C:\Users\gregm\offline-site-robots-off\portal.measurement.gov.au\source-map-capture\portal.measurement.gov.au\ClientApp\src\components\SearchFilter\filterMenu.tsx
   32:9   warning  'className' is assigned a value but never used. Allowed unused vars must match /^_/u     @typescript-eslint/no-unused-vars
   81:26  warning  'event' is defined but never used. Allowed unused args must match /^_/u                  @typescript-eslint/no-unused-vars
   85:33  warning  'event' is defined but never used. Allowed unused args must match /^_/u                  @typescript-eslint/no-unused-vars
  100:11  warning  'filterByYear' is assigned a value but never used. Allowed unused vars must match /^_/u  @typescript-eslint/no-unused-vars
  212:62  warning  'setValues' is defined but never used. Allowed unused args must match /^_/u              @typescript-eslint/no-unused-vars

C:\Users\gregm\offline-site-robots-off\portal.measurement.gov.au\source-map-capture\portal.measurement.gov.au\ClientApp\src\components\SearchFilter\searchBox.tsx
  17:32  warning  'e' is defined but never used. Allowed unused args must match /^_/u  @typescript-eslint/no-unused-vars

C:\Users\gregm\offline-site-robots-off\portal.measurement.gov.au\source-map-capture\portal.measurement.gov.au\ClientApp\src\components\SummaryDisplay\index.tsx
   8:9  warning  'id' is assigned a value but never used. Allowed unused vars must match /^_/u                        @typescript-eslint/no-unused-vars
  16:9  warning  'prepend' is assigned a value but never used. Allowed unused vars must match /^_/u                   @typescript-eslint/no-unused-vars
  17:9  warning  'append' is assigned a value but never used. Allowed unused vars must match /^_/u                    @typescript-eslint/no-unused-vars
  20:9  warning  'thousandSeparator' is assigned a value but never used. Allowed unused vars must match /^_/u         @typescript-eslint/no-unused-vars
  22:9  warning  'allowNegative' is assigned a value but never used. Allowed unused vars must match /^_/u             @typescript-eslint/no-unused-vars
  24:9  warning  'allowLeadingZeros' is assigned a value but never used. Allowed unused vars must match /^_/u         @typescript-eslint/no-unused-vars
  26:9  warning  'allowedDecimalSeparators' is assigned a value but never used. Allowed unused vars must match /^_/u  @typescript-eslint/no-unused-vars

C:\Users\gregm\offline-site-robots-off\portal.measurement.gov.au\source-map-capture\portal.measurement.gov.au\ClientApp\src\components\Utilities\ViewPdfButton.tsx
  40:35  warning  'e' is defined but never used. Allowed unused args must match /^_/u  @typescript-eslint/no-unused-vars

C:\Users\gregm\offline-site-robots-off\portal.measurement.gov.au\source-map-capture\portal.measurement.gov.au\ClientApp\src\components\Utilities\ViewPdfQuoteTerms.tsx
  68:35  warning  'e' is defined but never used. Allowed unused args must match /^_/u  @typescript-eslint/no-unused-vars

C:\Users\gregm\offline-site-robots-off\portal.measurement.gov.au\source-map-capture\portal.measurement.gov.au\ClientApp\src\components\forms\FormikForm\formikHelpers.ts
  4:34  warning  The `{}` ("empty object") type allows any non-nullish value, including literals like `0` and `""`.
- If that's what you want, disable this lint rule with an inline comment or configure the 'allowObjectTypes' rule option.
- If you want a type meaning "any object", you probably want `object` instead.
- If you want a type meaning "any value", you probably want `unknown` instead  @typescript-eslint/no-empty-object-type

C:\Users\gregm\offline-site-robots-off\portal.measurement.gov.au\source-map-capture\portal.measurement.gov.au\ClientApp\src\components\forms\WizardForm\WizardRoutedStep.tsx
  192:23  warning  'err' is assigned a value but never used. Allowed unused vars must match /^_/u  @typescript-eslint/no-unused-vars

C:\Users\gregm\offline-site-robots-off\portal.measurement.gov.au\source-map-capture\portal.measurement.gov.au\ClientApp\src\components\modals\BranchSelectorModal\index.tsx
  114:23  warning  'setIsLoading' is assigned a value but never used. Allowed unused vars must match /^_/u  @typescript-eslint/no-unused-vars

C:\Users\gregm\offline-site-robots-off\portal.measurement.gov.au\source-map-capture\portal.measurement.gov.au\ClientApp\src\components\modals\TermsAndCondition\index.tsx
  111:12  warning  'isLoading' is assigned a value but never used. Allowed unused vars must match /^_/u              @typescript-eslint/no-unused-vars
  112:32  warning  'setIsModalDataLoading' is assigned a value but never used. Allowed unused vars must match /^_/u  @typescript-eslint/no-unused-vars

C:\Users\gregm\offline-site-robots-off\portal.measurement.gov.au\source-map-capture\portal.measurement.gov.au\ClientApp\src\routes\acceptQuote\deliveryAndReturn.tsx
   92:21  warning  'defaultOrganisationId' is assigned a value but never used. Allowed unused vars must match /^_/u                                                @typescript-eslint/no-unused-vars
  113:8   warning  React Hook useEffect has missing dependencies: 'account', 'accounts', 'id', and 'instance'. Either include them or remove the dependency array  react-hooks/exhaustive-deps

C:\Users\gregm\offline-site-robots-off\portal.measurement.gov.au\source-map-capture\portal.measurement.gov.au\ClientApp\src\routes\acceptQuote\index.tsx
  82:8  warning  React Hook useEffect has a missing dependency: 'navigate'. Either include it or remove the dependency array  react-hooks/exhaustive-deps

C:\Users\gregm\offline-site-robots-off\portal.measurement.gov.au\source-map-capture\portal.measurement.gov.au\ClientApp\src\routes\acceptQuote\paymentDetails.tsx
  56:8  warning  React Hook useEffect has a missing dependency: 'getAcceptQuotePreInfo'. Either include it or remove the dependency array  react-hooks/exhaustive-deps

C:\Users\gregm\offline-site-robots-off\portal.measurement.gov.au\source-map-capture\portal.measurement.gov.au\ClientApp\src\routes\acceptQuote\reportRecipient.tsx
  32:12  warning  'acceptQuotePreInfo' is assigned a value but never used. Allowed unused vars must match /^_/u                                                                           @typescript-eslint/no-unused-vars
  36:11  warning  'accountDetails' is assigned a value but never used. Allowed unused vars must match /^_/u                                                                               @typescript-eslint/no-unused-vars
  72:8   warning  React Hook useEffect has missing dependencies: 'account?.details?.homeAccountId', 'accounts', 'id', and 'instance'. Either include them or remove the dependency array  react-hooks/exhaustive-deps

C:\Users\gregm\offline-site-robots-off\portal.measurement.gov.au\source-map-capture\portal.measurement.gov.au\ClientApp\src\routes\acceptQuote\summaryAndAccept.tsx
  132:8   warning  React Hook useEffect has missing dependencies: 'accounts', 'id', and 'instance'. Either include them or remove the dependency array  react-hooks/exhaustive-deps
  229:47  warning  'e' is defined but never used. Allowed unused args must match /^_/u                                                                  @typescript-eslint/no-unused-vars
  402:43  warning  'e' is defined but never used. Allowed unused args must match /^_/u                                                                  @typescript-eslint/no-unused-vars

C:\Users\gregm\offline-site-robots-off\portal.measurement.gov.au\source-map-capture\portal.measurement.gov.au\ClientApp\src\routes\acceptQuote\types.ts
  10:18  warning  An interface declaring no members is equivalent to its supertype  @typescript-eslint/no-empty-object-type
  11:18  warning  An interface declaring no members is equivalent to its supertype  @typescript-eslint/no-empty-object-type
  12:18  warning  An interface declaring no members is equivalent to its supertype  @typescript-eslint/no-empty-object-type
  13:18  warning  An interface declaring no members is equivalent to its supertype  @typescript-eslint/no-empty-object-type
  14:18  warning  An interface declaring no members is equivalent to its supertype  @typescript-eslint/no-empty-object-type

C:\Users\gregm\offline-site-robots-off\portal.measurement.gov.au\source-map-capture\portal.measurement.gov.au\ClientApp\src\routes\account\addBranch\addBranchProps.ts
  105:7   warning  'cancelSave' is assigned a value but never used. Allowed unused vars must match /^_/u  @typescript-eslint/no-unused-vars
  120:59  warning  'errorType' is defined but never used. Allowed unused args must match /^_/u            @typescript-eslint/no-unused-vars
  153:33  warning  'x' is defined but never used. Allowed unused args must match /^_/u                    @typescript-eslint/no-unused-vars

C:\Users\gregm\offline-site-robots-off\portal.measurement.gov.au\source-map-capture\portal.measurement.gov.au\ClientApp\src\routes\account\create\createAccountProps.ts
  84:59  warning  'errorType' is defined but never used. Allowed unused args must match /^_/u  @typescript-eslint/no-unused-vars

C:\Users\gregm\offline-site-robots-off\portal.measurement.gov.au\source-map-capture\portal.measurement.gov.au\ClientApp\src\routes\account\update\updateAccountProps.ts
  110:59  warning  'errorType' is defined but never used. Allowed unused args must match /^_/u  @typescript-eslint/no-unused-vars

C:\Users\gregm\offline-site-robots-off\portal.measurement.gov.au\source-map-capture\portal.measurement.gov.au\ClientApp\src\routes\common\dashboardNotifications.ts
  80:82  warning  'orgName' is defined but never used. Allowed unused args must match /^_/u  @typescript-eslint/no-unused-vars

C:\Users\gregm\offline-site-robots-off\portal.measurement.gov.au\source-map-capture\portal.measurement.gov.au\ClientApp\src\routes\common\helperFunctions.ts
  337:17  warning  'index' is defined but never used. Allowed unused args must match /^_/u  @typescript-eslint/no-unused-vars
  337:24  warning  'c' is defined but never used. Allowed unused args must match /^_/u      @typescript-eslint/no-unused-vars

C:\Users\gregm\offline-site-robots-off\portal.measurement.gov.au\source-map-capture\portal.measurement.gov.au\ClientApp\src\routes\contact\create\createContactProps.ts
   16:90  warning  'accountId' is defined but never used. Allowed unused args must match /^_/u  @typescript-eslint/no-unused-vars
  109:59  warning  'errorType' is defined but never used. Allowed unused args must match /^_/u  @typescript-eslint/no-unused-vars

C:\Users\gregm\offline-site-robots-off\portal.measurement.gov.au\source-map-capture\portal.measurement.gov.au\ClientApp\src\routes\contact\update\updateContactProps.ts
   16:90  warning  'accountId' is defined but never used. Allowed unused args must match /^_/u  @typescript-eslint/no-unused-vars
  109:59  warning  'errorType' is defined but never used. Allowed unused args must match /^_/u  @typescript-eslint/no-unused-vars

C:\Users\gregm\offline-site-robots-off\portal.measurement.gov.au\source-map-capture\portal.measurement.gov.au\ClientApp\src\routes\dashboard\index.tsx
  359:8  warning  React Hook useEffect has a missing dependency: 'initialFilters'. Either include it or remove the dependency array                                                                                                                    react-hooks/exhaustive-deps
  381:8  warning  React Hook useEffect has missing dependencies: 'accountDetails?.userProfile' and 'saveUserProfile'. Either include them or remove the dependency array                                                                               react-hooks/exhaustive-deps
  479:8  warning  React Hook useEffect has missing dependencies: 'accountDetails', 'accountState?.details?.homeAccountId', 'modalState?.showBranchSelector', and 'modalState?.showRFQDeleteModal'. Either include them or remove the dependency array  react-hooks/exhaustive-deps

C:\Users\gregm\offline-site-robots-off\portal.measurement.gov.au\source-map-capture\portal.measurement.gov.au\ClientApp\src\routes\help-guide\faqs.tsx
  13:23  warning  'setIsLoading' is assigned a value but never used. Allowed unused vars must match /^_/u  @typescript-eslint/no-unused-vars

C:\Users\gregm\offline-site-robots-off\portal.measurement.gov.au\source-map-capture\portal.measurement.gov.au\ClientApp\src\routes\help-guide\how-to-setup-access.tsx
  13:23  warning  'setIsLoading' is assigned a value but never used. Allowed unused vars must match /^_/u  @typescript-eslint/no-unused-vars

C:\Users\gregm\offline-site-robots-off\portal.measurement.gov.au\source-map-capture\portal.measurement.gov.au\ClientApp\src\routes\help-guide\index.tsx
  15:23  warning  'setIsLoading' is assigned a value but never used. Allowed unused vars must match /^_/u  @typescript-eslint/no-unused-vars

C:\Users\gregm\offline-site-robots-off\portal.measurement.gov.au\source-map-capture\portal.measurement.gov.au\ClientApp\src\routes\measurementReport\index.tsx
   84:21  warning  'setErrored' is assigned a value but never used. Allowed unused vars must match /^_/u                        @typescript-eslint/no-unused-vars
   86:23  warning  'setForbidden' is assigned a value but never used. Allowed unused vars must match /^_/u                      @typescript-eslint/no-unused-vars
   87:22  warning  'setShowInfo' is assigned a value but never used. Allowed unused vars must match /^_/u                       @typescript-eslint/no-unused-vars
  137:8   warning  React Hook useEffect has a missing dependency: 'navigate'. Either include it or remove the dependency array  react-hooks/exhaustive-deps

C:\Users\gregm\offline-site-robots-off\portal.measurement.gov.au\source-map-capture\portal.measurement.gov.au\ClientApp\src\routes\measurementReport\indexList.tsx
  29:21  warning  'setErrored' is assigned a value but never used. Allowed unused vars must match /^_/u  @typescript-eslint/no-unused-vars
  32:12  warning  'fileError' is assigned a value but never used. Allowed unused vars must match /^_/u   @typescript-eslint/no-unused-vars

C:\Users\gregm\offline-site-robots-off\portal.measurement.gov.au\source-map-capture\portal.measurement.gov.au\ClientApp\src\routes\measurementReport\reportDetails.tsx
  152:55  warning  'e' is defined but never used. Allowed unused args must match /^_/u  @typescript-eslint/no-unused-vars

C:\Users\gregm\offline-site-robots-off\portal.measurement.gov.au\source-map-capture\portal.measurement.gov.au\ClientApp\src\routes\quotation\index.tsx
  101:21  warning  'setErrored' is assigned a value but never used. Allowed unused vars must match /^_/u                        @typescript-eslint/no-unused-vars
  103:23  warning  'setForbidden' is assigned a value but never used. Allowed unused vars must match /^_/u                      @typescript-eslint/no-unused-vars
  104:22  warning  'setShowInfo' is assigned a value but never used. Allowed unused vars must match /^_/u                       @typescript-eslint/no-unused-vars
  216:8   warning  React Hook useEffect has a missing dependency: 'navigate'. Either include it or remove the dependency array  react-hooks/exhaustive-deps

C:\Users\gregm\offline-site-robots-off\portal.measurement.gov.au\source-map-capture\portal.measurement.gov.au\ClientApp\src\routes\quotation\quoteDetails.tsx
  271:55  warning  'e' is defined but never used. Allowed unused args must match /^_/u  @typescript-eslint/no-unused-vars

C:\Users\gregm\offline-site-robots-off\portal.measurement.gov.au\source-map-capture\portal.measurement.gov.au\ClientApp\src\routes\requestForQuote\copy\index.tsx
  36:8  warning  React Hook useEffect has a missing dependency: 'id'. Either include it or remove the dependency array  react-hooks/exhaustive-deps

C:\Users\gregm\offline-site-robots-off\portal.measurement.gov.au\source-map-capture\portal.measurement.gov.au\ClientApp\src\routes\requestForQuote\organisationAndContactProps.ts
  67:40  warning  'id' is defined but never used. Allowed unused args must match /^_/u         @typescript-eslint/no-unused-vars
  67:56  warning  'errorCode' is defined but never used. Allowed unused args must match /^_/u  @typescript-eslint/no-unused-vars
  67:75  warning  'errorType' is defined but never used. Allowed unused args must match /^_/u  @typescript-eslint/no-unused-vars
  85:33  warning  'x' is defined but never used. Allowed unused args must match /^_/u          @typescript-eslint/no-unused-vars
  86:32  warning  'x' is defined but never used. Allowed unused args must match /^_/u          @typescript-eslint/no-unused-vars

C:\Users\gregm\offline-site-robots-off\portal.measurement.gov.au\source-map-capture\portal.measurement.gov.au\ClientApp\src\routes\requestForQuote\requestForQuoteSummaryProps.ts
  37:40  warning  'id' is defined but never used. Allowed unused args must match /^_/u          @typescript-eslint/no-unused-vars
  37:56  warning  'errorCode' is defined but never used. Allowed unused args must match /^_/u   @typescript-eslint/no-unused-vars
  37:75  warning  'errorType' is defined but never used. Allowed unused args must match /^_/u   @typescript-eslint/no-unused-vars
  43:5   warning  'isComplete' is defined but never used. Allowed unused args must match /^_/u  @typescript-eslint/no-unused-vars
  93:36  warning  'x' is defined but never used. Allowed unused args must match /^_/u           @typescript-eslint/no-unused-vars

C:\Users\gregm\offline-site-robots-off\portal.measurement.gov.au\source-map-capture\portal.measurement.gov.au\ClientApp\src\routes\requestForQuote\types.ts
  8:18  warning  An interface declaring no members is equivalent to its supertype  @typescript-eslint/no-empty-object-type
  9:18  warning  An interface declaring no members is equivalent to its supertype  @typescript-eslint/no-empty-object-type

C:\Users\gregm\offline-site-robots-off\portal.measurement.gov.au\source-map-capture\portal.measurement.gov.au\ClientApp\src\routes\requestForQuote\viewRequestForQuoteSummary.tsx
  21:39  warning  'isSubmitted' is defined but never used. Allowed unused args must match /^_/u  @typescript-eslint/no-unused-vars

C:\Users\gregm\offline-site-robots-off\portal.measurement.gov.au\source-map-capture\portal.measurement.gov.au\ClientApp\src\routes\requestForQuote\viewRequestForQuoteSummaryProps.ts
  32:40  warning  'id' is defined but never used. Allowed unused args must match /^_/u          @typescript-eslint/no-unused-vars
  32:56  warning  'errorCode' is defined but never used. Allowed unused args must match /^_/u   @typescript-eslint/no-unused-vars
  32:75  warning  'errorType' is defined but never used. Allowed unused args must match /^_/u   @typescript-eslint/no-unused-vars
  38:5   warning  'isComplete' is defined but never used. Allowed unused args must match /^_/u  @typescript-eslint/no-unused-vars

C:\Users\gregm\offline-site-robots-off\portal.measurement.gov.au\source-map-capture\portal.measurement.gov.au\ClientApp\src\routes\services-we-offer\index.tsx
  16:23  warning  'setIsLoading' is assigned a value but never used. Allowed unused vars must match /^_/u  @typescript-eslint/no-unused-vars

C:\Users\gregm\offline-site-robots-off\portal.measurement.gov.au\source-map-capture\portal.measurement.gov.au\ClientApp\src\validationSchemas\common.ts
  89:37  warning  The `{}` ("empty object") type allows any non-nullish value, including literals like `0` and `""`.
- If that's what you want, disable this lint rule with an inline comment or configure the 'allowObjectTypes' rule option.
- If you want a type meaning "any object", you probably want `object` instead.
- If you want a type meaning "any value", you probably want `unknown` instead  @typescript-eslint/no-empty-object-type
  91:50  warning  The `{}` ("empty object") type allows any non-nullish value, including literals like `0` and `""`.
- If that's what you want, disable this lint rule with an inline comment or configure the 'allowObjectTypes' rule option.
- If you want a type meaning "any object", you probably want `object` instead.
- If you want a type meaning "any value", you probably want `unknown` instead  @typescript-eslint/no-empty-object-type

C:\Users\gregm\offline-site-robots-off\portal.measurement.gov.au\source-map-capture\portal.measurement.gov.au\ClientApp\src\validationSchemas\yupExtensions\stringExtensions.ts
  147:54  warning  The `{}` ("empty object") type allows any non-nullish value, including literals like `0` and `""`.
- If that's what you want, disable this lint rule with an inline comment or configure the 'allowObjectTypes' rule option.
- If you want a type meaning "any object", you probably want `object` instead.
- If you want a type meaning "any value", you probably want `unknown` instead  @typescript-eslint/no-empty-object-type
  183:54  warning  The `{}` ("empty object") type allows any non-nullish value, including literals like `0` and `""`.
- If that's what you want, disable this lint rule with an inline comment or configure the 'allowObjectTypes' rule option.
- If you want a type meaning "any object", you probably want `object` instead.
- If you want a type meaning "any value", you probably want `unknown` instead  @typescript-eslint/no-empty-object-type
  220:54  warning  The `{}` ("empty object") type allows any non-nullish value, including literals like `0` and `""`.
- If that's what you want, disable this lint rule with an inline comment or configure the 'allowObjectTypes' rule option.
- If you want a type meaning "any object", you probably want `object` instead.
- If you want a type meaning "any value", you probably want `unknown` instead  @typescript-eslint/no-empty-object-type
  262:54  warning  The `{}` ("empty object") type allows any non-nullish value, including literals like `0` and `""`.
- If that's what you want, disable this lint rule with an inline comment or configure the 'allowObjectTypes' rule option.
- If you want a type meaning "any object", you probably want `object` instead.
- If you want a type meaning "any value", you probably want `unknown` instead  @typescript-eslint/no-empty-object-type
  303:54  warning  The `{}` ("empty object") type allows any non-nullish value, including literals like `0` and `""`.
- If that's what you want, disable this lint rule with an inline comment or configure the 'allowObjectTypes' rule option.
- If you want a type meaning "any object", you probably want `object` instead.
- If you want a type meaning "any value", you probably want `unknown` instead  @typescript-eslint/no-empty-object-type
  339:54  warning  The `{}` ("empty object") type allows any non-nullish value, including literals like `0` and `""`.
- If that's what you want, disable this lint rule with an inline comment or configure the 'allowObjectTypes' rule option.
- If you want a type meaning "any object", you probably want `object` instead.
- If you want a type meaning "any value", you probably want `unknown` instead  @typescript-eslint/no-empty-object-type
  378:50  warning  The `{}` ("empty object") type allows any non-nullish value, including literals like `0` and `""`.
- If that's what you want, disable this lint rule with an inline comment or configure the 'allowObjectTypes' rule option.
- If you want a type meaning "any object", you probably want `object` instead.
- If you want a type meaning "any value", you probably want `unknown` instead  @typescript-eslint/no-empty-object-type
  416:54  warning  The `{}` ("empty object") type allows any non-nullish value, including literals like `0` and `""`.
- If that's what you want, disable this lint rule with an inline comment or configure the 'allowObjectTypes' rule option.
- If you want a type meaning "any object", you probably want `object` instead.
- If you want a type meaning "any value", you probably want `unknown` instead  @typescript-eslint/no-empty-object-type
  457:54  warning  The `{}` ("empty object") type allows any non-nullish value, including literals like `0` and `""`.
- If that's what you want, disable this lint rule with an inline comment or configure the 'allowObjectTypes' rule option.
- If you want a type meaning "any object", you probably want `object` instead.
- If you want a type meaning "any value", you probably want `unknown` instead  @typescript-eslint/no-empty-object-type
  492:54  warning  The `{}` ("empty object") type allows any non-nullish value, including literals like `0` and `""`.
- If that's what you want, disable this lint rule with an inline comment or configure the 'allowObjectTypes' rule option.
- If you want a type meaning "any object", you probably want `object` instead.
- If you want a type meaning "any value", you probably want `unknown` instead  @typescript-eslint/no-empty-object-type
  523:50  warning  The `{}` ("empty object") type allows any non-nullish value, including literals like `0` and `""`.
- If that's what you want, disable this lint rule with an inline comment or configure the 'allowObjectTypes' rule option.
- If you want a type meaning "any object", you probably want `object` instead.
- If you want a type meaning "any value", you probably want `unknown` instead  @typescript-eslint/no-empty-object-type
  553:65  warning  The `{}` ("empty object") type allows any non-nullish value, including literals like `0` and `""`.
- If that's what you want, disable this lint rule with an inline comment or configure the 'allowObjectTypes' rule option.
- If you want a type meaning "any object", you probably want `object` instead.
- If you want a type meaning "any value", you probably want `unknown` instead  @typescript-eslint/no-empty-object-type
  586:50  warning  The `{}` ("empty object") type allows any non-nullish value, including literals like `0` and `""`.
- If that's what you want, disable this lint rule with an inline comment or configure the 'allowObjectTypes' rule option.
- If you want a type meaning "any object", you probably want `object` instead.
- If you want a type meaning "any value", you probably want `unknown` instead  @typescript-eslint/no-empty-object-type
  622:50  warning  The `{}` ("empty object") type allows any non-nullish value, including literals like `0` and `""`.
- If that's what you want, disable this lint rule with an inline comment or configure the 'allowObjectTypes' rule option.
- If you want a type meaning "any object", you probably want `object` instead.
- If you want a type meaning "any value", you probably want `unknown` instead  @typescript-eslint/no-empty-object-type
  656:50  warning  The `{}` ("empty object") type allows any non-nullish value, including literals like `0` and `""`.
- If that's what you want, disable this lint rule with an inline comment or configure the 'allowObjectTypes' rule option.
- If you want a type meaning "any object", you probably want `object` instead.
- If you want a type meaning "any value", you probably want `unknown` instead  @typescript-eslint/no-empty-object-type
  689:50  warning  The `{}` ("empty object") type allows any non-nullish value, including literals like `0` and `""`.
- If that's what you want, disable this lint rule with an inline comment or configure the 'allowObjectTypes' rule option.
- If you want a type meaning "any object", you probably want `object` instead.
- If you want a type meaning "any value", you probably want `unknown` instead  @typescript-eslint/no-empty-object-type
  721:50  warning  The `{}` ("empty object") type allows any non-nullish value, including literals like `0` and `""`.
- If that's what you want, disable this lint rule with an inline comment or configure the 'allowObjectTypes' rule option.
- If you want a type meaning "any object", you probably want `object` instead.
- If you want a type meaning "any value", you probably want `unknown` instead  @typescript-eslint/no-empty-object-type
  752:50  warning  The `{}` ("empty object") type allows any non-nullish value, including literals like `0` and `""`.
- If that's what you want, disable this lint rule with an inline comment or configure the 'allowObjectTypes' rule option.
- If you want a type meaning "any object", you probably want `object` instead.
- If you want a type meaning "any value", you probably want `unknown` instead  @typescript-eslint/no-empty-object-type
  784:50  warning  The `{}` ("empty object") type allows any non-nullish value, including literals like `0` and `""`.
- If that's what you want, disable this lint rule with an inline comment or configure the 'allowObjectTypes' rule option.
- If you want a type meaning "any object", you probably want `object` instead.
- If you want a type meaning "any value", you probably want `unknown` instead  @typescript-eslint/no-empty-object-type

C:\Users\gregm\offline-site-robots-off\portal.measurement.gov.au\source-map-capture\portal.measurement.gov.au\tests\e2e\steps\storybook.steps.ts
  22:38  warning  `import()` type annotations are forbidden  @typescript-eslint/consistent-type-imports

C:\Users\gregm\offline-site-robots-off\portal.measurement.gov.au\source-map-capture\portal.measurement.gov.au\tests\unit\authentication\AccountProvider.errored.test.tsx
  1:8  warning  'React' is defined but never used. Allowed unused vars must match /^_/u  @typescript-eslint/no-unused-vars

✖ 131 problems (0 errors, 131 warnings)
```

## Cleanup Rule

Do not add or reintroduce warnings. `npm run lint` must remain clean.
