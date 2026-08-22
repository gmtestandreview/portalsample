---
name: acquire-codebase-knowledge
description: 'Use this skill when the user explicitly asks to map, document, or onboard into an existing codebase. Trigger for prompts like "map this codebase", "document this architecture", "onboard me to this repo", or "create codebase docs". Do not trigger for routine feature implementation, bug fixes, or narrow code edits unless the user asks for repository-level discovery.'
license: MIT
compatibility: 'Cross-platform. Requires Python 3.8+ and git. Run scripts/scan.py and scripts/validate_codebase_docs.py from the target project root.'
metadata:
  version: "1.3"
  enhancements:
    - Multi-language manifest detection (25+ languages supported)
    - CI/CD pipeline detection (10+ platforms)
    - Container & orchestration detection
    - Code metrics by language
    - Security & compliance config detection
    - Performance testing markers
argument-hint: 'Optional: specific area to focus on, e.g. "architecture only", "testing and concerns"'
---

# Acquire Codebase Knowledge

Produces seven populated documents in `docs/codebase/` covering everything needed to work effectively on the project. Only document what is verifiable from files or terminal output — never infer or assume.

## Output Contract (Required)

Before finishing, all of the following must be true:

1. Exactly these seven public documentation files exist in `docs/codebase/`: `STACK.md`, `STRUCTURE.md`, `ARCHITECTURE.md`, `CONVENTIONS.md`, `INTEGRATIONS.md`, `TESTING.md`, `CONCERNS.md`. Internal hidden working files are allowed only when explicitly created by this workflow; currently this includes `docs/codebase/.codebase-scan.txt`.
2. Every claim is traceable to source files, config, or terminal output.
3. Unknowns are marked as `[TODO]`; intent-dependent decisions are marked `[ASK USER]`.
4. Every document includes a short "evidence" list with concrete file paths.
5. Secret-like values from env/config files are never copied into generated docs or final responses; document variable names, config sources, and redacted placeholders only.
6. Final response includes numbered `[ASK USER]` questions and intent-vs-reality divergences.

## Workflow

Copy and track this checklist:

```
- [ ] Phase 1: Run scan, read intent documents
- [ ] Phase 2: Investigate each documentation area
- [ ] Phase 3: Populate all seven docs in docs/codebase/
- [ ] Phase 4: Validate docs, present findings, resolve all [ASK USER] items
```

## Focus Area Mode

If the user supplies a focus area (for example: "architecture only" or "testing and concerns"):

1. Always run Phase 1 in full.
2. Fully complete focus-area documents first.
3. For non-focus documents not yet analyzed, keep required sections present and mark unknowns as `[TODO]`.
4. Still run the Phase 4 validation loop on all seven documents before final output.

### Phase 1: Scan and Read Intent

1. Run the scan script from the target project root:
   ```bash
   python3 "$SKILL_ROOT/scripts/scan.py" --output docs/codebase/.codebase-scan.txt
   ```
   Where `$SKILL_ROOT` is the absolute path to the skill folder. Works on Windows, macOS, and Linux.

   **Quick start:** If you have the path inline:
   ```bash
   python3 /absolute/path/to/skills/acquire-codebase-knowledge/scripts/scan.py --output docs/codebase/.codebase-scan.txt
   ```

2. Search for `PRD`, `TRD`, `README`, `ROADMAP`, `SPEC`, `DESIGN` files and read them.
3. Summarise the stated project intent before reading any source code.

### Phase 2: Investigate

Use the scan output to answer questions for each of the seven templates. Load [`references/inquiry-checkpoints.md`](references/inquiry-checkpoints.md) for the full per-template question list.

If the stack is ambiguous (multiple manifest files, unfamiliar file types, no `package.json`), load [`references/stack-detection.md`](references/stack-detection.md).

### Phase 3: Populate Templates

Copy each template from `assets/templates/` into `docs/codebase/`. Fill in this order:

