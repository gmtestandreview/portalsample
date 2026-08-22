# Align Theme To Live Portal

## Goal

Restore the local portal theme so it matches the current live site at `https://portal.measurement.gov.au/` exactly for the shared shell and base typography.

## Scope

- Update centralized SCSS theme tokens rather than patching individual components.
- Restore the global root font size to the live site's `16px`.
- Align the shared shell colors used by the header and footer to the live site.
- Verify the rendered local shell and representative route stories against live computed styles.

## Out of Scope

- Reworking route-specific layouts or component markup.
- Refactoring theme structure.
- Preserving the accessibility-driven 18px root scale.

## Current Drift

Observed from live-site comparison:

- Header background differs from live.
- Footer background differs from live.
- Root font size is `18px` locally and `16px` on live, which scales headings, body copy, and navigation text up across the app.

## Design

### Theme Changes

- Update the core header token in `ClientApp/src/styles/_variables.scss` to the live header color.
- Update the footer styling in `ClientApp/src/styles/_footer.scss` to the live footer background color.
- Restore the root font size in `ClientApp/src/styles/index.scss` from `112.5%` to `100%`.

### Why Token-First

The current visual drift is centralized in a small number of shared theme sources. Changing tokens and the root scale keeps the theme internally consistent and lets all dependent components inherit the live styling without a growing set of one-off overrides.

## Verification Plan

After the change:

- Run a rendered comparison against `https://portal.measurement.gov.au/`.
- Verify local computed styles for:
  - header background color
  - footer background color
  - root font size
  - shared `h1` sizing in the portal shell
- Run `npm run lint`.

## Risks

- Typography will shrink everywhere because the 18px root scale is being removed intentionally.
- Any stories or tests that assumed the larger typography scale may need follow-up if they encoded visual expectations too tightly.

## Acceptance Criteria

- Local root font size computes to `16px`.
- Local header background matches the live portal header.
- Local footer background matches the live portal footer.
- Shared shell typography and spacing move back in line with live-site computed styles.
