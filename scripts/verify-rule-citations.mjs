#!/usr/bin/env node
/**
 * Verify - and optionally re-derive - the source citations in analysis/BUSINESS_RULES.md.
 *
 * Why this exists
 * ---------------
 * A 2026-09-02 verification pass (CRD-044) found 18 of 21 examined citations pointing at the wrong
 * line, three of them past the end of the file. Every *file path* was correct; the line numbers had
 * rotted because the register was generated once and never reconciled. Line numbers decay on every
 * edit made above them, so the only durable fix is a check that runs in CI.
 *
 * How it works
 * ------------
 * Each rule's Specification block already contains the distinctive strings and identifiers that
 * appear in the code it describes - quoted error messages, Yup method constants, field names. Those
 * are extracted as ANCHORS. A citation is considered correct when its anchors are found near the
 * cited line. The same derivation drives both modes, so --fix and the CI check can never disagree.
 *
 *   node scripts/verify-rule-citations.mjs          check; exit 1 if any citation is wrong
 *   node scripts/verify-rule-citations.mjs --fix    rewrite citations that can be resolved uniquely
 *   node scripts/verify-rule-citations.mjs --json   machine-readable output
 *
 * A citation is only rewritten when the evidence is unambiguous. Anything weaker is reported as
 * UNRESOLVED and left alone - guessing would reintroduce the defect this script exists to catch.
 */

/* eslint-disable no-console -- this is a CLI reporter; stdout is its interface. */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
// Imported explicitly rather than relied on as a global: eslint.config.mjs gives `**/*.mjs` browser
// globals, so a bare `process` is an undefined-variable error here.
import process from 'node:process';

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const REGISTER = join(REPO_ROOT, 'analysis', 'BUSINESS_RULES.md');

/** How far a citation may drift from its anchors before it is considered wrong. */
const DRIFT_TOLERANCE_LINES = 10;
/** Minimum anchor score for a re-derived citation to be trusted enough to write. */
const MIN_CONFIDENT_SCORE = 2;
/** A single anchor this long is distinctive enough to stand alone. */
const STRONG_ANCHOR_MIN_LENGTH = 12;
/** An anchor occurring more often than this in a file locates nothing and is discarded. */
const MAX_ANCHOR_OCCURRENCES = 3;

const args = new Set(process.argv.slice(2));
const FIX = args.has('--fix');
const JSON_OUT = args.has('--json');

/** Pull the distinctive tokens out of a rule block that should also appear in the cited source. */
function extractAnchors(block) {
    const anchors = new Set();
    // Mine the whole rule block, not just its fenced pseudo-code. Real error strings and field
    // names are quoted just as often in Plain English and Parameters as in the Specification, and
    // the rarity filter downstream discards whatever turns out not to locate anything.
    const hay = block;

    for (const m of hay.matchAll(/'([^'\n]{8,})'|"([^"\n]{8,})"/g)) {
        anchors.add(m[1] ?? m[2]);
    }
    for (const m of hay.matchAll(/\b([A-Z][A-Z0-9]*(?:_[A-Z0-9]+){1,})\b/g)) {
        anchors.add(m[1]);
    }
    for (const m of hay.matchAll(/\b([a-z][a-zA-Z0-9]{7,})\b/g)) {
        anchors.add(m[1]);
    }
    for (const m of hay.matchAll(/\b([A-Z][a-zA-Z0-9]{2,}\.[A-Za-z][a-zA-Z0-9]{2,})\b/g)) {
        anchors.add(m[1]);
    }

    // Prose words that carry no locating power and would produce false matches everywhere.
    const NOISE = new Set([
        'Specification', 'Parameters', 'Confidence', 'Category', 'Priority', 'Source',
        'undefined', 'function', 'required', 'validation', 'returning',
    ]);
    return [...anchors].filter((a) => !NOISE.has(a));
}

/**
 * Keep only anchors that actually locate something.
 *
 * An anchor appearing on many lines of the file carries no positional information - `errorMessage`
 * occurs in every validator - and scoring on it produces confident-looking nonsense. Anchors are
 * therefore filtered by rarity within the file being searched, not globally.
 */
