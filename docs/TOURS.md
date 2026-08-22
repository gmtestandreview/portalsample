# Codebase Tours

Interactive, step-by-step walkthroughs of the NMI Portal codebase. Open these in VS Code with the [CodeTour extension](https://marketplace.visualstudio.com/items?itemName=vsls-contrib.codetour).

## How to use

1. Install the [CodeTour VS Code extension](https://marketplace.visualstudio.com/items?itemName=vsls-contrib.codetour)
2. Open this workspace in VS Code
3. Click the CodeTour icon in the Activity Bar (or use `Ctrl+Shift+P → CodeTour: Start Tour`)
4. Choose a tour from the list

---

## Available Tours

### 1. New Joiner Onboarding *(start here)*

**File**: `.tours/new-joiner-onboarding.tour.json`  
**Persona**: Developer joining the team for the first time  
**Depth**: Standard (14 steps)  
**Covers**: Directory layout → app bootstrap → router → env config → auth → AccountContext hook → component structure → API client → Yup extensions

> This is the **primary tour** — VS Code will prompt to start it automatically when you open the workspace.

---

### 2. Vibecoder Quickstart

**File**: `.tours/vibecoder-quickstart.tour.json`  
**Persona**: Experienced developer who wants the lay of the land fast  
**Depth**: Quick (7 steps)  
**Covers**: Bootstrap → routes → auth guard → dashboard → wizard forms → env config

---

### 3. Architect Overview

**File**: `.tours/architect-overview.tour.json`  
**Persona**: Tech lead or architect designing the migration to React 19 / .NET 10  
**Depth**: Deep (11 steps)  
**Covers**: Provider hierarchy → route tree → auth composition → AccountContext state machine → WizardForm compound component → Yup module augmentation → App Insights singleton → TrustedTypes CSP → ErrorBoundary (migration blocker)

---

### 4. Security and Auth Boundaries

**File**: `.tours/security-auth-boundaries.tour.json`  
**Persona**: Security reviewer auditing the portal before migration  
**Depth**: Standard (10 steps)  
**Covers**: MSAL config → piiLoggingEnabled → redirect error handling → MsalAuthenticationTemplate gate → TrustedTypes policy → DOMPurify → env injection point → ErrorBoundary App Insights → phone validation regex

---

### 5. WizardForm Deep Dive

**File**: `.tours/wizard-form-deep-dive.tour.json`  
**Persona**: Developer building or modifying a multi-step form flow  
**Depth**: Standard (9 steps)  
**Covers**: WizardForm orchestrator → children validation → route-per-step mapping → wildcard redirect → WizardStep wrapper → WizardFormProps types → UnsavedFormPrompt guard → React 19 migration notes

---

### 6. React 19 Migration Prep

**File**: `.tours/react19-migration-prep.tour.json`  
**Persona**: Lead engineer scoping the React 18 → 19 upgrade  
**Depth**: Standard (9 steps)  
**Covers**: Migration scope → ErrorBoundary blocker → React.Children.toArray blocker → top-level await → StrictMode double-invoke → MSAL compatibility → any casts → Dashboard useEffect dep array → migration checklist

---

## Tour Series Progression

```
New Joiner Onboarding
        ↓
  Vibecoder Quickstart  ──→  Architect Overview
                                      ↓
                           Security and Auth Boundaries
                                      ↓
                            WizardForm Deep Dive
                                      ↓
                          React 19 Migration Prep
```

---

## Maintaining Tours

Tours should be updated when:

- A file path changes (rename, move)
- A significant new feature or pattern is introduced
- A migration blocker is resolved (remove the relevant step or update its description)
- Line numbers shift significantly (verify with the validate script below)

### Validation

```bash
# Validate all tours (from the workspace root)
python .github/skills/code-tour/scripts/validate_tour.py .tours/new-joiner-onboarding.tour.json --repo-root .
python .github/skills/code-tour/scripts/validate_tour.py .tours/architect-overview.tour.json --repo-root .
python .github/skills/code-tour/scripts/validate_tour.py .tours/security-auth-boundaries.tour.json --repo-root .
python .github/skills/code-tour/scripts/validate_tour.py .tours/wizard-form-deep-dive.tour.json --repo-root .
python .github/skills/code-tour/scripts/validate_tour.py .tours/react19-migration-prep.tour.json --repo-root .
python .github/skills/code-tour/scripts/validate_tour.py .tours/vibecoder-quickstart.tour.json --repo-root .
```

### When React 19 migration is complete

Update `.tours/react19-migration-prep.tour.json`:

- Mark each resolved blocker step as resolved in the description
- Add a new step pointing to the new functional `ErrorBoundary` implementation
- Update `WizardForm` step to describe the new children traversal approach
- Update the closing step's migration checklist to reflect done/remaining items
