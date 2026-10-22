# BOUNDARY: playwright-bdd

## Partial overlap

### playwright-bdd ↔ playwright-e2e-builder

**Classification:** Partial overlap — precedence-aware (methodology)

**Boundary:** Use `playwright-bdd` when the project enforces BDD methodology and Gherkin
feature files are the required spec artifact (Phase 0 necessity check, `npx bddgen`,
scoped step definitions); use `playwright-e2e-builder` when building a Playwright E2E
suite without BDD requirements (pragmatic POM, storageState auth, CI sharding).

**Distinguishing signal:**
- Project mandates Gherkin `.feature` files and step definitions → `playwright-bdd`
- Building a durable test suite with page objects, auth state, and CI YAML but no BDD → `playwright-e2e-builder`
- `playwright-bdd` Phase 0 runs a necessity gate; if BDD is not warranted it routes out

**A/B validation:**
- "We follow BDD — write Gherkin scenarios for login and wire up step definitions" → `playwright-bdd`
- "Set up Playwright from scratch with POM, auth state persistence, and CI sharding" → `playwright-e2e-builder`

---

## False positives (no boundary needed)

### playwright-bdd ↔ playwright

No activation overlap. `playwright-bdd` enforces BDD feature-spec workflows; `playwright`
is CLI-interactive browser automation. Different tasks, different outputs.

### playwright-bdd ↔ playwright-skill

No activation overlap. `playwright-bdd` is a development methodology enforcement skill;
`playwright-skill` writes ad-hoc Node.js automation scripts. Different tasks.

### playwright-bdd ↔ webapp-testing

No activation overlap. Different language (TypeScript BDD vs Python sync automation) and
different purpose (feature-spec enforcement vs local automation). No boundary needed.