1. [STACK.md](assets/templates/STACK.md) — language, runtime, frameworks, high-impact production dependencies
2. [STRUCTURE.md](assets/templates/STRUCTURE.md) — directory layout, entry points, key files
3. [ARCHITECTURE.md](assets/templates/ARCHITECTURE.md) — layers, patterns, data flow
4. [CONVENTIONS.md](assets/templates/CONVENTIONS.md) — naming, formatting, error handling, imports
5. [INTEGRATIONS.md](assets/templates/INTEGRATIONS.md) — external APIs, databases, auth, monitoring
6. [TESTING.md](assets/templates/TESTING.md) — frameworks, file organization, mocking strategy
7. [CONCERNS.md](assets/templates/CONCERNS.md) — tech debt, bugs, security risks, perf bottlenecks

Use `[TODO]` for anything that cannot be determined from code. Use `[ASK USER]` where the right answer requires team intent.

Security and redaction rules for env/config findings:

- Read config files such as `.env.example`, `.env.template`, `.env.sample`, deployment manifests, CI variables, and config modules to identify required variable names, auth models, and config sources.
- Never copy secret-like values into generated docs or final responses. Redact passwords, tokens, API keys, private keys, certificates, cookies, session IDs, connection strings, signed URLs, and credential-bearing hostnames as `[REDACTED]`.
- Document the variable name, purpose if evident, source file, and whether the value is required, optional, or unknown. If purpose is not evident, mark it `[TODO]`.
- If a real secret appears committed, record it as a security concern using the file path and variable name only; do not expose the secret value. Mark any rotation or revocation decision as `[ASK USER]` unless policy is explicit.
- Before quoting scan output, inspect it for credential-like values and replace those values with `[REDACTED]` while preserving enough surrounding context to support the claim.

### Phase 4: Validate, Repair, Verify

Run this mandatory validation loop before finalizing:

1. Run the lightweight output validator:
   ```bash
   python3 "$SKILL_ROOT/scripts/validate_codebase_docs.py" --project-root . --docs-dir docs/codebase
   ```
   Treat this as a fast structural and safety check, not a substitute for evidence review.
2. Validate each doc against `references/inquiry-checkpoints.md`.
3. For each non-trivial claim, confirm at least one evidence reference exists.
4. If any required section is missing, unsupported, structurally invalid, or flagged by the validator:
  - Fix the document.
  - Re-run the validator.
  - Re-run manual evidence checks for changed sections.
5. Repeat until all seven docs pass.

Then present a summary of all seven documents, list every `[ASK USER]` item as a numbered question, and highlight any Intent vs. Reality divergences from Phase 1.

Validation pass criteria:

- No unsupported claims.
- No empty required sections.
- Unknowns use `[TODO]` rather than assumptions.
- Team-intent gaps are explicitly marked `[ASK USER]`.
- `docs/codebase/` contains the seven required public documentation files; hidden workflow artefacts such as `.codebase-scan.txt` are allowed but must not be presented as final documentation.
- Generated docs and final responses contain no raw secret-like values from env/config files; credential-like values are replaced with `[REDACTED]` while variable names and evidence paths remain visible.

---

## Gotchas

**Monorepos:** Root `package.json` may have no source — check for `workspaces`, `packages/`, or `apps/` directories. Each workspace may have independent dependencies and conventions. Map each sub-package separately.

**Outdated README:** README often describes intended architecture, not the current one. Cross-reference with actual file structure before treating any README claim as fact.

**TypeScript path aliases:** `tsconfig.json` `paths` config means imports like `@/foo` don't map directly to the filesystem. Map aliases to real paths before documenting structure.

**Generated/compiled output:** Never document patterns from `dist/`, `build/`, `generated/`, `.next/`, `out/`, or `__pycache__/`. These are artefacts — document source conventions only.

