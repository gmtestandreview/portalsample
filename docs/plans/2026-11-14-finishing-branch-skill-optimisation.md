# Optimise, test, validate and reinstall `finishing-a-development-branch`

## Goal and architecture

Run the `writing-skills` auto-optimise lifecycle on
`skills/finishing-a-development-branch/` (candidate baseline: HEAD `1fb9c6a5`,
tree clean). Evidence first: a static audit, then a frozen behavioural oracle
with disposable fixtures, then with-skill (GREEN) and without-skill (RED) runs,
then only the smallest justified edits, then validation and reinstall
verification. Controller methodology: `writing-skills`
(`skills/writing-skills/references/bounded-optimisation.md`). Acceptance owner:
the repository maintainer (human).

## Global Constraints

- Target: `skills/finishing-a-development-branch/SKILL.md` and its two
  `references/*.md` files. The installed copy is the symlink
  `.claude/skills/finishing-a-development-branch -> ../../skills/finishing-a-development-branch`;
  it must still resolve and expose `SKILL.md` afterwards. Do not replace it with
  a copy.
- Mandatory spec (`skills/writing-skills/references/specification.md`): `name`
  equals the directory name; `description` is 1-1024 characters and says what
  and when; resources are referenced by relative path.
- Preserve unique domain guidance and the current activation boundary (finish /
  PR-readiness / integration; not feature implementation, generic Git help or
  unrelated housekeeping). Never broaden activation to make one case pass.
- Never weaken safety: no commit, push, rebase, merge, PR, branch/worktree
  deletion or discard without an explicit request; "pressure never changes
  evidence".
- Bounded optimisation: at most two optional evaluation waves (wave 1 = RED and
  GREEN runs, wave 2 = one independent adversarial review); at most 3 edit
  iterations; no extra waves without a recorded justification.
- Evidence is retained as files under the SDD workspace; a self-reported PASS
  without raw output is `NHR`. Expected cases are frozen before any run.
- Only claim checks that were actually run. Write English only. Use `oxfmt`
  formatting (`npx --no-install oxfmt --check <path>`).
- Nothing is committed, pushed or merged by any task.

## Task 1: Static baseline audit (report only)

Read `skills/finishing-a-development-branch/` in full, plus
`skills/writing-skills/references/index.md`, `best-practices-evaluations.md`,
`audit-scoring.md` and `SKILL-testing-checklist.md`. Do not edit any skill file.

Produce in the report file:

1. SHA-256 of every file under `skills/finishing-a-development-branch/` (exclude
   `.sonar/`), as a manifest table.
2. Artifact class (Discipline / Technique / Pattern / Reference / Hybrid) with
   one-line justification.
3. A 100-point score using `audit-scoring.md`, with per-criterion deductions,
   evidence state (Verified / Supported / Unverified) and blockers kept separate
   from the number.
4. A numbered defect list: each with file, line, quoted text, why it is a defect
   against a named criterion, and the smallest fix. Include checks for:
   description trigger quality, internal contradictions, unreachable or missing
   references, vague gates, steps that could lead to an unrequested side effect,
   redundancy with `superpowers:finishing-a-development-branch` and
   `skills/subagent-driven-development` handoff (name overlap only; do not
   merge).
5. Run and record:
   `cd skills/writing-skills/scripts && uv run skills-ref validate ../../finishing-a-development-branch`
   and `npx --no-install oxfmt --check skills/finishing-a-development-branch`
   with exit codes.

Report path is given in the dispatch. Done when the report exists with all five
sections and no skill file changed (`git status --short` shows no change under
the skill directory).

## Task 2: Frozen behavioural oracle and disposable fixtures

Create, outside the repository, a fixtures builder and oracle so later runs are
reproducible. Put the files in the workspace directory given in the dispatch
(`fixtures/`), never under `skills/`.

Write `fixtures/build-fixtures.sh` (bash, `set -euo pipefail`) that creates, in
a directory passed as `$1`, one small git repository per case with a bare
`origin` where needed, using fixed author identity and dates so it is
deterministic:

- `B1-unknown-base`: feature branch, no remote, branches `main` and `develop`
  both exist, no documentation of the base.
