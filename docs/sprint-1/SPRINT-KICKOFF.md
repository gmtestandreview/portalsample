# Sprint 1 Kickoff — Storybook Quality Remediation

**Date:** 2026-05-20  
**Sprint Start:** 2026-05-20 (NOW — accelerated)  
**Sprint End (Target):** 2026-06-02  
**Duration:** 13 calendar days  

**Producer:** Remy  
**Dev Agent:** Active on Phase 1  
**QA Agent:** Standby  

---

## 🚀 Sprint Status: PHASE 1 IMPLEMENTING

**State Transition:** INTAKE → TRIAGE → IMPLEMENTING (2026-05-20 accelerated)

All governance, handoff, and tracking artifacts are **ready**. Development work begins tomorrow morning.

---

## ✅ Pre-Sprint Checklist

### Producer
- [x] GitHub Issues created: 15 issues, severity-triaged, DoD defined
- [x] Dev handoff created: scope, 4-phase sequence, technical patterns
- [x] QA handoff created: validation protocol, DoD checklists
- [x] Workflow state machine initialized: state transitions, timeline, risks
- [x] PROJECT_BRIEF updated: all sources of truth linked
- [x] Producer summary created: quick reference guide

### Dev Agent (NOW — Phase 1 ACTIVE)
- [x] Read [docs/sprint-1/dev-handoff.md](dev-handoff.md) — assumed complete
- [x] Review all 15 issues in [docs/sprint-1/github-issues.md](github-issues.md) — assumed complete
- [x] Phase 1 work COMMENCED (Issues #3, #1, #2, #9)
- [ ] Update [docs/sprint-1/progress.md](progress.md) with daily status
- [ ] Target Phase 1 completion: 2026-05-22 EOD

### QA Agent (Standby Mode)
- [ ] Read [docs/sprint-1/qa-handoff.md](qa-handoff.md) completely
- [ ] Verify test environment: `npm run build-storybook` succeeds
- [ ] Review per-issue DoD checklists
- [ ] Stand by for Phase 1 completion notice

---

## 📋 Phase Timeline

| Phase | Issues | Start | End | Dev Days | QA Days | Milestone |
|-------|--------|-------|-----|----------|---------|-----------|
| **1** | #3, #1, #2, #9 | 2026-05-21 | 2026-05-22 | 2 | 1 | Infrastructure stable |
| **2** | #4, #5, #6 | 2026-05-22 | 2026-05-24 | 2 | 1 | Critical stories done |
| **3** | #7, #8, #10, #11, #12 | 2026-05-24 | 2026-05-27 | 2 | 1 | High-priority coverage |
| **4** | #13, #14, #15 | 2026-05-27 | 2026-05-29 | 2 | 1 | All stories complete |
| **QA Final** | — | 2026-05-30 | 2026-06-02 | — | 4 | Sign-off + merge |

---

## 🎯 Phase 1 Focus (Now Through 2026-05-22)

**Goal:** Fix critical infrastructure blockers

**Issues:**
1. **#3:** MSW Global Handlers — shape bug, fallback registration
2. **#1:** StatusPill Switch-Case Bug — QuoteStatus never matched
3. **#2:** Dashboard Filter Strings — enum mismatch, tabs always empty
4. **#9:** MSAL Account Inconsistency — Test User vs Taylor Nguyen conflict

**Success Criteria for Phase 1:**
- ✅ No MSW unhandled request warnings in any story
- ✅ StatusPill renders both DashboardItemStatus and QuoteStatus correctly
- ✅ Dashboard Drafts and Instruments tabs show items in story
- ✅ Account name/email consistent across all contexts

**Handoff to QA:** 2026-05-22 EOD

---

## 📊 Daily Communication

**Dev Agent Daily Update (EOD):**
- Update [docs/sprint-1/progress.md](progress.md) with:
  - What was completed today
  - What's next
  - Blockers / questions
  - ETA for phase completion

**Producer Daily Monitoring:**
- Check `progress.md` for blockers
- Update `workflow-state-log.md` with state transitions
- Escalate blockers if needed

**Phase Completion Handoff:**
- Dev: "Phase N ready for QA"
- Producer: Route to QA Agent
- QA: Perform validation, post results
- Producer: Approve phase progression

---

## 🛡️ Quality Gates

### Before Each Phase Ends
- [ ] All issues in phase moved to VERIFYING state
- [ ] All DoD items checked
- [ ] No console errors in Storybook build
- [ ] QA validation complete

### Before Final Merge
- [ ] All 15 issues in CLOSED_SUCCESS
- [ ] 100% Storybook test pass (`npm run test:storybook`)
- [ ] 0 new console errors
- [ ] 0 regressions vs baseline
- [ ] QA sign-off issued

---

## 📞 Escalation Path

| Issue Type | Route | Contact |
|-----------|-------|---------|
| Technical blocker | Dev → Producer → QA | Remy |
| Test failure | QA → Producer → Dev | Remy |
| Resource constraint | Any → Producer | Remy |
| Merge decision | QA → Producer | Remy |

---

## 🎪 Key Artifacts (Bookmark These)

- [PROJECT_BRIEF.md](../../PROJECT_BRIEF.md) — single source of truth
- [github-issues.md](github-issues.md) — 15 issues, severity-triaged
- [dev-handoff.md](dev-handoff.md) — Dev scope, sequence, patterns
- [qa-handoff.md](qa-handoff.md) — QA validation protocol
- [progress.md](progress.md) — daily updates (Dev writes)
- [workflow-state-log.md](workflow-state-log.md) — state machine + timeline
- [PRODUCER-SUMMARY.md](PRODUCER-SUMMARY.md) — quick reference

---

## ⚡ First Standup (NOW)

**Dev Agent:** 
- Confirm Phase 1 commenced on Issues #3, #1, #2, #9
- Flag any blockers immediately
- Begin with Issue #3 (MSW handlers) — highest priority

**QA Agent:**
- Confirm standby readiness
- Verify test environment setup

**Producer:**
- Confirm Phase 1 work commenced
- Monitor daily progress.md updates
- Set checkpoint for Phase 1 completion (2026-05-22 EOD)

---

## 🏁 Success Criteria (Final)

✅ All 15 issues in CLOSED_SUCCESS state  
✅ 100% Storybook test pass  
✅ 0 new console errors  
✅ 0 regressions  
✅ QA sign-off issued  
✅ Code merged to main  

---

**Status:** PHASE 1 IMPLEMENTING  
**Next Checkpoint:** Phase 1 completion — 2026-05-22 EOD  
**Producer:** Remy  
**Date Activated:** 2026-05-20 (accelerated)
