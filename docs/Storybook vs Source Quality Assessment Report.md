Storybook vs Source: Quality Assessment Report
Scope: 46 .stories.tsx files across ClientApp/src/components/ and ClientApp/src/routes/
Method: File-by-file read of every story and its corresponding source module(s)
Date: 2026-05-20

1. Storybook Infrastructure Assessment
.storybook/preview.ts — What Is Wired
Concern Status Notes
React Router ✅ Provided Global decorator wraps every story with createMemoryRouter + RouterProvider; reads parameters.portal.initialEntries
MSW ✅ Provided msw-storybook-addon initialized; global handlers in msw-handlers.ts
Environment vars ✅ Stubbed All 11 window.* vars assigned in preview.ts
App Insights mock ✅ Stubbed mockAppInsights exported; ai.reactPlugin.getAppInsights().trackException safe to call
MockDate ✅ Frozen All stories run at 2024-04-01T12:00:00Z
Session storage ✅ Seeded targetOrganisation pre-set in beforeEach
a11y addon ⚠️ Partial Enabled but only color-contrast rule; no play-function a11y assertions anywhere
Critical Infrastructure Bug — MSW Global Handlers
msw-handlers.ts exports:

export const mswHandlers = { dashboard: [ http.get('/api/dashboard/*', ...) ] };
preview.ts consumes it as:

