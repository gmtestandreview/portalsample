# PROJECT BRIEF

## 1. Project

Storybook vs Source remediation program for portal.measurement.gov.au snapshot.

## 2. Objective

Close the gaps and defects identified in the Storybook quality assessment so Storybook is trustworthy as a rebuild and regression safety net.

## 3. In Scope

- Story infrastructure reliability fixes.
- High and medium severity source defects exposed by assessment.
- Missing story coverage for critical components and critical route steps.
- Play function interaction coverage for high-risk stories.
- QA sign-off artifact for sprint closure.

## 4. Out of Scope

- New product features unrelated to assessment findings.
- Broad design or visual refresh.
- Refactors without direct traceability to assessment risks.

## 5. Delivery Model

- Producer (Remy): planning, triage, handoffs, closure governance.
- Dev Team (Nova/Sage/Milo): implementation and updates to progress artifacts.
- QA (Ivy): validation, issue reporting, sign-off.

## 6. Source of Truth

- Assessment: [Storybook vs Source Quality Assessment Report](docs/Storybook%20vs%20Source%20Quality%20Assessment%20Report.md)
- GitHub Issues: [docs/sprint-1/github-issues.md](docs/sprint-1/github-issues.md) — 15 issues, severity-triaged
- Dev Handoff: [docs/sprint-1/dev-handoff.md](docs/sprint-1/dev-handoff.md) — scope, sequence, patterns
- QA Handoff: [docs/sprint-1/qa-handoff.md](docs/sprint-1/qa-handoff.md) — validation protocol, DoD checklists
- Sprint Progress: [docs/sprint-1/progress.md](docs/sprint-1/progress.md) — daily updates by Dev
- Workflow State: [docs/sprint-1/workflow-state-log.md](docs/sprint-1/workflow-state-log.md) — state transitions + timeline
- QA Sign-Off: [docs/sprint-1/qa-signoff.md](docs/sprint-1/qa-signoff.md) — issued after QA verification

## 7. Current State (2026-05-20 — Phase 1 IMPLEMENTING)

**Sprint Status:** IMPLEMENTING Phase 1 (Dev work commenced immediately)

- Storybook assessment completed: **15 issues identified** (4 critical, 6 high, 5 medium)
- GitHub Issues triaged: all 15 created with severity labels + Definition of Done
- Dev Agent handoff created: 4-phase execution plan, technical constraints, patterns
- QA Agent handoff created: validation protocol, testing checklists, sign-off criteria
- Workflow state log initialized: state machine, phase timeline, risk register
- Sprint kickoff issued: phase timeline, quality gates, escalation paths
- Phase 1 unlocked: ready for Dev Agent (start 2026-05-21 09:00 UTC)

**Artifacts Ready:**

- `docs/sprint-1/github-issues.md` — 15 issues with severity, DoD, blocking relationships
- `docs/sprint-1/dev-handoff.md` — scope, 4-phase sequence, technical patterns
- `docs/sprint-1/qa-handoff.md` — validation protocol, per-issue checklists
- `docs/sprint-1/workflow-state-log.md` — state machine, phase timeline, risk register
- `docs/sprint-1/SPRINT-KICKOFF.md` — official start, phase timeline, quality gates
- `docs/sprint-1/PRODUCER-SUMMARY.md` — quick reference guide

## 8. Next State (2026-05-21 Onwards)

**For Dev Agent (Starting 2026-05-21 09:00 UTC):**

1. Read [docs/sprint-1/dev-handoff.md](docs/sprint-1/dev-handoff.md) completely
2. Review all 15 issues in [docs/sprint-1/github-issues.md](docs/sprint-1/github-issues.md)
3. Begin Phase 1 (Issues #3, #1, #2, #9) — Critical infrastructure fixes
4. Update [docs/sprint-1/progress.md](docs/sprint-1/progress.md) daily (EOD)
5. Notify Producer when Phase 1 ready for QA (target: 2026-05-22 EOD)

**For QA Agent (Standby through 2026-05-22):**

1. Review [docs/sprint-1/qa-handoff.md](docs/sprint-1/qa-handoff.md) completely
2. Verify test environment: `npm run build-storybook` works
3. Stand by for Phase 1 completion notice from Producer
4. Begin Phase 1 validation when Dev notifies "ready for QA"

**For Producer (Daily Monitoring):**

1. Monitor [docs/sprint-1/progress.md](docs/sprint-1/progress.md) daily for blockers
2. Update [docs/sprint-1/workflow-state-log.md](docs/sprint-1/workflow-state-log.md) with state transitions
3. Escalate blockers immediately if they arise
4. Approve phase progression only after all issues in phase are VERIFIED by QA

## 9. Success Criteria

✅ All 15 issues in CLOSED_SUCCESS state  
✅ 100% Storybook test pass rate (`npm run test:storybook`)  
✅ 0 new console errors  
✅ 0 regressions in existing tests  
✅ QA sign-off issued  
✅ Code merged to main  

**Timeline:** 13 calendar days (8 dev days + 5 QA days)  
**Critical Path:** Phase 1 (infrastructure) → Phase 2 (stories) → Phase 3 (coverage) → Phase 4 (refinement) → QA → Merge

## 10. Key Milestones

| Date | Milestone | Owner | Status |
|------|-----------|-------|--------|
| 2026-05-20 17:00 UTC | Sprint kickoff issued | Producer | ✅ Complete |
| 2026-05-20 NOW | Phase 1 begins (Issues #3, #1, #2, #9) | Dev Agent | ✅ In Progress |
| 2026-05-22 EOD | Phase 1 ready for QA | Dev Agent | 🔄 Standby |
| 2026-05-22 EOD | Phase 1 QA validation complete | QA Agent | 🔄 Standby |
| 2026-05-24 EOD | Phase 2 QA validation complete | QA Agent | 🔄 Standby |
| 2026-05-27 EOD | Phase 3 QA validation complete | QA Agent | 🔄 Standby |
| 2026-05-29 EOD | Phase 4 QA validation complete | QA Agent | 🔄 Standby |
| 2026-06-02 EOD | Full test run complete, sign-off issued | QA Agent | 🔄 Standby |
| 2026-06-02 EOD | Merge to main | Producer | 🔄 Standby |

---

**Last Updated:** 2026-05-20 17:00 UTC  
**Sprint Commenced:** 2026-05-20 17:00 UTC  
**Next Phase Start:** 2026-05-21 09:00 UTC
