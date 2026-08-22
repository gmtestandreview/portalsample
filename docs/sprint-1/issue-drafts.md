# Sprint 1 Issue Drafts

Use these drafts if direct GitHub issue filing is unavailable.

## SB-001 StatusPill case matching failure

Component: StatusPill
Severity: blocker

Steps to reproduce:

1. Render StatusPill with QuoteStatus values that should map to known labels.
2. Compare output to expected labels used for dashboard-equivalent statuses.

Expected: QuoteStatus values map correctly to matching display labels.
Actual: Several QuoteStatus values do not match any case due to logical OR case-label usage.

## SB-002 Dashboard fixture hides tab behavior

Component: Dashboard stories
Severity: blocker

Steps to reproduce:

1. Open Dashboard Populated story.
2. Inspect Drafts and Instruments tabs.

Expected: Non-empty tab content appears when fixture includes matching statuses.
Actual: Draft and Instrument filters use non-enum string literals and produce empty arrays.

## SB-003 InTextLink target handling

Component: InTextLink
Severity: blocker

Steps to reproduce:

1. Render InTextLink without target prop.
2. Inspect rendered anchor target attribute.

Expected: Target behavior follows prop contract and does not force new-tab behavior.
Actual: Anchor target is always _blank.

## SB-004 MSW global handler registration

Component: Storybook preview and msw handlers
Severity: blocker

Steps to reproduce:

1. Load a story relying on global dashboard handlers without local override.
2. Trigger relevant request.

Expected: Global fallback handler intercepts dashboard request.
Actual: Handler registration shape risks failing to register global fallback.

## SB-005 Dual MSAL mock inconsistency

Component: Storybook preview and harness providers
Severity: blocker

Steps to reproduce:

1. Render a story that reads account identity through both useMsal and account-state hooks.
2. Compare displayed identity values.

Expected: Identity values are consistent across provider paths.
Actual: Preview and harness use different mock account identities.
