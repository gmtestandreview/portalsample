---
name: executing-plans
description: Use when you have a written implementation plan to execute in the current session. Loads the plan, reviews critically, executes all tasks, and reports when complete.
---
<!-- A Team fork. Merged from superpowers 6.3.0 on 2026-09-09. See .claude/docs/specs/2026-09-09-a-team-wiring-review-design.md -->

# Executing Plans

Load plan, review critically, execute all tasks, report when complete.

**Announce at start:** "I'm using the executing-plans skill to implement this plan."

**Prefer `subagent-driven-development` over this skill** when subagents are available —
it provides higher quality through per-task fresh context and two-stage review.

## The Process

### Step 1: Load and Review Plan
1. Ensure an isolated workspace — use the `using-git-worktrees` skill to create or verify one.
2. Read plan file completely
3. Review critically — identify questions or concerns about the plan
4. If concerns: raise with human partner BEFORE starting
5. If no concerns: create TodoWrite and proceed

### Step 2: Execute Tasks

For each task:
1. Mark as in_progress
2. Follow each step exactly (plan has bite-sized steps)
3. Run verifications as specified
4. Mark as completed

**Do not pause to check in between tasks** unless blocked.

### Step 3: Complete Development

After all tasks complete:
- Use `finishing-a-development-branch` skill
- Verify tests, update docs, commit

## When to Stop and Ask

**STOP executing immediately when:**
- Hit a blocker (missing dependency, test fails, instruction unclear)
- Plan has critical gaps preventing starting
- Verification fails repeatedly

**Ask for clarification rather than guessing.**

## When to Revisit Earlier Steps

**Return to Review (Step 1) when:**
- Partner updates the plan based on your feedback
- Fundamental approach needs rethinking

**Don't force through blockers** - stop and ask.

## Hard Rules

- Never start on main/master branch without explicit user consent
- Follow plan steps exactly — don't improvise
- Stop when blocked, don't guess
- Skip nothing in the verification steps
