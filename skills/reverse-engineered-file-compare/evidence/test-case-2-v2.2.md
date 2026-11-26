# Historical Test Case 2 — Attachment migration

Manual v2.2 application, not a controlled host campaign. Roles A/B were inferred
from source and filenames; A = Formik pair, B = RHF pair, topology 2:2, no C.
Reported inventory: 59 A atoms; BLOCKED; candidate ceiling 72.13/100, not a
verified grade. See source report hash below. No source edits or application
runtime tests during that assessment. Its observations motivate v2.3; do not
reuse its atom counts or gate results for changed revisions.

| Lesson                                                             | Historical finding / source locator                     | v2.3 response                |
| ------------------------------------------------------------------ | ------------------------------------------------------- | ---------------------------- |
| Framework/provider substitution needs actual consumer verification | F01; A-F02:47–58, B-F01:47–81                           | FRAMEWORK; FC-018            |
| Scalar loss and filtered index mismatch                            | F02; B-F01:75–81,189–209                                | STATE; FC-019                |
| Persisted category values changed independently of labels          | F04; A-F01:55–63, B-F02:25–32                           | TAXONOMY; FC-020             |
| Delete count omitted and stale async writes possible               | F05/F09/F13; A-F02:174–197, B-F01:170–186, B-F02:91–135 | ASYNC; FC-021                |
| Original optimistic deletion has no explicit rollback              | F09; A-F02:174–197                                      | INHERITED_DEFECT; FC-022/023 |

The subsequent remediation produced a three-file candidate. The archived
remediation report records 38 isolated checks passing with mock hooks and
synthetic types, not actual React/RHF, project lint, accessibility, API or
production acceptance. It deliberately changed state/error and mutation
contracts; actual integration and approvals remain subject to verification. No
new host run or repository test is claimed here. The new migration fixtures are
synthetic, not copies of proprietary application sources.

## Historical artifact locators and SHA-256

These source/report artifacts are not bundled dependencies. They identify the
historical inputs, not current v2.3 evidence.

| Historical artifact                         | SHA-256                                                            |
| ------------------------------------------- | ------------------------------------------------------------------ |
| `AttachmentItem-new.tsx`                    | `7397c77f1b38c04f9f0fb3165c4920df704e2f97005d4194e9ca145b4c235419` |
| `index-new.tsx`                             | `c6943ef1575e44100605213d0d045b0b024b9fd569cf1edd2978443b1a664909` |
| `index(1).tsx`                              | `3b1bc7ab5ac1bdbe39177a14b749cdcb9ab83b22757a86bf7f5ab45aac4fd983` |
| `RhfAttachmentItem.tsx`                     | `c6768980def5c42edbdf24c4a4ca7e44322bd4a1a9468edb35dbc6115d1034e6` |
| `test-case-2-attachment-comparison-v2.2.md` | `b64dde9c365b1ac34b66878fd9071d99533a3f992a2d2a9ea77c83d47e0a7120` |
| `attachment-remediated.zip`                 | `5aa30b4c61884304384913317d0b9d9dd84c32f26c4b047bceb2e72135806843` |
