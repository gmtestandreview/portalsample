# Synthetic route payload requirements (not application telemetry policy)

Each complete layout directory is a separate implementation of the same bounded
public contract. All `.ts` files in the selected layout belong to that side. The
only supported public entry point is `./index`; `tracker.ts` and `route.ts` are
internal even though their symbols must be exported for intra-side imports.
Assume no historical C unless explicitly provided. `historical-partial/` is an
intentional incomplete historical entry point, not a complete layout. No
external packages.

- R0: `./index` exposes the named function
  `buildPageView(enabled: boolean, pathname: string, search: string, hash: string): string | null`.
- R1: When disabled, return `null` regardless of URL components.
- R2: When enabled and search/hash are empty, return the pathname unchanged.
- R3: When enabled, append the supplied search string without alteration.
- R4: When enabled, append the supplied hash string after pathname and search.

Inputs are already-approved synthetic URL components; no personal data, actual
analytics transport, React lifecycle, or URL privacy policy is exercised here.
The fixture does not establish production telemetry safety. Test empty search,
empty hash, both present and disabled with both present. No requirement for
internal filenames or number of functions. For this fixture all rules are
independently assessable; exact scoring allocations remain governed by §11.
