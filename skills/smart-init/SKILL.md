---
name: smart-init
description: Conversational onboarding for A Team. Detects ROADMAP.md, extracts context, generates INIT.md without requiring technical knowledge. Invoked automatically by the orchestrator when INIT.md is missing.
---

# Smart Init — Conversational Onboarding

## Trigger

This skill is invoked by the orchestrator when `/orchestrate init` is called and no `INIT.md` exists.

## Detection Sequence

Check in this order:

1. `INIT.md` exists → stop, use current init flow unchanged
2. `ROADMAP.md` exists → Path A (extract from ROADMAP)
3. `ROADMAP_*.md` exists (e.g. `ROADMAP_icd10.md`) → Path A (extract from that file)
4. Neither exists → Path B (full 5-question interview)

---

## Path A — ROADMAP Exists

Read the ROADMAP file and extract:

| Look for in ROADMAP | Maps to INIT.md field |
|--------------------|-----------------------|
| Project name in H1 or title | Project name |
| Description paragraph | Project overview |
| Stack table or technology mentions | Languages & stack |
| "Non-negotiable principles" or "Non-negotiable" section | Immutable rules |
| "Next" / "Roadmap" items | Active work context |
| Compliance mentions (GDPR, local-first, privacy, HIPAA) | Compliance scope |
| "Done" section | Existing coverage |

After extraction, ask **only one question** (the only thing a ROADMAP cannot tell you):

> "Which AI tools are you currently using to write code in this project?"
> → A) Claude Code
> → B) Codex CLI
> → C) Cursor
> → D) OpenCode
> → E) Several — select more than one

Then generate INIT.md (see Template section below) and show the review gate.

---

## Path B — No ROADMAP (Full Interview)

Ask these 5 questions, one at a time. Use plain language — assume the user is non-technical.

**Q1 (free text):**
> "What do you want to build? Describe it in your own words."

**Q2 (multiple choice):**
> "Does code already exist, or are you starting from scratch?"
> → A) Starting from scratch
> → B) Code already exists
> → C) I am not sure

*If answer is B: run stack inference silently (see Stack Inference section).*

**Q3 (multiple choice):**
> "What type of project is it?"
> → A) Web app (runs in a browser)
> → B) Mobile app (iPhone or Android)
> → C) API or backend service
> → D) Data analysis or automation
> → E) Other

**Q4 (multiple choice):**
> "Which device or platform should it run on?"
> → A) Browser (any device)
> → B) iPhone / iPad
> → C) Android
> → D) Desktop (Windows / Mac / Linux)
> → E) Server / cloud

**Q5 (multiple choice):**
> "Which AI tools are you currently using to write code in this project?"
> → A) Claude Code
> → B) Codex CLI
> → C) Cursor
> → D) OpenCode
> → E) Several — select more than one

After Q5: generate INIT.md, show review gate, then **offer to create ROADMAP.md**:
> "Would you like me to create a ROADMAP.md for this project based on what you described? It is useful for future sessions."

---

## Stack Inference (Path B, answer B to Q2 only)

Run silently after the user answers B. Do NOT run for new projects (answer A or C).

```bash
git ls-files | sed 's/.*\.//' | sort | uniq -c | sort -rn | head -10
```

Extension → stack mapping:
- `.kt` → Kotlin / Android (agents: kotlin-reviewer, compose-ui)
- `.swift` → Swift / iOS (agents: swift-reviewer)
- `.py` → Python (agents: python-reviewer)
- `.ts` or `.tsx` → TypeScript / React (agents: code-reviewer)
- `.go` → Go (agents: go-reviewer)
- `.rs` → Rust (agents: rust-reviewer)
- `.dart` → Flutter (agents: flutter-reviewer)
- `.java` → Java / Android (agents: kotlin-reviewer as fallback)

Confidence threshold: if one extension accounts for >40% of tracked files, pre-fill Q3/Q4 and confirm with user. If ambiguous, ask normally.

---

## Review Gate

After generating INIT.md, display ONLY the `## What I understood` section and ask:

> "Is that correct? Is anything missing?"

- User says "ok" / "yes" → run `/orchestrate init` automatically
- User describes a correction → update the relevant INIT.md section, show `## What I understood` again
- After 3 correction rounds without approval → ask user to edit INIT.md manually: "I could not understand the correction. Please edit INIT.md directly and say 'ok' when it is ready."

---

## Codex Warning

Show this **before** the final approval:

> "One last thing: Codex will ask you to approve a security script in the next session. Click 'Trust' to continue — it is A Team's state script."

---

## INIT.md Template

Generate this file at the project root. Fill each field from the interview answers or ROADMAP extraction.

```markdown
## What I understood
[Plain language summary: what the project is, inferred stack, active AI platforms, agent count after init]

If anything is wrong, edit this file before continuing.

---

# INIT.md — [Project Name]

> Run `/orchestrate init` after reviewing this file.

## Project Overview

**Name:** [from Q1 or ROADMAP H1]
**Type:** [from Q3: web app / mobile app / API / data / other]
**Status:** [New project / Active development]
**Description:** [from Q1 free text or ROADMAP description]

## Languages & Stack

[Check all that apply — inferred from ROADMAP or stack scan]
- [ ] Kotlin
- [ ] Swift
- [ ] Python
- [ ] TypeScript / JavaScript
- [ ] Go
- [ ] Rust
- [ ] Flutter / Dart
- [ ] Other: ___

**Framework / UI:** [inferred or left blank]
**Database:** [inferred or left blank]
**Build system:** [inferred or left blank]

## Compliance Scope

[Extracted from ROADMAP compliance mentions, or left unchecked]
- [ ] GDPR
- [ ] Child privacy / COPPA
- [ ] Local-first / no external data
- [ ] HIPAA
- [ ] PCI-DSS

## Active AI Platforms

[From Q5 or Path A question]
- [ ] Claude Code
- [ ] Codex CLI
- [ ] Cursor
- [ ] OpenCode

## Non-Negotiable Rules

[Extracted from the ROADMAP "non-negotiable principles" section, or left blank]

## Active Work / Next Steps

[Extracted from the ROADMAP "Next" section, or left blank]

## Agents to Prune

[Inferred from stack — list agents irrelevant to this project's languages/domain]
```
