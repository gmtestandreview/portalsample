# Storybook Vitest Addon Startup Experiment

You are working in this repository as a senior Storybook, Vitest, Vite,
TypeScript, Node.js, browser-testing, and Windows build engineer.

## Objective

Perform the single highest-value remaining experiment for the
`@storybook/addon-vitest` startup failure:

> Determine whether the real addon-managed child can reuse a stable, compatible
> Vitest Browser Mode / Vite dependency-optimization state and emit
> `{ type: "ready" }` within Storybook addon-vitest's 30-second startup
> deadline.

The investigation is no longer broad troubleshooting.

Do not revisit already disproven causes unless new evidence directly contradicts
them.

Do not modify production configuration unless this experiment demonstrates a
repository-owned cause that is both necessary and safely correctable.

## Current demonstrated state

Treat the following as established live evidence unless current repository or
runtime evidence directly contradicts it.

### Reproduction

Three real addon-managed Vitest child runs launched by live Storybook all failed
at the addon startup deadline:

```text
Run 1: ~30.68 s → SIGTERM
Run 2: ~30.79 s → SIGTERM
Run 3: ~30.77 s → SIGTERM
```

In all three:

```text
ready IPC was never emitted before termination
```

This is the actual addon path, not a standalone reconstruction.

### Config path

The live addon child was confirmed to load with:

```text
VITEST_STORYBOOK=true
```

and select the direct Storybook Vitest project.

Therefore:

```text
the previous ~48–55 s workspace/project-indirection bottleneck is already fixed
```

Do not spend further time profiling the normal two-project workspace unless new
evidence shows the addon child is loading it.

### createVitest

Live measurements placed config load / `configureVitest` at approximately:

```text
~0.85–1.0 s  first config load
~2.6 s       configureVitest / createVitest effectively complete
```

Therefore `createVitest()` is not the remaining startup bottleneck.

Do not reclassify it as causal without contrary live measurement.

### Coverage

Runtime instrumentation confirmed:

```text
coverageEnabled=false
```

during addon startup.

The presence of V8 coverage configuration in source does not make coverage part
of the live startup cause.

Remove coverage from the active hypothesis unless new runtime evidence
contradicts this.

### Runtime bridge

Installed Vitest 4.1.11 source shows `init()` delegates directly to
`standalone()` apart from a deprecation log.

The repository bridge:

```ts
vitest.init = vitest.standalone.bind(vitest);
```

is therefore behaviorally redundant for startup sequencing and timing, apart
from suppressing that warning.

Do not remove or A/B this bridge again unless installed source or live behavior
changes.

### Browser API observations

`127.0.0.1:61005` was observed free at rest.

No stale owner, external collision, or retry has been demonstrated as the cause.

Observed runs differed:

```text
Run 1:
61005 was not observed listening before termination

Run 2:
61005 was observed listening at ~21.6 s
ready still did not arrive before ~30.8 s termination

Run 3:
pristine run
61005 was not observed listening through the monitored pre-timeout interval
ready never arrived
```

These observations establish that port `61005` itself is not presently
demonstrated causal.

However, do not equate:

```text
61005 not observed listening
```

with:

```text
no Vitest Browser API listener existed anywhere
```

without process/socket evidence.

For all further measurements, correlate Browser API startup with the actual
addon-child PID and its descendant processes.

### Vite dependency optimization

Across the live runs, Vite repeatedly reported dependency re-optimization,
including messages such as:

```text
Re-optimizing dependencies because vite config has changed
```

The pristine run reproduced the same behavior after temporary instrumentation
had been removed.

Therefore:

```text
temporary diagnostic edits are not sufficient to explain the repeated re-optimization
```

The current leading mechanism is:

```text
addon child
  ↓
direct Storybook Vitest config
  ↓
createVitest completes quickly
  ↓
vitest.init()/standalone()
  ↓
Vitest Browser Mode / Vite server startup
  ↓
dependency optimization or optimization invalidation
  ↓
Browser API may become available late or not within the observed window
  ↓
browser/page/session initialization does not finish
  ↓
ready IPC never arrives
  ↓
addon parent sends SIGTERM
```

Important evidentiary correction:

Do not treat the presence or absence of a specific Vite log line as definitive
proof that an optimized-dependency cache was or was not finalized.

For example:

```text
"Optimized dependencies" appeared
```

is useful supporting evidence that optimization progressed or completed.

But:

```text
"Optimized dependencies" did not appear
```

is not, by itself, proof that no usable cache state was written.

Cache completion/reuse must be established using the strongest available
combination of:

```text
cache-directory contents
metadata/hash stability
mtime/content changes
resolved optimize-deps configuration
subsequent reuse behavior
absence/presence of rebundling
runtime timings
```

