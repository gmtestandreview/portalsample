# BOUNDARY: playwright-e2e-builder

## Partial overlaps

### playwright-e2e-builder ↔ playwright-bdd

**Classification:** Partial overlap — precedence-aware (methodology)

**Boundary:** Use `playwright-bdd` when the project enforces BDD methodology and Gherkin
feature files are the required spec artifact; use `playwright-e2e-builder` when building
a Playwright E2E suite without BDD requirements (POM, storageState auth, CI sharding).

**A/B validation:**
- "We follow BDD — write Gherkin scenarios and step definitions for the cart feature" → `playwright-bdd`
- "Build an E2E test suite from scratch with page objects, auth state, and CI YAML" → `playwright-e2e-builder`

---

### playwright-e2e-builder ↔ playwright-skill

**Classification:** Partial overlap — precedence-aware (scope)

**Boundary:** Use `playwright-e2e-builder` when establishing or rebuilding a project's
E2E test suite architecture (POM page objects, auth setup, fixture composition, CI
sharding); use `playwright-skill` for one-off or ad-hoc Node.js Playwright automation
scripts that do not require a full suite structure.

**Distinguishing signal:**
- "Set up Playwright from scratch", "build our E2E suite", "create page objects and auth" → `playwright-e2e-builder`
- "Write a quick script to check X", "one-off automation task" → `playwright-skill`
- `playwright-e2e-builder` runs a 4-round interview before generating files; `playwright-skill` executes scripts directly via `run.js`

**A/B validation:**
- "Build an E2E test suite for our app with page objects and CI parallelization" → `playwright-e2e-builder`
- "Write a one-off Playwright script to verify all homepage links work" → `playwright-skill`

---

### playwright-e2e-builder ↔ webapp-testing

**Classification:** Partial overlap — precedence-aware (language)

**Boundary:** Use `playwright-e2e-builder` for TypeScript/Node.js projects; use
`webapp-testing` for Python projects.

**A/B validation:**
- "Build an E2E test suite for our Next.js/React/Node.js app" → `playwright-e2e-builder`
- "Build E2E tests for our Django/Flask/FastAPI app's frontend" → `webapp-testing`

---

## Complementary relationship

### playwright-e2e-builder ↔ playwright

`playwright` (CLI-interactive, no `@playwright/test`) is for exploration; `playwright-e2e-builder`
builds the durable `@playwright/test` suite that replaces ad-hoc exploration. Different
lifecycle stages, not competing activation.
