# Business Rules Register — Verification Pass

**Date:** 2026-09-02
**Artefact under review:** `analysis/BUSINESS_RULES.md` (53 rules, 1,093 lines)
**Change record:** CRD-044
**Trigger:** `DEC-002` — a P0 entry (RULE-035) was found to be factually wrong about the code it cites (CRD-043), so the register was re-verified before any BA or Legal sign-off is sought.
**Baseline:** all source positions verified against `git show HEAD:<file>`, not the working tree, so the annotation line-shifts made earlier today cannot confound the result.

---

## Verdict

**The register's *line citations* are systematically unreliable and must not be used for navigation or
sign-off. Its *specifications* are unverified as a body, though the two checked in depth were sound.**

This is not a case of a few stale line numbers. Of 21 citations examined in detail, **18 are wrong**,
including **five P0 rules**, and **three point past the end of the file entirely**. A register whose
citations are wrong at this rate cannot be handed to a BA or to Legal as the basis for a signature,
because a reviewer cannot reach the code a rule claims to describe.

| Check | Result |
| --- | --- |
| Rules in summary table | 53 |
| Rules with a detail section | 47 — **6 missing** |
| Citations mechanically resolved | 58 across 47 detail blocks |
| Cited files that do not exist | 0 — every *file* path is valid |
| Citations examined in detail | 21 |
| **Confirmed miscited** | **18** |
| Confirmed correct | 3 (RULE-016, RULE-030, RULE-041) |
| Citations pointing beyond end of file | 3 (RULE-010, RULE-012, RULE-015) |
| Specifications verified by execution | 2 (RULE-035 — **defect**; RULE-022 — sound) |

**Interpretation.** Every file path is correct but most line numbers are not. That is the signature of
a register generated against an earlier tree and never reconciled since — not of a careless author. The
practical consequence is the same either way.

---

## Finding 1 — 18 confirmed miscitations

Each row was verified by locating the rule's actual construct at `HEAD` with a targeted pattern.

| Rule | Pri | Cited | Actually at | Notes |
| --- | --- | --- | --- | --- |
| RULE-001 | **P0** | `PreConditions.tsx:64` | 75, 77, 81, 87 | Cited line is a `modalDispatch` `useMemo`, unrelated to the account-creation gate |
| RULE-005 | **P0** | `PreConditions.tsx:84` | 37, 42, 45, 57, 65 | Cited line is the *dashboard* redirect, not the branch-selection gate |
| RULE-008 | P1 | `helperFunctions.ts:123` | 145, 146 | Cited line is JSDoc for a download helper |
| RULE-009 | P1 | `quotation/index.tsx:124` | 36, 101, 103, 104, 118 | Cited line is a token-acquisition `try` block |
| RULE-010 | **P0** | `instrumentItem.tsx:448` | 254, 258, 276, 293 | **Beyond EOF** — file is 416 lines |
| RULE-012 | **P0** | `quotation/index.tsx:398` | 36, 101, 103, 104 | **Beyond EOF** — file is 375 lines |
| RULE-015 | P1 | `instrumentItem.tsx:469` | 285, 287, 295, 297 | **Beyond EOF** — file is 416 lines |
| RULE-019 | P1 | `instrumentItem.tsx:362` | 174, 202, 291 | Cited line is a "Requested for:" layout column |
| RULE-026 | P1 | `utils/index.ts:248` | 278, 279, 280 | Cited line is inside a word-casing helper, not currency formatting |
| RULE-028 | P2 | `utils/index.ts:197` | 220, 221, 223 | |
| RULE-029 | P2 | `NumberInput/index.tsx:57` | 5, 7, 27, 28, 36 | |
| RULE-032 | P1 | `stringExtensions.ts:426` | 117, 394, 409 | Cited line is a `catch` in a different validator |
| RULE-034 | P1 | `stringExtensions.ts:644` | 122, 681, 691 | Cited line is closing punctuation |
| RULE-036 | P1 | `stringExtensions.ts:568` | 80, 124, 609, 625 | |
| RULE-037 | P1 | `stringExtensions.ts:502` | 89, 126, 523, 534 | Cited line is inside the **email** validator |
| RULE-050 | **P0** | `summaryAndAccept.tsx:382` | **367** | Unambiguous single match — corrected |
| RULE-051 | P1 | `summaryAndAccept.tsx:383` | **369** | Unambiguous single match — corrected |
| RULE-053 | P2 | `dashboard/index.tsx:51` | 111, 124, 140, 151 | Cited line is a search-placeholder constant |

