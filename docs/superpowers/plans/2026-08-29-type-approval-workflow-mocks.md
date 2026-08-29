# Type-Approval Workflow Mocks Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Provide deterministic Playwright mock contracts for the complete pattern/type-approval workflow, from dashboard and application creation through submission and post-submission management.

**Architecture:** Add a focused pure request dispatcher that accepts method, URL, request body, and shared scenario state, then returns an HTTP-shaped response or declines an unrelated request. Unit tests call this real dispatcher directly; `installMockApi` adapts Playwright requests to it and falls back to the existing RFQ/account handlers when the dispatcher returns `undefined`.

**Tech Stack:** TypeScript, Vitest, Playwright route interception, generated NSwag DTO types.

**Spec:** User request dated 2026-08-29 and the excluded type-approval paths in `tests/e2e/route-coverage.ts`.

## Global Constraints

- Do not edit `ClientApp/src/api/web-api-client.ts`; it is generated.
- Preserve unrelated working-tree changes.
- Follow strict red-green-refactor: each behavior test must fail for the missing contract before implementation.
- Do not modify BDD feature files in this pass.
- Mock complete response structures used by the captured React routes; do not call a live backend.

---

### Task 1: Deterministic application state and dashboard lifecycle

**Files:**
- Create: `tests/e2e/support/type-approval-mock.ts`
- Modify: `tests/e2e/support/scenario-state.ts`
- Test: `tests/unit/e2e/typeApprovalMock.test.ts`

**Interfaces:**
- Produces: `TypeApprovalApplicationState`, `TypeApprovalMockRequest`, `TypeApprovalMockResponse`, and `handleTypeApprovalRequest(request, state)`.
- Produces: `ScenarioState.typeApprovalApplications`, `ScenarioState.nextTypeApprovalApplicationNumber`, and `ScenarioState.activeTypeApprovalReferenceId`.

- [ ] **Step 1: Write failing application-creation and dashboard tests**

  Call `handleTypeApprovalRequest` with `POST /api/application` and `{ applicationType: 'PatternApproval' }`. Assert the literal reference `PA-2026-000002`, a stored draft application, and a draft dashboard item. Assert the seeded submitted application is returned by the submitted dashboard endpoint.

- [ ] **Step 2: Run the focused test and verify RED**

  Run: `npm run test:unit -- tests/unit/e2e/typeApprovalMock.test.ts`

  Expected: failure because `type-approval-mock.ts` and the type-approval scenario fields do not exist.

- [ ] **Step 3: Implement minimal state and lifecycle dispatcher**

  Seed `PA-2026-000001` as a submitted management fixture. Handle only pattern-approval `POST /api/application`, draft dashboard GET, and submitted dashboard GET. Return `undefined` for non-pattern-approval application creation so existing handlers retain ownership.

- [ ] **Step 4: Run the focused test and verify GREEN**

  Run: `npm run test:unit -- tests/unit/e2e/typeApprovalMock.test.ts`

  Expected: all Task 1 tests pass.

### Task 2: Wizard steps and instrument lookup contracts

**Files:**
- Modify: `tests/e2e/support/type-approval-mock.ts`
- Test: `tests/unit/e2e/typeApprovalMock.test.ts`

**Interfaces:**
- Consumes: `handleTypeApprovalRequest(request, state)` and stored applications from Task 1.
- Produces: GET/PUT contracts for step statuses, organisation/contact, application/instrument, and supporting documents; lookup responses for PA category, PA instrument type, certificate application, and instrument information.

- [ ] **Step 1: Write failing wizard contract tests**

  Assert four literal `NotStarted` statuses for a fresh application. PUT complete organisation/contact and application/instrument payloads, then GET them back and assert the submitted fields plus `Completed` statuses. Assert PA lookup URLs return complete literal lookup and information-panel structures.

- [ ] **Step 2: Run the focused test and verify RED**

  Run: `npm run test:unit -- tests/unit/e2e/typeApprovalMock.test.ts`

  Expected: existing dispatcher returns `undefined` for wizard and lookup endpoints.

- [ ] **Step 3: Implement minimal wizard and lookup handling**

  Parse the reference from `/api/request-for-pattern-approval/:id/...`, persist `command.formStep`, use `command.isCompletingStep` to set `Completed` or `Saved`, and return full DTO-shaped fixtures for all reads.