msw: { handlers: mswHandlers }
mswHandlers is { dashboard: [...] } — an object-of-arrays, not an array. The msw-storybook-addon expects either a flat array or a { handlers: Handler[] } shape. This means the global /api/dashboard/* fallback handler may never be registered. Stories that set their own msw.handlers work correctly, but stories without explicit MSW overrides (e.g., Dashboard.EmptyState relies on its own handlers, so it is fine — but any future story that omits MSW config for dashboard endpoints will hit unhandled requests).

Dual MSAL Account Inconsistency
preview.ts defines mockMsalAccount.name = 'Test User' / username = '<test@example.com>'.
storybookHarness.tsx defines mockMsalAccount.name = 'Taylor Nguyen' / username = '<taylor.nguyen@example.com>'.

The withPortalProviders decorator creates its own MsalContext.Provider, overriding the preview-level mock. Components that bypass AccountContext and call useMsal() directly will see 'Test User'; components going through useAccountState() see 'Taylor Nguyen'. This is an inconsistency that will be invisible until a component accesses both paths.

1. Component-by-Component Gaps
Accordion
Stories: SingleSection, WithSubHeading | Tag: ai-generated, needs-work

Prop/Case Source Has It Story Covers It
containerClassName on CustomAccordion ✅ ❌
namePartThree / namePartThreeClassName ✅ ❌
className on CustomAccordionBody ✅ ❌
Multiple CustomAccordionBody children ✅ (design intent) ❌
Actions
Stories: TextButton, IconButton

Prop/Case Source Has It Story Covers It
containerClassName, className ✅ ❌
align='end' ✅ ❌
buttonTitle override (default: 'Actions') ✅ ❌
onItemClick callback ✅ ❌
variant override ✅ ❌
Route-based item navigation asserted ✅ ❌
Alert
Stories: Info, Success, Warning, ErrorDismissible

CRITICAL GAP — NotificationMessage.tsx has no story.
This component wraps all four alert types with a structured icon-in-circle layout (bgCircle, icon-tick, icon-info, icon-warning) and a NotificationSeverity enum switch. It is used by Dashboard, WizardForm, and likely every page-level notification. It is entirely untested.

Additional gaps:

Prop/Case Source Has It Story Covers It
id, testId props ✅ ❌
className override ✅ ❌
onClose callback fired ✅ ❌ (button rendered but not clicked)
Alert re-show on children change ✅ (useEffect([children])) ❌
ariaLive/role overrides per variant ✅ (assertive on Error) ❌
BlockUISpinner
Stories: FullPage, Inline

Prop/Case Source Has It Story Covers It
aria-live='polite' on partial vs 'assertive' on full ✅ ❌ (not asserted)
Play function to verify spinner renders N/A ❌
BodyText
Stories: Default, Emphasis | Tag: ai-generated, needs-work

Component has exactly 2 props (children, className). Stories cover both. Adequate.

Breadcrumb
Stories: ThreeLevels, TwoLevels | Tag: ai-generated, needs-work

Prop/Case Source Has It Story Covers It
containerClassName ✅ ❌
Single-item breadcrumb plausible ❌
Buttons / PrimaryButton
Stories: Default, DarkMode, Disabled, CssCheck | Tag: ai-generated, needs-work

Prop/Case Source Has It Story Covers It
onClick handler ✅ (via ButtonProps) ❌
type='submit' ✅ ❌
className passthrough ✅ ❌
Buttons / SecondaryButton
Stories: Default, Disabled | Tag: ai-generated, needs-work

Note: SecondaryButton type explicitly omits className, bsPrefix, variant from ButtonProps. The story doesn't document this intentional constraint.

Buttons / ButtonBreadth (ButtonGroup + LinkButton + EditButton)
Stories: GroupedActions, EditSection

MISSING: BackToDashboardButton has zero story coverage. It is a distinct component at Buttons/BackToDashboardButton/index.tsx with its own containerClassName and className props.

Prop/Case Source Has It Story Covers It
BackToDashboardButton component ✅ ❌
LinkButton as='Link' navigation verified ✅ ❌ (no play function)
ButtonGroup with both sides active ✅ ❌ (right side is <></> in story)
ErrorBoundary
Stories: NoError, CaughtError, RecoveredAfterReset, NestedBoundaries

The four stories cover the full boundary lifecycle including reset and nesting. Good coverage. Minor gap: trackException call not verified by assertion.

Footer
Stories: Default only

MISSING: All three modal dialogs are never opened or rendered:

TermsOfUse content component — no story
Privacy content component — no story
Accessibility content component — no story
ContentModal itself — no story
No story tests any of the three onClick handlers (Terms, Privacy, Accessibility links).

Header
Stories: Authenticated, Public

Sub-component Has Story
AuthenticatedNavbarItems.tsx ❌
UnauthenticatedNavbarItems.tsx ❌
NavbarBrand.tsx ❌
NavbarEnvironment.tsx ❌
NavbarMessage.tsx ❌
Mobile collapse behavior not testable in jsdom.

HeaderIntroText
Stories: Default, WithClass | Tag: ai-generated, needs-work

Component has 2 props. Stories cover both. Adequate.

Icons
Stories: ExternalLink

Only ExternalLinkIcon.tsx exists in the directory. Complete.

InTextLink
Stories: External, InlineText

SOURCE CODE BUG — Exposed by story but not asserted:

InTextLink/index.tsx:23: target is destructured from props (removed from spread) but the rendered <a> always has target='_blank' hardcoded. The InlineText story passes no target prop, yet the link will render target='_blank' (new tab). The story has no play assertion to catch this. A rebuild from the story would produce a link that always opens in a new tab, regardless of intent.

Prop/Case Source Has It Story Covers It
className ✅ ❌
target hardcoding bug ✅ (bug) ❌ (not asserted)
Inputs
Stories: CommonFieldSet (Inputs.stories.tsx) + full suite in Forms.stories.tsx

Input Component Stories Cover It
TextInput ✅ (5 variants in Forms.stories)
SelectInput ✅ (2 variants)
RadioButtonGroup ✅ (2 variants)
DatePicker ✅ (1 variant)
TextAreaInput ✅ (1 variant)
Checkbox ✅ (with play function)
NumberInput ✅ (in CommonFieldSet)
RadioButton (individual) ❌
TextReadOnly ❌
AutoSuggest + sub-components (5 files) ❌
AddressLookup + ManualAddressInput (4 files) ❌
OrganisationNameLookup ❌
TextInput isSummary mode renders as SummaryDisplay — not tested in any story.
TextInput Details expandable help — TextInputWithExpandableHelp story covers this correctly.

Layout
Stories: PortalShell

Full shell renders with GoogleAnalytics — empty tracking ID means no network calls. Adequate. Route-change utilities (RouteChangeScrollTop, RouteAccessibleNavigation) can't be tested without navigation.

Pagination
Stories: MidRange, SinglePageHidden

Case Covered
First page (prev/first hidden) ❌
Last page (next/last hidden) ❌
visiblePageRange variation ❌
containerClassName, className ❌
Page change interaction (play fn) ❌
"Page X of Y" text assertion ❌
PaginationHeader
Stories: MidPage, LastPage

Case Covered
totalCount=0 (hidden) ❌
First page (currentPage=1) ❌
Pill (StatusPill + QuoteStatusPill)
Stories: DashboardStatuses, QuoteStatuses

CRITICAL SOURCE CODE BUG — Not caught by any story:

StatusPill (StatusPill.tsx:24-51) uses the || operator in switch-case statements:

case DashboardItemStatus.QuoteAccepted || QuoteStatus.QuoteAccepted:
In JavaScript, 'Quote offer is accepted' || 'Quote - Accepted' evaluates to 'Quote offer is accepted' (the first truthy value). The case only ever matches DashboardItemStatus.QuoteAccepted — QuoteStatus.QuoteAccepted is silently ignored.

All 9 affected case statements:

QuoteAccepted — QuoteStatus.QuoteAccepted never matched
ReportIssued — QuoteStatus.ReportIssued + ReportStatus.Issued never matched
ReportInProgress — QuoteStatus.ReportInProgress never matched
ArtifactReceived — QuoteStatus.ArtifactReceived never matched
QuoteAvailable — QuoteStatus.QuoteAvailable never matched
QuoteDeclined — QuoteStatus.QuoteDeclined never matched
QuoteExpired — QuoteStatus.QuoteExpired never matched
QuoteSubmitted — QuoteStatus.QuoteSubmitted never matched
ReportWithdrawn — QuoteStatus.ReportWithdrawn + 'Withdrawn' never matched
The DashboardStatuses story passes only DashboardItemStatus values (which do match), and QuoteStatuses uses QuoteStatusPill (a separate component with correct implementation). The bug is completely invisible in the stories.

QuoteStatusPill is correctly implemented — no bug.

RequestList / RequestItem
Stories: DraftRequest, QuoteAvailable, ReportIssued, AllRequestStates

MISSING — Zero coverage:

InstrumentItem (instrumentItem.tsx) — entirely separate card type with different tabs (Details/Reports), different heading logic, different actions menu
NoRequests (noRequests.tsx) — empty-state UI
Gaps in RequestItem stories:

Case Covered
hideFromDashboard: true (card silently hidden) ❌
sourceReferenceId info tooltip ❌
clonedReferenceIds / isClone multi-link tooltip ❌
ReportWithdrawn, QuoteExpired, QuoteDeclined, QuoteAccepted, ArtifactReceived statuses ❌
Actions menu interaction (play fn) ❌
Story uses hand-rolled AccountStateCtx.Provider instead of withPortalProviders — creates duplicate mock pattern.

SearchFilter
Stories: DashboardFilters

Case Covered
Year filter options ❌
Status filter options ❌
Sort order filter ❌
containerClassName, className ❌
setUserProfile side effect asserted ❌
SteppedNavigation
Stories: CurrentStep

Case Covered
interactive={false} mode (renders <div> not <a>) ❌
All steps completed ❌
Step 0 active (first step) ❌
Last step active ❌
No completed steps (fresh wizard) ❌
SummaryDisplay
Stories: TextValue (as='p'), PhoneValue (as='span'), FormattedNumber (as='number')

Case Covered
as='custom' with bodyText prop ❌
Empty value (shows "-" with visually-hidden text) ❌
descriptor prop ❌
prepend, append, prefix, suffix ❌
Phone label WCAG split rendering (ARIA aria-hidden + visually-hidden) ❌ (PhoneValue story label is 'Business phone' — correct, but no assertion)
thousandSeparator, allowNegative ❌
Utilities
Stories: ContactActions, SkipAndTopNavigation, PdfActionLoaded, PdfActionLoading

14 components/hooks with zero story coverage:

File Status
ViewMeasurementReport.tsx ❌
ViewPdfQuote.tsx ❌
ViewPdfQuoteTerms.tsx ❌
hashLink.tsx ❌
mailingLabel.tsx ❌
deliveryInstructions.tsx ❌
contactDetails.tsx ❌
routeAccessibleNavigation.tsx ❌
routeChangeScrollTop.tsx ❌
useBodyClass.tsx ❌
useDebounce.ts ❌
useHtmlTitle.tsx ❌
findElementInTreeById.ts ❌
Welcome
Stories: Default

Case Covered
No givenName (details undefined / loading) ❌
isLoading: true state ❌
Forms / WizardForm
Stories: Step1ContactDetails, Step2WithPreviousCompleted, ThreeStepSummaryPage

Uses its own MockAccountProvider rather than withPortalProviders — creates a duplicate context pattern inconsistent with the rest of the codebase.

WizardFormProps vs story args discrepancy: WizardFormProps type does not include bannerTitle — it belongs to WizardStepProps. The story correctly passes bannerTitle on each WizardStep, not on WizardForm. Consistent.

Case Covered
onSaveAndExit callback fired ❌
onSaveAndNext callback fired ❌
Form validation + ErrorSummary display ❌
UnsavedFormPrompt guard ❌
Step backward navigation ❌
bannerTitle rendered text assertion ❌
Form sub-components with zero story coverage (8 files):

Component Complexity Notes
ErrorSummary/index.tsx HIGH Server errors, WAF violation, Conflict/Unprocessable variants, key-to-label mapping
FormBanner/index.tsx HIGH Save-and-exit, discard, go-to-dashboard button variants
HidableField/index.tsx MEDIUM Conditional field visibility
SaveAndExitButton/index.tsx MEDIUM Triggers confirmation modal
SubmitFormButton/index.tsx MEDIUM Form submission
Details/index.tsx MEDIUM Expandable help (used by TextInput with inlineHelpTitle)
FormikForm/index.tsx LOW Wrapper
CommonForms/ContactDetails/index.tsx MEDIUM Shared contact form section
Modals
Stories: ConfirmationOpen, ConfirmationClosed, BranchSelectorSelectAndEdit, BranchSelectorRFQMode, RFQDeleteConfirmation

MISSING modals:

ContentModal/index.tsx — used by Footer (3 times) — no story
TermsAndCondition/index.tsx — no story
Pattern inconsistency: BranchSelector/RFQDelete stories create their own MSAL + Account + Modal context stack rather than using withPortalProviders. No functional interaction testing (play functions missing for API calls).

GetStarted
Stories: PublicLanding, WithInformationBanner

Covers the two display states. Adequate.

StandardPathway
Stories: InternalNavigation, ExternalNavigation

MISSING sub-components:

DigitalIdentityFooter.tsx — no story
StandardFooter.tsx — no story
3. Route-by-Route Assessment
AcceptQuote
Stories: ReportRecipientStep, PaymentDetailsStep, PaymentDetailsPostpaid

Three of five wizard steps have no story:

Step File Story Exists
reportRecipient.tsx ✅
paymentDetails.tsx ✅
deliveryAndReturn.tsx ❌
quotationSummary.tsx ❌
summaryAndAccept.tsx ❌ (final acceptance step — highest business criticality)
index.tsx (WizardForm container) ❌
AcceptQuote / SubmittedSuccess
Stories: Prepaid, Postpaid

Both payment term scenarios covered. Adequate.

Account / AccountCreated
Stories: Default — single confirmation page. Adequate.

Account / AccountRoute (CreateAccountStep)
Stories: OrganisationDetails, OrganisationDetailsValidation

File Story Exists
accountDetails.tsx (step) ✅
addBranch/index.tsx ❌
create/index.tsx (WizardForm) ❌
update/index.tsx (WizardForm) ❌
organisationDetails.tsx ❌
Common / ErrorRoutes
Stories: All 8 HTTP status code variants covered.

ErrorDisplay maps: Conflict, Gone, NotFound, PreconditionFailed, ServiceUnavailable, UnprocessableEntity, Forbidden, InternalServerError. All 8 covered. Complete.

Contact / ContactRoute
Stories: Default, ValidationState

File Story Exists
contactDetails.tsx (step) ✅
create/index.tsx (WizardForm) ❌
update/index.tsx (WizardForm) ❌
Dashboard
Stories: Populated, EmptyState, RequestsTabWithNotification

CRITICAL DATA BUG in fixture filtering:

// Dashboard.stories.tsx
const draftItems    = dashboardItems.filter(i => i.status === 'Quote drafted');
const instrumentItems = dashboardItems.filter(i => i.status === 'Report issued');
From enums.ts:21:

DashboardItemStatus.QuoteDrafted = 'Quote request drafted' ≠ 'Quote drafted'
DashboardItemStatus.ReportIssued = 'Report is available' ≠ 'Report issued'
Both filter arrays are always empty. The Populated story will show:

Drafts tab: NoRequests (empty list)
Instruments tab: NoRequests (empty list)
Requests tab: all 3 items shown (this filter uses !== 'Report issued' which is always true, so all items appear)
The DashboardTab.Instruments tab (which renders InstrumentItem cards) can never be seen in any current story. InstrumentItem is effectively untestable through the Dashboard story.

Additional gaps:

Case Covered
InstrumentItem cards visible ❌ (broken filter)
NoRequests state intentional ❌ (shown accidentally)
Notification dismiss interaction ❌
Branch selector modal from Dashboard ❌
Forbidden / noThirdPartyAccess error states ❌
Tab navigation interaction (play fn) ❌
HelpGuide + HelpGuideDetail
Stories: Both auth states + both detail pages covered. Adequate.

MeasurementReport
Stories: ReportView, FileError

File Story Exists
reportDetails.tsx ✅
nMIContactDetails.tsx ✅ (rendered inline)
index.tsx (API container) ❌
indexList.tsx ❌
reportList.tsx ❌
Quotation
Stories: QuoteSummary, ExpiredNoDelivery

File Story Exists
quoteDetails.tsx ✅
nMIContactDetails.tsx ✅ (inline)
index.tsx (API container) ❌
Missing status scenarios:

Status Covered
QuoteAvailable ✅
Quote - Expired (receiptandDispatchNA) ✅
QuoteDeclined ❌
QuoteAccepted ❌
ReportIssued ❌
RequestForQuote
Stories: OrganisationAndContactStep, InstrumentAndRequestStep, validation variants of both

File Story Exists
organisationAndContact.tsx ✅
instrumentAndRequest.tsx ✅
requestForQuoteSummary.tsx ❌
viewRequestForQuoteSummary.tsx ❌
copy/index.tsx (recalibration flow) ❌
index.tsx (WizardForm container) ❌
RequestForQuoteCreated, ServicesWeOffer, Auth
All adequately covered for their respective page types.

Completely Uncovered Routes
routes/preConditions/PreConditions.tsx — no story
routes/sign-out/index.tsx — tested only via AuthRoutes.stories.tsx render, not directly
routes/sign-out-helper/index.tsx — same
4. Master List: Completely Uncovered Source Files
Components (36 files/modules with zero story)
Buttons:

Buttons/BackToDashboardButton/index.tsx
RequestList:

RequestList/instrumentItem.tsx
RequestList/noRequests.tsx
RouteLeavingGuard:

RouteLeavingGuard/index.tsx
Alert:

Alert/NotificationMessage.tsx
Footer:

Footer/termsOfUse.tsx
Footer/privacy.tsx
Footer/accessibility.tsx
Modals:

modals/ContentModal/index.tsx
modals/TermsAndCondition/index.tsx
StandardPathway:

tiles/StandardPathway/DigitalIdentityFooter.tsx
tiles/StandardPathway/StandardFooter.tsx
Utilities (13):

ViewMeasurementReport.tsx, ViewPdfQuote.tsx, ViewPdfQuoteTerms.tsx
hashLink.tsx, mailingLabel.tsx, deliveryInstructions.tsx, contactDetails.tsx
routeAccessibleNavigation.tsx, routeChangeScrollTop.tsx
useBodyClass.tsx, useDebounce.ts, useHtmlTitle.tsx, findElementInTreeById.ts
Inputs (9):

RadioButton/index.tsx, TextReadOnly/index.tsx, OrganisationNameLookup/index.tsx
AutoSuggest/index.tsx, AutoSuggestContainer.tsx, AutoSuggestOption.tsx, AutoSuggestOptions.tsx
AddressLookup/index.tsx, AddressLookup/ManualAddressInput.tsx
Forms (8):

ErrorSummary/index.tsx, FormBanner/index.tsx, HidableField/index.tsx
SaveAndExitButton/index.tsx, SubmitFormButton/index.tsx
Details/index.tsx, FormikForm/index.tsx
CommonForms/ContactDetails/index.tsx, UnsavedFormPrompt/index.tsx
Other:

Home.tsx
Routes (18 files with zero story)
acceptQuote/deliveryAndReturn.tsx
acceptQuote/quotationSummary.tsx
acceptQuote/summaryAndAccept.tsx ← highest business criticality
acceptQuote/index.tsx
account/addBranch/index.tsx
account/create/index.tsx
account/update/index.tsx
account/organisationDetails.tsx
contact/create/index.tsx
contact/update/index.tsx
measurementReport/index.tsx
measurementReport/indexList.tsx
measurementReport/reportList.tsx
quotation/index.tsx
requestForQuote/requestForQuoteSummary.tsx
requestForQuote/viewRequestForQuoteSummary.tsx
requestForQuote/copy/index.tsx
preConditions/PreConditions.tsx
5. Source Code Bugs Stories Don't Catch
Severity Location Bug Story Gap
HIGH StatusPill.tsx:24-51 `
MEDIUM InTextLink/index.tsx:23 target always hardcoded to '_blank' — InlineText use case (same-tab) is broken InlineText story has no play assertion checking target attribute
MEDIUM Dashboard.stories.tsx:13-14 Filter string literals 'Quote drafted' and 'Report issued' don't match enum values ('Quote request drafted', 'Report is available') — Drafts and Instruments tabs always show empty lists No test asserts non-empty Drafts or Instruments tabs
6. Coverage Summary
Category Total Source Files Story-Covered Gap %
Component .tsx files ~100 ~57 ~43% uncovered
Route step/view files ~40 ~18 ~55% uncovered
Story files with play functions 46 ~8 ~83% no interaction tests
Components tagged ai-generated, needs-work 8 — Tagged for further work
7. Rebuild Fidelity Risk Assessment
When rebuilding from storybooks, the following areas carry the highest risk of functional divergence:

Risk Area Reason
🔴 Critical AcceptQuote wizard steps 3–5 3 of 5 steps (including final acceptance) have no story
🔴 Critical StatusPill with QuoteStatus values Bug hidden; rebuilt code may correctly implement the switch and behave differently
🔴 Critical Dashboard Drafts/Instruments tabs Story data bug means neither tab is ever visually verified
🔴 Critical ErrorSummary Complex server-error/WAF/Conflict handling — zero story coverage
🔴 Critical NotificationMessage Used app-wide; no story — icon layout is invisible in rebuild
🟠 High InTextLink target behavior Story implies same-tab; source is always new-tab
🟠 High FormBanner Full-page form header with 3 button variants — no story
🟠 High AutoSuggest / AddressLookup Complex async inputs — no stories
🟠 High InstrumentItem Separate card type for reports history — entirely hidden
🟡 Medium WizardForm multi-step navigation No play functions; step progression unverified
🟡 Medium Modal interactions Open/close/API call behavior not tested via play functions
🟡 Medium Footer modal content 3 legal/policy pages never rendered