function rareAnchors(sourceLines, anchors) {
    return anchors.filter((a) => {
        const hits = sourceLines.reduce((n, l) => n + (l.includes(a) ? 1 : 0), 0);
        return hits >= 1 && hits <= MAX_ANCHOR_OCCURRENCES;
    });
}

/** Score every line of a file by how many of the rule's anchors it contains. */
function scoreLines(sourceLines, anchors) {
    return sourceLines.map((line, index) => {
        let score = 0;
        let strong = false;
        for (const a of anchors) {
            if (line.includes(a)) {
                score += 1;
                if (a.length >= STRONG_ANCHOR_MIN_LENGTH) strong = true;
            }
        }
        return { line: index + 1, score, strong };
    });
}

/** Best contiguous region for a rule: the densest cluster of anchor hits. */
function bestRegion(scored) {
    const hits = scored.filter((s) => s.score > 0);
    if (hits.length === 0) return null;

    const max = Math.max(...hits.map((h) => h.score));
    const peaks = hits.filter((h) => h.score === max);
    const start = peaks[0];

    // Extend through neighbouring hit lines to produce a range rather than a bare line.
    let end = start.line;
    for (const h of hits) {
        if (h.line > end && h.line - end <= 6) end = h.line;
    }
    return {
        start: start.line,
        end: Math.max(end, start.line),
        score: max,
        strong: peaks.some((p) => p.strong),
        peakCount: peaks.length,
    };
}

/**
 * Some citations give a bare filename rather than a repo-relative path. Resolve those against the
 * paths already seen in the register, so a shorthand citation is checked rather than reported as a
 * missing file.
 */
let knownPaths = null;
/** Every full repo-relative path the register mentions anywhere, used to expand shorthand. */
function knownPathIndex() {
    if (knownPaths) return knownPaths;
    knownPaths = new Set();
    const full = /`((?:ClientApp|analysis|scripts|tests)\/[A-Za-z0-9_\-./]+\.(?:ts|tsx|json))[:`]/g;
    for (const m of register.matchAll(full)) knownPaths.add(m[1]);
    return knownPaths;
}

/**
 * Citations are written at three depths: full repo-relative path, a partial path such as
 * `quotation/index.tsx`, and a bare filename. All three name the same file, so all three are
 * resolved - by exact match first, then by unique path suffix. An ambiguous suffix is refused
 * rather than guessed.
 */
function resolveCitedPath(cited) {
    const direct = join(REPO_ROOT, cited);
    if (existsSync(direct)) return direct;

    const suffix = cited.startsWith('/') ? cited : `/${cited}`;
    const matches = [...knownPathIndex()].filter(
        (p) => p === cited || p.endsWith(suffix),
    );
    const unique = [...new Set(matches)];
    if (unique.length === 1) {
        const viaKnown = join(REPO_ROOT, unique[0]);
        if (existsSync(viaKnown)) return viaKnown;
    }
    return null;
}

const register = readFileSync(REGISTER, 'utf8');
// Split on \r?\n deliberately. The register is CRLF, and in JavaScript `.` excludes line
// terminators - \r among them - so a trailing \r stops `(.*)$` from ever matching a heading.
// Left unhandled, every regex below silently matches nothing and the check reports a clean pass.
const registerLines = register.split(/\r?\n/);

// Split the register into rule blocks.
const blocks = [];
registerLines.forEach((ln, i) => {
    const m = /^### (RULE-\d+):\s*(.*)$/.exec(ln);
    if (m) blocks.push({ id: m[1], title: m[2], start: i });
});
blocks.forEach((b, i) => {
    b.end = i + 1 < blocks.length ? blocks[i + 1].start : registerLines.length;
    b.text = registerLines.slice(b.start, b.end).join('\n');
});

const CITATION = /`([A-Za-z0-9_\-./]+\.(?:ts|tsx|json))(?::(\d+)(?:-(\d+))?)?`/g;

// A parser that matches nothing looks exactly like a clean pass. Refuse to report success unless
// the register was actually understood - this is how the CRLF bug above hid on its first run.
const MIN_EXPECTED_RULES = 40;
if (blocks.length < MIN_EXPECTED_RULES) {
    console.error(`FAIL: parsed only ${blocks.length} rule blocks from ${REGISTER}.`);
    console.error('Expected at least ' + MIN_EXPECTED_RULES + '. The register format has changed, or');
    console.error('the parser is broken - either way this check is not validating anything.');
    process.exit(2);
}