Use log messages as evidence, not as cache-commit primitives.

### Story count

Do not state that story count is the root cause.

No live evidence has shown that all configured stories are transformed before
ready.

Continue to distinguish:

```text
stories matched by configuration
stories indexed/discovered
browser-requested modules
Vite-transformed modules
modules required before provider/session readiness
```

No story-count conclusion is allowed without measured request/transform
evidence.

### Warnings

These remain non-causal unless directly measured otherwise:

```text
extensionless ./rollupOnLog import
config-loader ESM/CommonJS warnings
vendor INVALID_ANNOTATION warnings
PLUGIN_TIMINGS
```

Do not modify configuration solely to eliminate these warnings.

## Config-loader evidence rule

Do not infer the active loader from absence of an environment/config value.

Specifically, never translate:

```text
STORYBOOK_CONFIG_LOADER=undefined
```

or:

```text
configLoader option absent
```

directly into:

```text
native loader
```

Instead establish loader behavior using layered evidence:

```text
1. value explicitly passed by Storybook/addon-vitest, if any
2. value visible in the addon-child environment/options
3. installed Vitest/Storybook implementation and documented default behavior
4. runtime diagnostics/warnings that identify the loader actually used
5. observed behavior
```

If those signals disagree, report the disagreement.

For final reporting, distinguish:

```text
configured loader value
effective loader inferred from installed implementation
runtime evidence of the loader actually exercised
```

Do not collapse them into one claim.

## Single remaining experiment

The remaining discriminating question is:

> Can the addon child reuse a genuinely compatible dependency-optimization
> state, and is its optimizer/cache fingerprint stable across otherwise
> identical addon launches?

Perform the narrowest safe experiment that answers this.

Preferred sequence:

```text
1. Start from a clean repository state.

2. Confirm ports 6006 and 61005 are free.

3. Record:
   - relevant Node process count
   - CPU pressure
   - memory pressure
   - existing Vite/Vitest dependency-cache directories and metadata

4. Run the standalone Storybook Vitest path to successful completion:
      npm run test:storybook

5. Determine whether that run:
   - completed Browser Mode startup
   - performed dependency optimization
   - changed optimization cache files/metadata
   - produced an observable optimizer/config fingerprint

6. Without changing source/config files afterward:
   start the real Storybook dev server.

7. Trigger the real addon-managed `test-run`.

8. Measure:
   child start
   optimizer/cache identity
   child-PID/descendant sockets
   Browser API readiness
   ready IPC or SIGTERM

9. If practical, repeat the addon trigger once more without any file/config changes.

10. Compare:
    standalone cache identity
    addon Run A cache identity
    addon Run B cache identity
```

The repeated addon comparison is important.

A prior successful standalone run does not prove the addon cache is warm.

Likewise, a failed attempt to reuse the standalone cache does not by itself
prove caches are inherently incompatible.

Determine whether two otherwise identical addon launches themselves produce a
stable or changing optimizer fingerprint.

## Cache/fingerprint questions to answer

Where observable, identify the data Vite uses or persists for dependency
optimization, including relevant:

```text
cache directory
metadata file
config hash/fingerprint
dependency hash
browser-mode-specific identity
project/root identity
resolved optimizeDeps inputs
```

Do not assume exact internal field names unless supported by the installed Vite
version.

Compare:

```text
standalone Storybook Vitest run
addon live Run A
addon live Run B
```

Classify the result as one of:

```text
same cache/fingerprint and reused
same cache/fingerprint but rebuilt anyway
different stable fingerprints between standalone and addon
different fingerprints across identical addon runs
insufficient evidence to determine fingerprint compatibility
```

The distinction matters.

If addon Run A and addon Run B themselves produce different optimization
fingerprints with no source/config changes, that is stronger evidence of an
unstable addon/runtime configuration identity than merely observing repeated
`"Re-optimizing dependencies"` output.

## Browser API / socket measurement correction

Do not use port `61005` as the sole Browser API readiness signal.

For the decisive addon run, identify the addon child PID and, where practical,
its descendant process tree.

Monitor listening/connected sockets owned by those processes.

Record:

```text
requested Browser API host:port
whether 61005 was initially free
first listener owned by child or descendant
actual bound address and port
PID owning that listener
whether requested port differed from actual port
whether any fallback port was used
whether bind retries occurred
first ESTABLISHED browser connection
```

If no child-related listener is found before SIGTERM, report:

```text
no Browser API listener attributable to the addon child was observed
```

rather than:

```text
Browser API definitely never started
```

unless installed implementation/runtime evidence makes that stronger conclusion
valid.

If the configured port is free and the child still binds another port,
investigate why.

Do not classify port fallback itself as causal without timing evidence.