Verified correct and left alone: **RULE-016**, **RULE-030**, **RULE-041**.

---

## Finding 2 — six rules are listed but never defined

`RULE-023`, `RULE-024`, `RULE-025`, `RULE-029`, `RULE-030`, **`RULE-051`** appear in the summary table
with a name, category, priority and source, but have **no `### RULE-0xx` detail section** — no plain-English
statement, no specification, no parameters.

`RULE-051` matters most: it is **P1, it is one of the two hardcoded-value rules awaiting Legal
confirmation** (the NMI registered address), and it is cross-referenced from `OPEN-ITEMS-BACKLOG.md`
P2 item 17. Legal is being asked to confirm a rule that the register never actually states.

---

## Finding 3 — RULE-035 was factually wrong (already corrected, CRD-043)

Recorded here for completeness. The register claimed the ASIC charset **excludes** `&` and that
`"Smith & Sons Pty Ltd"` is INVALID. Executing the live regex disproves both: that name is **VALID**,
and `&` is plainly present in the `!@#$%^&*` run of the charset the register itself prints one line
above. The `&amp;` in the original text points to an HTML-escaping artefact as the likely cause.

A BA answering "yes, allow `&`" would have prompted a change to a **correct P0 validator**.

---

## Finding 4 — RULE-022 is specified correctly but the validator is never called

**The specification is sound.** Verified line by line against `common.ts`, and by execution:

| Input | Result | |
| --- | --- | --- |
| `51824753556` | VALID | the register's own worked example — arithmetic confirmed, sum 534, 534 mod 89 = 0 |
| `74599608295` | VALID | the NMI ABN from RULE-050 — **is a structurally valid ABN** |
| `51824753557` | INVALID | corrupted check digit |
| `5182475355` | INVALID | 10 digits |

Weights `[10,1,3,5,7,9,11,13,15,17,19]`, minus-one on the first digit, modulus 89, 11-character and
no-whitespace guards — all exactly as documented.

**But `isValidAbn` has zero usages outside `common.ts`.** No Yup `.test()` call, no component, nothing.
The register's own SME question suspected this; it is now confirmed. RULE-022 is **P0** and its
plain-English statement asserts that "Australian Business Numbers are validated using the official
Australian Taxation Office weighted checksum algorithm" — as written, that is not true on the client.
The function is dead code.

**This needs a decision, not just a note.** Either ABN checksum validation is genuinely enforced
server-side (in which case RULE-022 should say so, and the dead client function should be removed or
deliberately retained with a comment), or it is enforced nowhere and invalid ABNs can be submitted.
The distinction is not visible from this repository, since the API lives elsewhere.

*Useful by-product for RULE-050:* the hardcoded NMI ABN passes the ATO checksum, so it is at least
structurally valid. Legal still needs to confirm it is NMI's **current** ABN — a valid checksum says
nothing about whose ABN it is.

---

## What was NOT verified

Stating this plainly so the scope of assurance is not overstated:

- **Specifications for 50 of 53 rules are unverified.** Only RULE-035, RULE-022 and RULE-042 were
  checked against source behaviour. The other 50 may be accurate — RULE-022 shows the author capable
  of precision — but after RULE-035, accuracy cannot be assumed.
- **Citations for the ~37 rules not in the detail table above are unverified** beyond confirming the
  file exists and the line is within range.
- **No claim is made about completeness** — whether business rules exist in the code that the register
  omits entirely was not assessed.

---

## Recommendation

1. **Do not seek BA or Legal sign-off against this register in its current state.** Both open sign-off
   items (RULE-035 charset, RULE-050/051 ABN and address) sit on entries that were wrong, miscited, or
   in RULE-051's case never written.
2. **Re-derive the citations mechanically.** They were almost certainly generated once; regenerating
   them against the current tree is cheap and removes the whole defect class. A pre-commit or CI check
   that every `**Source:**` line resolves would stop it recurring.
3. **Write the six missing detail sections**, starting with RULE-051 because Legal is blocked on it.
4. **Resolve RULE-022** with the backend team: is ABN checksum validation enforced server-side?
5. **Then** verify the remaining specifications, P0 first.

Tracked as `RULES-REGISTER-001` in `OPEN-ITEMS-BACKLOG.md`.