const results = [];

// Citations appear in two places and both are load-bearing: the `**Source:**` line inside each rule,
// and the Source column of the summary table - which is what a reader consults first. Checking only
// the former lets a wrong table entry sail through, so both are collected here and validated alike.
const anchorsByRule = new Map(
    blocks.map((b) => [b.id, extractAnchors(b.text)]),
);

const citationSites = [];
for (const block of blocks) {
    const sourceLine = block.text.split('\n').find((l) => l.startsWith('**Source:**'));
    if (sourceLine) {
        citationSites.push({ id: block.id, text: sourceLine, where: 'detail' });
    }
}
for (const ln of registerLines) {
    const m = /^\|\s*(RULE-\d+)\s*\|/.exec(ln);
    if (m && anchorsByRule.has(m[1])) {
        citationSites.push({ id: m[1], text: ln, where: 'table' });
    }
}

for (const site of citationSites) {
    const block = { id: site.id };
    const sourceLine = site.text;
    const anchors = anchorsByRule.get(site.id) ?? [];

    for (const m of sourceLine.matchAll(CITATION)) {
        const [, citedPath, l1] = m;
        const abs = resolveCitedPath(citedPath);
        const entry = {
            rule: block.id,
            where: site.where,
            path: citedPath,
            cited: l1 ? Number(l1) : null,
            status: 'OK',
            detail: '',
        };

        if (!abs) {
            entry.status = 'MISSING_FILE';
            entry.detail = 'cited file does not exist';
            results.push(entry);
            continue;
        }
        if (!l1) {
            entry.status = 'NO_LINE';
            entry.detail = 'citation has no line number';
            results.push(entry);
            continue;
        }

        const srcLines = readFileSync(abs, 'utf8').split(/\r?\n/);
        entry.fileLines = srcLines.length;

        if (entry.cited > srcLines.length) {
            entry.status = 'PAST_EOF';
            entry.detail = `cited line ${entry.cited} exceeds file length ${srcLines.length}`;
        }

        const usable = rareAnchors(srcLines, anchors);
        const scored = usable.length > 0 ? scoreLines(srcLines, usable) : null;
        const region = scored ? bestRegion(scored) : null;
        entry.anchors = usable.length;
        entry.derived = region;

        // Does the CITED line already have anchor support nearby? If so the citation is doing its
        // job and must not be rewritten. Checking this first is what stops the tool "correcting"
        // citations that were right all along - the failure mode that makes auto-fixers dangerous.
        const citedSupported = scored !== null && entry.status !== 'PAST_EOF' && scored.some(
            (s) => s.score > 0 && Math.abs(s.line - entry.cited) <= DRIFT_TOLERANCE_LINES,
        );

        if (citedSupported) {
            entry.status = 'OK';
            entry.detail = `anchors near cited line (${usable.length} distinctive anchor(s))`;
            results.push(entry);
            continue;
        }

        if (!region) {
            if (entry.status === 'OK') {
                entry.status = 'UNRESOLVED';
                entry.detail = usable.length === 0
                    ? 'rule text yields no anchor distinctive enough to locate in this file'
                    : 'no anchor matches found in the cited file';
            }
            results.push(entry);
            continue;
        }

        // Only rewrite on a single, unambiguous winner. Several lines tying for best means the
        // anchors cannot distinguish between them, and picking one would be a guess.
        const unique = region.peakCount === 1;
        const confident = unique && (region.score >= MIN_CONFIDENT_SCORE || region.strong);

        if (entry.status === 'PAST_EOF') {
            entry.suggested = confident ? region : null;
            entry.detail += confident
                ? `; anchors at ${region.start}-${region.end} (score ${region.score})`
                : '; no unambiguous replacement found - needs a human';
        } else if (confident) {
            entry.status = 'MISCITED';
            entry.detail = `cited ${entry.cited} has no anchor support; anchors at ${region.start}-${region.end} (score ${region.score})`;
            entry.suggested = region;
        } else {
            entry.status = 'UNRESOLVED';
            entry.detail = `cited ${entry.cited} unsupported; best match line ${region.start} scores ${region.score} across ${region.peakCount} tied line(s) - too weak to rewrite`;
        }
        results.push(entry);
    }
}

