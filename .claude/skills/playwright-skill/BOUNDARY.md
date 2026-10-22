# BOUNDARY: playwright-skill

## Partial overlaps

### playwright-skill ↔ playwright

**Classification:** Partial overlap — precedence-aware

**Boundary:** Use `playwright` for CLI-interactive browser automation using the
`playwright-cli` wrapper (snapshot → stable element ref → interact loop); use
`playwright-skill` when writing a reusable, file-based Node.js Playwright script with
dev-server auto-detection (`detectDevServers`) or artifact output (`PW_ARTIFACT_DIR`).

**Distinguishing signal:**
- Terminal REPL-style interaction, no script file output → `playwright`
- Writing a `.js` script file, auto-detecting a running dev server, persisting artifacts → `playwright-skill`

**A/B validation:**
- "Open this URL in the terminal and click through the nav" → `playwright`
- "Write a Node.js script to automate the checkout flow and save screenshots" → `playwright-skill`

---

### playwright-skill ↔ playwright-e2e-builder

**Classification:** Partial overlap — precedence-aware (scope)

**Boundary:** Use `playwright-e2e-builder` when establishing or rebuilding a project's
E2E test suite architecture (POM, storageState auth, fixtures, CI YAML); use
`playwright-skill` for one-off or ad-hoc automation scripts that do not require full
suite structure.

**A/B validation:**
- "Build a Playwright test suite from scratch with page objects and auth state" → `playwright-e2e-builder`
- "Write a quick script to scrape this page and output a CSV" → `playwright-skill`

---

### playwright-skill ↔ webapp-testing

**Classification:** Partial overlap — precedence-aware (language)

**Boundary:** Use `playwright-skill` for Node.js environments; use `webapp-testing` for
Python environments.

**A/B validation:**
- "Write a Playwright automation script for our React/Node.js app" → `playwright-skill`
- "Write a Playwright automation script for our Django/FastAPI app" → `webapp-testing`