**Env/config files reveal required config, not shareable values:** Read `.env.example`, `.env.template`, `.env.sample`, deployment manifests, and config modules to discover required environment variables and config sources. Never copy credential-like values; use `[REDACTED]` and document only variable names, purposes, and evidence paths.

**`devDependencies` ≠ production stack:** Only `dependencies` (or equivalent, e.g. `[tool.poetry.dependencies]`) runs in production. Document linters, formatters, and test frameworks separately as dev tooling.

**Test TODOs ≠ production debt:** TODOs inside `test/`, `tests/`, `__tests__/`, or `spec/` are coverage gaps, not production technical debt. Separate them in `CONCERNS.md`.

**High-churn files = fragile areas:** Files appearing most in recent git history have the highest modification rate and likely hidden complexity. Always note them in `CONCERNS.md`.

---

## Anti-Patterns

| ❌ Don't | ✅ Do instead |
|---------|--------------|
| "Uses Clean Architecture with Domain/Data layers." (when no such directories exist) | State only what directory structure actually shows. |
| "This is a Next.js project." (without checking `package.json`) | Check `dependencies` first. State what's actually there. |
| Guess the database from a variable name like `dbUrl` | Check manifest for `pg`, `mysql2`, `mongoose`, `prisma`, etc. |
| Copy a token, password, private key, cookie, or full credential-bearing URL into docs | Replace the value with `[REDACTED]`; document the variable name, config source, and security concern if committed. |
| Document `dist/` or `build/` naming patterns as conventions | Source files only. |

---

## Enhanced Scan Output Sections

The `scan.py` script now produces the following sections in addition to the original output:

- **CODE METRICS** — Total files, lines of code by language, largest files (complexity signals)
- **CI/CD PIPELINES** — Detected GitHub Actions, GitLab CI, Jenkins, CircleCI, etc.
- **CONTAINERS & ORCHESTRATION** — Docker, Docker Compose, Kubernetes, Vagrant configs
- **SECURITY & COMPLIANCE** — Snyk, Dependabot, SECURITY.md, SBOM, security policies
- **PERFORMANCE & TESTING** — Benchmark configs, profiling markers, load testing tools

Use these sections during Phase 2 to inform investigation questions and identify tool-specific patterns.

---

## Bundled Assets

| Asset | When to load |
|-------|-------------|
| [`scripts/scan.py`](scripts/scan.py) | Phase 1 — run first, before reading any code (Python 3.8+ required) |
| [`scripts/validate_codebase_docs.py`](scripts/validate_codebase_docs.py) | Phase 4 — run before finalizing to check required docs, headings, placeholders, allowed hidden artefacts, evidence sections, `[ASK USER]` formatting, and redaction safety |
| [`references/inquiry-checkpoints.md`](references/inquiry-checkpoints.md) | Phase 2 — load for per-template investigation questions |
| [`references/stack-detection.md`](references/stack-detection.md) | Phase 2 — only if stack is ambiguous |
| [`assets/templates/STACK.md`](assets/templates/STACK.md) | Phase 3 step 1 |
| [`assets/templates/STRUCTURE.md`](assets/templates/STRUCTURE.md) | Phase 3 step 2 |
| [`assets/templates/ARCHITECTURE.md`](assets/templates/ARCHITECTURE.md) | Phase 3 step 3 |
| [`assets/templates/CONVENTIONS.md`](assets/templates/CONVENTIONS.md) | Phase 3 step 4 |
| [`assets/templates/INTEGRATIONS.md`](assets/templates/INTEGRATIONS.md) | Phase 3 step 5 |
| [`assets/templates/TESTING.md`](assets/templates/TESTING.md) | Phase 3 step 6 |
| [`assets/templates/CONCERNS.md`](assets/templates/CONCERNS.md) | Phase 3 step 7 |

Template usage mode:

- Default mode: complete only the "Core Sections (Required)" in each template.
- Extended mode: add optional sections only when the repo complexity justifies them.