## What counts as a warm-cache result

Do not call the cache warm merely because:

```text
npm run test:storybook completed previously
```

A useful warm-cache result requires evidence that the subsequent addon path
either:

```text
reuses compatible optimizer metadata/state
```

or at minimum:

```text
avoids the previously observed full dependency re-optimization
```

Evidence may include:

```text
stable matching cache metadata/hash
unchanged cache artifacts
materially reduced optimization work
materially earlier Browser API availability
absence of rebundling with corroborating cache evidence
```

Do not rely on one log line alone.

## Required measurements

For the decisive addon run, capture the nearest reliable timestamps for:

```text
trigger sent
child spawned
config load
configureVitest / createVitest completion
dependency optimization start
cache metadata read/write, if observable
dependency optimization completion, if reliably observable
first child-owned Browser API listener
first browser connection
page/navigation start, if observable
test-provider/session readiness, if observable
ready IPC
SIGTERM, if ready is not reached
```

Compute:

```text
child start → createVitest complete
createVitest complete → Browser API listener
Browser API listener → ready
child start → ready
```

or, for failure:

```text
child start → SIGTERM
Browser API listener → SIGTERM
```

Do not invent missing boundaries.

Use:

```text
unobserved
```

or:

```text
not established
```

where necessary.

## Decision rules

### Outcome A — compatible state is reused and ready < 30 s

If the addon child demonstrably reuses compatible dependency-optimization state
and emits ready under 30 seconds, classify the issue as:

```text
cold-start / cache-invalidation startup robustness
```

Report:

```text
cold-run ready outcome
warm-run ready outcome
difference in time to Browser API listener
difference in time to ready
cache/fingerprint evidence
whether optimizer work was skipped or materially reduced
```

Do not call this a permanent architectural floor.

Then determine whether there is a supported repository-owned way to preserve or
pre-warm the required state without introducing brittle workflow requirements.

Do not implement such a workaround unless measured benefit justifies it.

### Outcome B — standalone state exists but addon uses a different stable fingerprint

If:

```text
npm run test:storybook completes
```

and produces reusable optimization state, but:

```text
addon Run A
addon Run B
```

both use the same addon-specific fingerprint that differs from standalone,
classify this as:

```text
stable standalone/addon cache incompatibility
```

Then identify which resolved configuration difference accounts for that
incompatibility, as far as evidence allows.

Do not modify unrelated config to force the hashes to match.

### Outcome C — identical addon runs produce different optimizer fingerprints

If two addon launches with no source/config changes produce different
optimize-deps identities, classify this as:

```text
unstable addon/runtime optimization configuration
```

This becomes a higher-priority cause than generic cold-cache cost.

Identify the changing input if possible.

Examples to investigate only if evidence points there:

```text
generated config values
runtime-injected plugin/config objects
temporary paths
timestamps/non-deterministic values
root/project identity
Storybook-generated runtime configuration
```

Do not speculate beyond measured differences.

### Outcome D — cache appears reused but ready still > 30 s

If the addon child demonstrably reuses optimized dependency state but still
fails to emit ready within 30 seconds, dependency optimization is not sufficient
to explain the deadline.

Measure the next live boundary:

```text
Browser API listener
  ↓
browser connection
  ↓
_openBrowserPage/navigation
  ↓
Vite transforms/evaluation
  ↓
Storybook preview/test bootstrap
  ↓
test-provider/session handshake
  ↓
standalone resolves
  ↓
ready IPC
```

Only then revive `_openBrowserPage` as the active bottleneck hypothesis.

### Outcome E — every addon run rebuilds and no reusable state can be established

If every real addon child begins substantial dependency re-optimization and is
killed before usable state can be demonstrated, document the observed cycle
conservatively:

```text
no reusable compatible optimizer state demonstrated
  ↓
substantial dependency optimization occurs
  ↓
30 s addon deadline reached
  ↓
ready not emitted
  ↓
next child again performs substantial optimization
```

Do not strengthen this to:

```text
the cache definitely cannot be persisted
```

unless cache metadata/file evidence proves it.

If no safe repository-owned change is demonstrated to break the cycle, classify
the limitation as the interaction of:

```text
@storybook/addon-vitest hard 30 s boot deadline
+
observed Vitest Browser Mode / Vite startup cost for this repository
```

Do not describe this as a generic Vitest defect unless Vitest has been isolated
independently from Storybook's timeout.

## Prohibited actions

Do not:

