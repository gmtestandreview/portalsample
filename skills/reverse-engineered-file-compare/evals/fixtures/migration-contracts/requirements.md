# Synthetic migration requirements (frozen prospective oracle)

These are independent TypeScript models of form ports, not actual library
integrations. `contracts.ts` is a shared inspected dependency; A and B each have
one member, unless a case explicitly changes scope. No historical C. The
synthetic case stipulates authorised substitution of the private form port in
these fixtures only; actual provider/consumer compatibility needs its own
evidence. The fixture's caller uses the corresponding port; no external API
version supplied.

For FC-018–FC-024, freeze these independently regressible obligations before
mapping B. Public symbols `bind`, `read`, `categoryPath`, `remove`, `save` and
`options` are individually required named exports; their types/signatures are
assessed with the authorised port substitution, not exact private type identity.
Use the following order (public contracts in source declaration order, then
rules in requirement order). No new atoms for extra test inputs or MC rows.

| Atom  | Requirement | Required observable outcome                                                  | Weight |
| ----- | ----------- | ---------------------------------------------------------------------------- | ------ |
| A-001 | P1          | options export                                                               | 2      |
| A-002 | P2          | read export                                                                  | 2      |
| A-003 | P3          | bind export                                                                  | 3      |
| A-004 | P4          | categoryPath export                                                          | 2      |
| A-005 | P5          | remove export                                                                | 3      |
| A-006 | P6          | save export                                                                  | 3      |
| A-007 | R1          | null/undefined read as empty list                                            | 2      |
| A-008 | R2          | scalar read retains the document                                             | 3      |
| A-009 | R3          | array read retains ordered records                                           | 3      |
| A-010 | R4          | bind writes array at form.docs                                               | 3      |
| A-011 | R5          | category path targets form.docs index and category                           | 3      |
| A-012 | R6          | Photo or Diagram persisted value                                             | 3      |
| A-013 | R7          | Manual persisted value                                                       | 3      |
| A-014 | R8          | remove success removes target only                                           | 3      |
| A-015 | R9          | remove callback receives ID and remaining unlocked count                     | 3      |
| A-016 | R10         | rejection retains prior local list (approved requirement; A violates)        | 3      |
| A-017 | R11         | successful save writes category by document identity                         | 3      |
| A-018 | R12         | save rejection retains prior local list                                      | 3      |
| A-019 | R13         | external list changes during pending save survive local commit               | 3      |
| A-020 | R14         | external list changes during pending delete survive local commit             | 3      |
| A-021 | R15         | latest category intent remains after overlapping saves complete out of order | 3      |

N=21; W=59. Weight 2 = Medium; weight 3 = High. R1 groups two empty
representations because the required outcome is the same; distinct scalar and
ordered list obligations can regress independently. R13/R14 are separate
mutations, not a new atom for each schedule. R10/R14 are explicit higher
business authority; A's optimistic removal violates R10 and its success path
does not reapply stale state; tests distinguish observable final state from
commit timing. R10 is an approved requirement, but approval of a specific
material behavioural correction is pending except FC-023. Document §2.2/§7.7
approval; do not infer G05 pass or confirmed parity from source alone. R15
concerns local client state only; all three supplied models can reproduce the
stale-intent defect. No requirement mandates distributed server ordering in this
model; identify that limitation and do not claim it is proven. The real
framework, accessibility, server permissions and integration quality gates
require scope/evidence checks.