const counts = results.reduce((acc, r) => {
    acc[r.status] = (acc[r.status] ?? 0) + 1;
    return acc;
}, {});

if (FIX) {
    let updated = register;
    let rewritten = 0;

    for (const r of results) {
        if (!r.suggested || !r.cited) continue;
        const range = r.suggested.start === r.suggested.end
            ? `${r.suggested.start}`
            : `${r.suggested.start}-${r.suggested.end}`;
        // Citations are written at varying depths - full repo path in the detail block, often a
        // partial path or bare filename in the summary table. Match on the filename plus the stale
        // line number so every spelling of the same citation is repaired together; otherwise the
        // table keeps a wrong number that the detail block no longer has.
        const base = r.path.split('/').pop().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const pattern = new RegExp('`([A-Za-z0-9_\\-./]*' + base + '):' + r.cited + '(?![0-9-])`', 'g');
        const replaced = updated.replace(pattern, (_full, prefix) => `\`${prefix}:${range}\``);
        if (replaced !== updated) {
            updated = replaced;
            rewritten += 1;
        }
    }

    if (rewritten > 0) writeFileSync(REGISTER, updated, 'utf8');
    console.log(`re-derived ${rewritten} citation(s)`);
}

if (JSON_OUT) {
    console.log(JSON.stringify({ counts, results }, null, 2));
} else {
    const problems = results.filter((r) => r.status !== 'OK');
    for (const r of problems) {
        console.log(`${r.status.padEnd(12)} ${r.rule}  ${r.path}:${r.cited ?? '-'}  ${r.detail}`);
    }
    console.log('');
    console.log(`citations checked: ${results.length}`);
    for (const [k, v] of Object.entries(counts).sort()) console.log(`  ${k.padEnd(12)} ${v}`);
}

// Wrong and unreachable citations always fail — they are machine-decidable.
const failing = results.filter((r) => ['MISCITED', 'PAST_EOF', 'MISSING_FILE'].includes(r.status));

/**
 * UNRESOLVED citations name a real file but no line the script can anchor, so placing them needs a
 * human. Failing on the whole set would make the gate un-greenable and it would simply be disabled.
 * Failing on none of them lets new unanchored citations accumulate unnoticed, which is the drift
 * this script exists to stop. So it is ratcheted against the count measured on 2026-09-02: any NEW
 * unresolved citation fails, the existing ones are carried as declared debt.
 *
 * A drop below the baseline is reported, not auto-accepted. Tracking the current number
 * automatically would mean the ceiling is always whatever today happens to be, which catches
 * nothing — lowering it is a deliberate edit that records the gain.
 */
const UNRESOLVED_BASELINE = 23;
const unresolved = counts.UNRESOLVED ?? 0;

let exitCode = 0;

if (failing.length > 0 && !FIX) {
    console.error('');
    console.error(`FAIL: ${failing.length} citation(s) in analysis/BUSINESS_RULES.md do not resolve.`);
    console.error('Run: node scripts/verify-rule-citations.mjs --fix');
    exitCode = 1;
}

if (!FIX && unresolved > UNRESOLVED_BASELINE) {
    console.error('');
    console.error(`FAIL: ${unresolved} UNRESOLVED citation(s) against a baseline of ${UNRESOLVED_BASELINE}.`);
    console.error(`${unresolved - UNRESOLVED_BASELINE} citation(s) were added without an anchorable line.`);
    console.error('Anchor them, or raise UNRESOLVED_BASELINE with a written rationale.');
    exitCode = 1;
} else if (!FIX && unresolved < UNRESOLVED_BASELINE) {
    console.log('');
    console.log(`NOTE: UNRESOLVED is ${unresolved}, below the baseline of ${UNRESOLVED_BASELINE}.`);
    console.log('Lower UNRESOLVED_BASELINE in scripts/verify-rule-citations.mjs to lock the gain in.');
}

if (exitCode !== 0) {
    process.exit(exitCode);
}