- edit `node_modules`;
- patch or increase `MAX_START_TIME`;
- disable `@storybook/addon-vitest`;
- remove stories or tests;
- disable Chromatic as a speculative fix;
- disable required coverage configuration;
- redesign the existing `VITEST_STORYBOOK` bypass;
- infer `configLoader=native` merely from `undefined`;
- change `core.builder.options.configLoader` merely to remove warnings;
- change the extensionless `./rollupOnLog` import merely to remove warnings;
- modify `viteFinal` without measured plugin/import/transform evidence;
- infer cache completion solely from an optimizer log line;
- infer cache non-persistence solely from absence of a log line;
- infer Browser API absence solely from port 61005;
- infer story-count causality from globs;
- infer browser-launch cost from total Browser Mode startup;
- call port 61005 causal without collision or fallback evidence;
- call `_openBrowserPage` causal unless the live child reaches it and
  measurement supports it;
- call the issue fixed unless the actual addon child emits ready in under 30
  seconds.

## Repository-change discipline

Prefer observation to modification.

If a repository-owned change becomes justified:

```text
1. state the measured cause
2. record baseline timing
3. make one minimal change
4. rerun the exact live addon reproduction
5. record after timing
6. validate npm run test:storybook
7. keep only if causality is demonstrated
```

Remove all temporary diagnostics before finishing.

Do not overwrite unrelated user changes.

## Final response

Return exactly these sections.

### Root cause

State only the earliest mechanism demonstrated by live evidence.

Distinguish, as appropriate:

```text
cold dependency optimization
cache incompatibility
unstable optimizer fingerprint
post-optimization Browser Mode startup
upstream 30 s deadline
```

Do not overstate cache persistence or Browser API state beyond the evidence.

### Warm-cache experiment

Report:

```text
how candidate warm state was produced
what evidence shows optimization state existed
whether the addon reused compatible state
whether substantial re-optimization recurred
```

### Optimizer/cache fingerprint comparison

Provide:

```text
Standalone
Addon Run A
Addon Run B
```

and for each report, where observable:

```text
cache location
optimizer/config identity
metadata/hash
reuse/rebuild behavior
```

Conclude one of:

```text
compatible
stable but incompatible
unstable across addon runs
not established
```

### Live-child timeline

Provide measured child-relative timings.

Mark unobservable boundaries explicitly.

### Cold vs warm comparison

Use a table:

```text
Run
Cache/config state
createVitest complete
Optimizer identity
Re-optimization evidence
Browser API listener
Ready IPC
Termination
Dominant measured stage
```

Include the prior three live runs plus the new experiment.

### Browser API/socket findings

State:

```text
whether 61005 was free initially
requested API host/port
actual child-owned listening socket
owning PID
fallback port, if any
first browser connection
collision/retry evidence
```

Do not equate “61005 not observed” with “no Browser API existed” unless
independently proven.

### Config-path and loader findings

Report separately:

```text
VITEST_STORYBOOK value
direct Storybook config selection
explicit configLoader value
effective loader according to installed implementation
runtime loader evidence
```

If these differ, explain the discrepancy.

Never infer native solely from `undefined`.

### Coverage findings

State whether coverage was enabled at runtime.

### Runtime bridge findings

State the installed-source relationship between `init()` and `standalone()`.

### Request/transform findings

Separate:

```text
stories matched
stories indexed
browser-requested modules
Vite-transformed modules
readiness-critical modules
```

Do not merge these categories without evidence.

### Cache/fingerprint findings

State whether standalone and addon paths share a compatible
dependency-optimization state.

Also state whether:

```text
addon Run A
addon Run B
```

produce stable optimizer identities.

If not, identify the changing input as specifically as evidence permits.

### Upstream vs repository-owned responsibility

Separate:

```text
repository-owned necessary work
repository-owned unnecessary work, if demonstrated
environmental contribution
Storybook addon behavior
Vitest/Vite behavior
hard 30 s deadline effect
```

Do not call something upstream merely because no easy fix was found.

### Changes made

List:

```text
temporary changes
retained changes
reverted changes
unrelated pre-existing working-tree changes left untouched
```

### Validation

List only commands actually executed and their results.

End with:

```text
actual addon child ready time: <value or not reached>
under 30 seconds: yes/no
compatible optimizer state reused: yes/no/unproven
addon optimizer identity stable across repeated runs: yes/no/unproven
```

### Remaining uncertainty

List only unresolved questions that materially affect root-cause classification.

If the final experiment shows that the addon cannot reuse completed optimization
state, or that identical addon starts produce an unstable optimizer fingerprint,
and the real child still dies at ~30 seconds with no safe repository-owned
correction demonstrated, the single highest-value next action is to prepare a
minimal upstream reproduction or issue demonstrating:

```text
real addon-managed child
measured optimizer/cache behavior
measured Browser API/socket progression
hard 30 s boot deadline
ready not emitted
```

Do not add a speculative repository workaround merely to hide the upstream
limitation.
