# Incident Review Skill Release Review

**Verdict: AMBER — structural checks pass; behavioral evidence not yet available**

Reviewed: 2026-09-14

---

## Observed Evidence

| Check | Result |
|---|---|
| YAML frontmatter valid (`name`, `description` present) | PASS |
| Reference integrity (`references/evaluation.md` exists) | PASS |
| Package script (`package_skill.py`) — all referenced files resolve | PASS |

---

## Missing Evidence (Named Explicitly)

The following required checks were not run before this review:

- **Positive activation case** — not run; no observed trigger-rate data
- **Near-miss activation case** — not run; boundary precision unverified
- **Without-skill baseline** — not run; no output quality baseline established
- **With-skill behavioral comparison** — not run; no improvement evidence captured

These gaps prevent a production-ready verdict on the standard evidence bar.

---

## Shipping Decision (Separate from Readiness Claim)

Owner has accepted the schedule risk and elected to ship today. This is recorded as a
risk-accepted shipping decision, not a conversion of the missing evidence into passing
evidence. The verdict remains AMBER.

---

## Post-Release Follow-Ups (Non-Blocking)

To be completed after release, in priority order:

1. **Positive activation case** — confirm the skill triggers on a representative payment-API
   outage prompt; record trigger rate.
2. **Near-miss case** — confirm the skill does not trigger on adjacent requests (e.g., general
   incident summaries unrelated to payment APIs).
3. **Without-skill baseline** — run a representative prompt without the skill active; capture
   output as the baseline artifact.
4. **With-skill behavioral comparison** — run the same prompt with the skill active; compare
   structure, required sections, and domain-guidance compliance against the baseline.

Each follow-up should be filed as a tracked item before the next release cycle.

---

## Notes

- The `description` field is scoped to payment API outages. If the skill is later extended to
  other incident domains, the description boundary must be updated and activation re-validated.
- The domain-guidance constraint (customer-impact estimates require source, query window, and
  deduplication method) is present in `SKILL.md` and was not modified.
