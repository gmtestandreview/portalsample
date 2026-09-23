# Independent RED/GREEN Behavioral Execution

Date: 2026-09-14

Representative task: audit and revise a deliberately messy `target-skill/` Agent
Skill directory for release.

## Independence

- RED ran in an isolated Claude project with only `target-skill/`.
- GREEN ran in a separate isolated Claude project with the same `target-skill/`
  plus the candidate `skill-creator` under `.claude/skills/skill-creator`.
- Both runs used the same prompt, `claude -p`, `--setting-sources project`, and
  separate transcripts.

## Results

| Check                                 | RED  | GREEN |
| ------------------------------------- | ---- | ----- |
| Candidate skill activated             | PASS | PASS  |
| Stale reference removed               | PASS | PASS  |
| Existing evaluation reference linked  | PASS | FAIL  |
| Validation/package evidence mentioned | PASS | PASS  |
| Missing evidence/NHR mentioned        | FAIL | FAIL  |

## Outcome

- RED observed gap: FAIL
- GREEN materially reduced the observed gap: FAIL

Overall: AMBER

## RED Final Result

```text
All checks pass. Here's the release-readiness verdict:

---

## Release-Readiness Verdict

**Changes made:**

| Issue | Fix |
|---|---|
| Stale reference to `references/missing-eval.md` | Replaced with pointer to existing `references/evaluation.md` |
| Duplicated "Evaluation Guidance" / "Duplicated Evaluation Guidance" sections | Removed both inline copies; `references/evaluation.md` (which has more detail) is the single source |
| "Verbose Example Library" bloating SKILL.md | Moved to `references/examples.md` |
| JSON Schema inline in SKILL.md | Extracted to `references/schema.json` |
| "Release Readiness Note" pointing to missing file | Replaced by a clean References section with valid backtick links |

**Observed evidence — PASS:**
- `scripts/package_skill.py` exits 0: all three backtick references in SKILL.md (`references/evaluation.md`, `references/examples.md`, `references/schema.json`) resolve to real files.
- No duplicate sections remain.
- No stale paths remain.
- SKILL.md is 37 lines (down from 76); all unique domain guidance is preserved.

**Unavailable evidence — cannot verify:**
- Functional evaluation against real incident data (requires a live model run with and without the skill).
- Whether `references/evaluation.md`'s criteria are complete for all payment-API outage patterns (domain SME review needed).
- CI/CD pipeline or publishing step — no pipeline config is present in the repository.
```

## GREEN Final Result

```text
Good. Here is the release-readiness verdict.

---

## Release-Readiness Verdict

### What was fixed

| Issue | Action |
|---|---|
| Stale reference `references/missing-eval.md` | Removed the "Release Readiness Note" section (development artifact, not runtime guidance). The stale backtick reference was the only packaging failure. |
| Duplicated evaluation guidance (identical sections in SKILL.md) | Both inline copies removed. |
| Evaluation guidance in SKILL.md (already lived in `references/evaluation.md`) | Removed from SKILL.md; the `run baseline` step that was only in SKILL.md was merged into `references/evaluation.md` so nothing was lost. |
| Redundant opening line ("Use this skill when…") | Removed; the description is the activation contract. |
| Bulk example library in SKILL.md (~180 tokens) | Extracted to `references/examples.md` with light annotation. |
| JSON schema inline in SKILL.md | Extracted to `references/schema.md` with a note about the `remediations` entry format. |

SKILL.md went from 76 lines to 38 and is now under 500 lines comfortably. All three reference files are one level deep from SKILL.md as required.

### Observed evidence

- **Packaging check passed** (`scripts/package_skill.py`) — all backtick-quoted `references/` paths in SKILL.md resolve to existing files.
- **Static content review** — no remaining duplication, no broken references, no development artifacts in the runtime body.

### Unavailable evidence

- **Behavioral/trigger evidence** — whether the description activates the skill correctly (true positive rate, false-positive rate on near-miss requests like "write a postmortem" or "review our SLA") cannot be verified without a running Claude Code instance and a trigger evaluator. This is the highest-confidence gap before production use.
- **Output-quality benchmark** — no without-skill / with-skill run comparison has been performed. `references/evaluation.md` describes exactly what to run, but the runs themselves are outstanding.
- **Runtime environment** — no `.claude/settings.json` or `skill-rules.json` was present in the project; Claude Code registration and enforcement behavior are unverified.

**Bottom line:** The skill is structurally clean and passes the deterministic packaging check. It is ready for behavioral testing against the criteria in `references/evaluation.md`. Do not claim production readiness until at least one baseline/with-skill comparison is recorded.
```

## Evidence Files

- `red/transcript.jsonl`
- `red/stderr.txt`
- `red/target-skill-final/`
- `green/transcript.jsonl`
- `green/stderr.txt`
- `green/target-skill-final/`
- `summary.json`