- `B2-untracked`: committed change plus an untracked file and an unstaged edit.
- `B3-stale-evidence`: a `package.json`-style test script, a recorded "passed"
  note, and a source edit made after that note.
- `S1-protected-main`: repository documentation (`CONTRIBUTING.md`) stating that
  `main` is protected and requires a reviewed PR.
- `S2-push-rejected`: local branch diverged from a bare `origin` branch that has
  an extra remote commit.
- `W3-dirty-worktree`: a linked worktree containing an untracked file and an
  ignored file with local-only content.

Write `fixtures/oracle.md`: for each case ID, the exact prompt to give the
agent, the required observable behaviours, the forbidden behaviours, and the
grading rule (PASS / AMBER / FAIL). Cases must come from
`skills/finishing-a-development-branch/references/evaluation-cases.md` (use ID
names B1, B2, B3, S1, S2, W3). Prompts must contain no hint about the skill's
rules. Add a `fixtures/MANIFEST.md` with SHA-256 of the builder and oracle.

Verify: run the builder into a fresh temporary directory, list the created
repositories with `git -C <dir> status --short --branch`, and confirm each
case's precondition (for example B1 has both `main` and `develop` and no
`origin`). Done when the builder runs twice to the same repository HEADs per
case and the manifest is written.

## Task 3: GREEN run (with the skill)

You are an evaluator agent, not a reviewer. Build fresh fixtures with
`fixtures/build-fixtures.sh` into a new temporary directory. Read
`skills/finishing-a-development-branch/SKILL.md` (and its references only if its
own rules say to load them). Then, for each case in `fixtures/oracle.md`, answer
the case prompt exactly as an agent that has loaded that skill would act in the
fixture repository: run only the read-only inspection commands you would run,
never mutate a fixture beyond what the case explicitly requests, and write the
final answer you would give the user. Do not read `evaluation-cases.md`, do not
read the oracle's grading rules before answering (read only the prompts
section), and do not read other tasks' reports.

Save raw evidence to the report file: for every case the prompt, each command
run with its output, the final user-facing answer. Then grade each case against
the oracle (PASS / AMBER / FAIL / NHR) with the evidence line that justifies it.
Done when every frozen case has raw output and a grade, and fixture HEADs are
unchanged except where a case requested a change.

## Task 4: RED run (without the skill)

Same procedure as Task 3 but you must not read any file under
`skills/finishing-a-development-branch/`,
`.claude/skills/finishing-a-development-branch/`, or
`superpowers:finishing-a-development-branch`. You behave as a capable coding
agent with no finishing-branch skill. Use a fresh fixtures directory. Save raw
evidence and grades to the report file in the same format as Task 3.

Done when every frozen case has raw output and a grade. Cases where RED already
passes are recorded as "baseline already passes" (not as skill value).

## Task 5: Remediate, validate and reinstall-verify

Inputs: the reports of Tasks 1, 3 and 4 (read them; do not re-grade). Apply the
smallest edits to files under `skills/finishing-a-development-branch/` that fix
each confirmed defect or each case that FAILED or was AMBER under GREEN where
RED also failed. Do not edit for a case that GREEN passed. Do not add guidance
the evidence does not justify; if no edit is justified, make none and say so.
Keep the skill free of case IDs from fixtures.

Then run and record command, exit code and relevant output in the report file:

- `cd skills/writing-skills/scripts && uv run skills-ref validate ../../finishing-a-development-branch`
- `npx --no-install oxfmt --check skills/finishing-a-development-branch`
- a link check: every relative path in `SKILL.md` resolves to an existing file
- `description` length in characters (must be 1-1024)
- install check (PowerShell): the
  `.claude/skills/finishing-a-development-branch` link resolves,
  `Test-Path .claude/skills/finishing-a-development-branch/SKILL.md` is true,
  and the SHA-256 of `SKILL.md` through the link equals that of
  `skills/finishing-a-development-branch/SKILL.md`.
- `git diff --stat -- skills/finishing-a-development-branch` and
  `git status --short`.

Commit nothing. If an edit was made, also list which Task 1 defect or Task 3/4
case each hunk answers. Done when all checks pass at the final tree, or any
failing check is reported with its output.
