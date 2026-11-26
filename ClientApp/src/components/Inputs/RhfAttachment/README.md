# Test Case 2 — Attachment migration remediation

**Date:** 26 November 2026  
**Decision:** HOLD production acceptance. Source remediation implemented;
repository and backend evidence outstanding.

## Install and rollback

These are replacement candidate files, not changes to a live repository.
Preserve the uploaded files and commit or otherwise checkpoint the destination
before applying. Copy `index.tsx`, `RhfAttachmentItem.tsx` and
`attachmentContracts.ts` together into the existing RHF attachment component
directory. The `index(1).tsx` upload is named `index.tsx` here because it is the
candidate entry point. Do not replace the Formik authoritative files. Check the
actual directory and imports first. Roll back all three files together (restore
previous entry point and item, remove the added helper) if integration fails.
The verification directory is not a production dependency; keep it outside the
application compilation/lint scope or adapt its tests to the repository
conventions.

## Implemented changes and decisions

- Restored `isSubmitted`, `onDownloadFile`, responsive header and columns,
  semantic list, publication badge, NMI/portal author, modified date,
  locked-only prompt suppression, summary error suppression and original
  category value/display pairs.
- Submitted downloads call the original filename callback using an accessible
  button styled as a link. No hash navigation or raw logging. Missing handler or
  bytes renders unavailable text rather than a broken link. Local downloads only
  accept blob URLs; actual `getFileUrlFromBase64` helper must be verified to
  produce them. Effect owns object URL allocation and cleanup. Browser React
  lifecycle and hook lint remain unverified.
- RHF remains the form engine. The list is canonical for upload and deletion
  writes, including single-mode deletion to `[]`. Existing scalar objects are
  read at their real scalar category path without a destructive implicit
  conversion. Migrate upstream initial/default/reset/submission contracts
  deliberately; this is not a claim that an array payload is compatible with all
  legacy consumers. Unknown, malformed, repeated-reference or duplicate-ID rows
  fail closed without shifting indexes. Validation is a shape guard for fields
  used here, not a complete DTO schema validator. ID-less rows cannot be deleted
  remotely; ambiguous ID-less rows cannot be edited. The WeakMap fallback is
  instance-local, not an identity guarantee across DTO recreation.
- Replaced the item `RhfSelectInput` wrapper with a directly controlled native
  Bootstrap-styled select registered through `useController`. This lets one
  mutation coordinator own both local and remote writes; it is a deliberate
  integration change. Check shared design-system behaviour, label/help
  conventions, validation semantics, tests and any direct consumers of
  `RhfAttachmentItem` (its internal callback props changed). Existing
  unrecognised persisted categories are displayed but cannot be newly selected.
- Server-first category saves avoid optimistic rollback and preserve the
  previous form value on rejection. A synchronous instance-local gate excludes
  overlapping upload/delete/category operations; all three controls are disabled
  while a mutation or active upload progress exists. After awaiting a category
  save, resolve the current document ID and verify its previous category before
  updating the correct path. Unidentified local category changes require
  unambiguous identity. External reset/reorder with reused IDs and concurrent
  operations in other components or clients still require owner-side
  ordering/versioning and submission coordination. A busy local control does not
  lock the enclosing form's submit button.
- Delete calls `onDeleteFile(id, remainingUnlockedCount)` before removing the
  row. Remaining count excludes the deleted ID and locked records. Read the
  latest list after success rather than overwrite a captured stale list. If an
  external change prevents safe local reconciliation, show a refresh error.
  API/server atomicity, ownership and the real callback signature remain
  prerequisites. Missing or locked targets cannot trigger deletion.
- Upload preserves the original and candidate replacement-list callback
  semantics; does not append. Enforces selected batch limit and explicit single
  mode, checks exact existing case-sensitive extension list, skips
  empty/all-oversize batches, uploads valid files in mixed-size batches, resets
  input in `finally`, releases busy state and validates callback shape. Does not
  infer a cumulative quota: verify backend and callback return semantics,
  including existing locked documents. A shallow DTO snapshot detects changed
  scalar/list shape, row order, and property changes during upload; it is not a
  deep mutation detector or global transaction. On stale result, refuses local
  overwrite and asks for reconciliation because the remote operation may already
  have succeeded.
- Unknown rejection payloads are not rendered verbatim. Upload, delete and
  download use safe generic errors; category errors use the affected filename.
  This intentionally drops raw ProblemDetails validation text until the project
  defines a safe, approved mapping. Existing local validation messages retained.
  Actual service-side validation is still required.
