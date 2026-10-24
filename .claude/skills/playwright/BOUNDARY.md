# BOUNDARY: playwright

## Partial overlaps

### playwright ↔ playwright-skill

**Classification:** Partial overlap — precedence-aware

**Boundary:** Use `playwright` for CLI-interactive browser automation using the
`playwright-cli` wrapper (snapshot → stable element ref → interact loop, refs like `e3`,
`e15`); use `playwright-skill` when writing a reusable, file-based Node.js Playwright
script with dev-server auto-detection or artifact output directories.

**Distinguishing signal:**
- No persistent script file needed, terminal-REPL style → `playwright`
- Writing a `.js` script to `PW_SCRIPT_DIR`, saving artifacts to `PW_ARTIFACT_DIR` → `playwright-skill`
- `playwright` explicitly excludes `@playwright/test`; neither skill writes test files

**A/B validation:**
- "Snapshot the ARIA tree of this page from the terminal" → `playwright`
- "Write a Node.js Playwright script to test login and save screenshots" → `playwright-skill`

---

### playwright ↔ webapp-testing

**Classification:** Partial overlap — precedence-aware (language)

**Boundary:** Use `webapp-testing` when the project uses Python (`sync_playwright()`,
`with_server.py`); use `playwright` when the project uses Node.js or CLI-based browser
automation.

**A/B validation:**
- "Screenshot this page in our Django/Flask/FastAPI app" → `webapp-testing`
- "Open this URL and snapshot the page in the terminal" → `playwright`

---

## Complementary relationship

### playwright ↔ playwright-e2e-builder

`playwright` is for interactive CLI automation (explicitly avoids `@playwright/test`).
`playwright-e2e-builder` builds durable `@playwright/test` suite architecture (POM,
storageState auth, CI sharding). These serve different lifecycle stages; activate
`playwright` for exploration and `playwright-e2e-builder` when establishing a persistent
test suite.