- [ ] **Step 4: Run the focused test and verify GREEN**

  Run: `npm run test:unit -- tests/unit/e2e/typeApprovalMock.test.ts`

  Expected: all Task 1-2 tests pass.

### Task 3: Supporting-document upload and submission lifecycle

**Files:**
- Modify: `tests/e2e/support/type-approval-mock.ts`
- Test: `tests/unit/e2e/typeApprovalMock.test.ts`

**Interfaces:**
- Consumes: stored supporting-document state from Task 2.
- Produces: progress upload IDs/status, add/delete/recategorise document handling, summary response, and submit transition.

- [ ] **Step 1: Write failing upload and submission tests**

  Assert `GET /api/progress` returns `pa-upload-1`; adding a named PDF returns and stores a complete attachment; category updates and deletion mutate the stored document list. Assert the summary composes all stored steps. Assert submission completes all statuses and moves the application from draft dashboard results to submitted dashboard results.

- [ ] **Step 2: Run the focused test and verify RED**

  Run: `npm run test:unit -- tests/unit/e2e/typeApprovalMock.test.ts`

  Expected: upload, document, summary, and submit endpoints are unhandled.

- [ ] **Step 3: Implement minimal upload and submission behavior**

  Generate deterministic upload/document IDs, return a 100-percent progress record, persist attachment changes, compose the summary from application state, and mark the application submitted on PUT submit.

- [ ] **Step 4: Run the focused test and verify GREEN**

  Run: `npm run test:unit -- tests/unit/e2e/typeApprovalMock.test.ts`

  Expected: all Task 1-3 tests pass.

### Task 4: Management details, documents, and messages

**Files:**
- Modify: `tests/e2e/support/type-approval-mock.ts`
- Test: `tests/unit/e2e/typeApprovalMock.test.ts`

**Interfaces:**
- Consumes: submitted application state and attachment state from Tasks 1-3.
- Produces: app details, message count/list/addition, app documents, and committed app-document responses.

- [ ] **Step 1: Write failing management tests**

  Assert the seeded submitted application returns complete application details and documents. Assert message count matches the paged message response, adding a portal message increments both, and committing app documents persists the submitted form.

- [ ] **Step 2: Run the focused test and verify RED**

  Run: `npm run test:unit -- tests/unit/e2e/typeApprovalMock.test.ts`

  Expected: management endpoints are unhandled.

- [ ] **Step 3: Implement minimal management behavior**

  Compose details from stored step state, paginate deterministic messages, append the supplied message body, and share the same document state between wizard and management endpoints.

- [ ] **Step 4: Run the focused test and verify GREEN**

  Run: `npm run test:unit -- tests/unit/e2e/typeApprovalMock.test.ts`

  Expected: all focused tests pass.

### Task 5: Playwright adapter and regression verification

**Files:**
- Modify: `tests/e2e/support/mock-api.ts`
- Test: `tests/unit/e2e/typeApprovalMock.test.ts`

**Interfaces:**
- Consumes: `handleTypeApprovalRequest(request, state)`.
- Produces: a final `**/api/**` Playwright route that fulfils recognised type-approval responses and calls `route.fallback()` for all unrelated requests.

- [ ] **Step 1: Write a failing adapter-input test**

  Add a dispatcher test using the same JSON and multipart string shapes produced by the adapter. Assert a JSON application command and multipart application/document fields are interpreted correctly; the production change that breaks it is passing raw Playwright data without normalisation.

- [ ] **Step 2: Run the focused test and verify RED**

  Run: `npm run test:unit -- tests/unit/e2e/typeApprovalMock.test.ts`

  Expected: raw multipart metadata does not yet produce the requested attachment/message behavior.

- [ ] **Step 3: Wire the dispatcher into `installMockApi`**

  Safely parse JSON bodies by content type, pass multipart request text through unchanged, fulfil the dispatcher's status/body, and fall back for unrelated API requests. Add active Pattern Approval service and nested dashboard preferences to the sign-in fixture so `/dashboard-ta` can execute.

- [ ] **Step 4: Run focused and repository verification**

  Run:

  ```powershell
  npm run test:unit -- tests/unit/e2e/typeApprovalMock.test.ts
  npm run type-check
  npm run lint
  npx bddgen -c playwright.config.ts
  ```

  Expected: all commands pass with no new errors or warnings attributable to these changes.

