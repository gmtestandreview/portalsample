# BOUNDARY: webapp-testing

## Partial overlaps

### webapp-testing ↔ playwright

**Classification:** Partial overlap — precedence-aware (language)

**Boundary:** Use `webapp-testing` when the project uses Python (`from playwright.sync_api
import sync_playwright`, `with_server.py`); use `playwright` when the project uses
Node.js or CLI-based browser automation.

**A/B validation:**
- "Screenshot this page in our Django/Flask/FastAPI app" → `webapp-testing`
- "Open this URL and snapshot the ARIA tree in the terminal" → `playwright`

---

### webapp-testing ↔ playwright-skill

**Classification:** Partial overlap — precedence-aware (language)

**Boundary:** Use `webapp-testing` for Python environments; use `playwright-skill` for
Node.js environments.

**A/B validation:**
- "Write a Playwright automation script for our FastAPI frontend" → `webapp-testing`
- "Write a Playwright automation script for our Express/React app" → `playwright-skill`

---

### webapp-testing ↔ playwright-e2e-builder

**Classification:** Partial overlap — precedence-aware (language)

**Boundary:** Use `webapp-testing` for Python projects; use `playwright-e2e-builder` for
TypeScript/Node.js projects building a full E2E test suite (POM, storageState auth, CI
sharding).

**A/B validation:**
- "Set up E2E tests for our Django app's frontend" → `webapp-testing`
- "Set up an E2E test suite for our Next.js app with page objects and auth state" → `playwright-e2e-builder`

---

## False positives (no boundary needed)

### webapp-testing ↔ playwright-bdd

No activation overlap. `webapp-testing` is Python browser automation; `playwright-bdd`
is TypeScript BDD feature-spec enforcement. Different language, different purpose.