- Field errors now have an actual `aria-describedby` target, category labels and
  error descriptions are associated, filename-specific delete label retained,
  original list IDs and responsive classes restored. Existing row IDs are
  index-based and may duplicate across multiple component instances; verify
  consumer selectors and consider a coordinated ID migration.

## Traceability against Test Case 2 remediation tasks

| Task                                 | Source status     | Remaining verification                                                      |
| ------------------------------------ | ----------------- | --------------------------------------------------------------------------- |
| M01 consumer/provider contract       | PARTIAL           | actual AttachmentProps, RHF provider, routes, component consumers           |
| M02 representation/index consistency | IMPLEMENTED       | default/reset values, actual nested RHF registration and submission payload |
| M03 submitted metadata/header        | IMPLEMENTED       | real rendering, DTO and date helper                                         |
| M04 taxonomy                         | IMPLEMENTED       | backend permitted taxonomy and existing persisted aliases                   |
| M05 category persistence             | IMPLEMENTED       | server-first semantics, real RHF form state, external request ordering      |
| M06 submitted download               | IMPLEMENTED       | actual callback, authorization, UX                                          |
| M07 object URL lifecycle             | IMPLEMENTED       | real helper/Strict Mode, hook lint, safe URL contract                       |
| M08 responsive/list layout           | IMPLEMENTED       | actual Bootstrap CSS, keyboard and assistive technology                     |
| M09 server-first deletion            | IMPLEMENTED       | service behaviour, external edits, delete modal contract                    |
| M10 upload validation                | IMPLEMENTED       | callback replacement semantics, quotas and server enforcement               |
| M11 typed refs/identity              | PARTIAL           | actual row key persistence across immutable RHF values, external consumers  |
| M12 error safety                     | IMPLEMENTED       | approved server validation message mapping                                  |
| M13 deletion count                   | IMPLEMENTED       | actual API callback accepts second argument                                 |
| M14 progress/cancellation            | RETAINED/HARDENED | actual enums, cancellation and progress component behaviour                 |
| M15 conditional guidance             | IMPLEMENTED       | real locked/mixed rendering                                                 |
| M16 security/permissions             | BLOCKED           | backend validation, authorization, download access and repo quality gates   |

Implementation status does not equate to verified closure. No full acceptance
score assigned; previous parity assessment cannot be reused against modified
source.

## Executed verification

Run from this package with Node and TypeScript CLI available:

```sh
node verification/verify.cjs
```

Environment used: Node v22.16.0, TypeScript 5.8.3. The script creates an
isolated temporary project with synthetic declarations for the missing real
imports and a deterministic mock hook scheduler. It compiles the actual
candidate source using `strict`, `exactOptionalPropertyTypes`,
`noUncheckedIndexedAccess`, `noUnusedLocals`, then exercises helper functions,
rendered element descriptions and handlers with stubbed callbacks and simulated
effects. It removes the temp project. `verification/results.txt` records 38
passed, zero failed, and strict isolated compilation PASS. These are **not**
actual React, RHF, browser, API, lint or repository tests. Stub signatures were
inferred from the supplied files; in particular the two-argument delete
signature is an intended contract, not evidence that the actual shared type
accepts it. Source and evidence SHA-256 hashes and unified differences are
provided.

## Required acceptance checks in target repository

1. Confirm actual `AttachmentProps`, DTO, `onDeleteFile(id, count)`, category,
   upload, progress and download signatures. Confirm actual React Hook Form
   provider, default/reset and resolver contracts; migrate scalar consumers and
   payload transformations as needed. Search direct item imports; adapt any
   consumers of the old item props.
2. Run actual project type-check, format/lint, Vitest, Storybook and coverage
   gates using repository-defined commands. Do not use mock evidence to waive
   any real failure. Add the actual React Testing Library cases based on the
   isolated tests, with real provider, controlled select, nested row
   deletion/reorder, external reset, submit while busy and React Strict Mode.
3. Exercise real browser file selection/reselection, invalid/oversize/empty
   batches, async progress cancellation, keyboard/modal focus, accessibility and
   responsive layout, failed and successful downloads, actual helper blob
   ownership and date rendering.
4. Verify backend constraints, authorization, size/content scanning, taxonomy,
   deletion count semantics, external concurrent updates, safe ProblemDetails
   mapping, replacement-list contract and access-controlled submitted downloads.
   Decide how to prevent enclosing form submission during a pending mutation;
   UI-only restrictions do not establish security or cross-client consistency.
5. Re-run the v2.2 comparison against all three candidate members, record
   current-revision evidence, reconcile all 14 acceptance gates, and obtain
   required owner approvals for deliberate divergences. HOLD until mandatory
   gates pass.
