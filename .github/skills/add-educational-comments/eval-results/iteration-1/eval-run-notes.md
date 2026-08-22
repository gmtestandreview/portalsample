# Eval Run Notes

## What was run

This iteration ran executable offline package-level evals comparing:

- Previous packaged full skill: `/mnt/data/current_pack_inspect/add-educational-comments-download-pack/add-educational-comments/SKILL.md`
- Revised slim skill: `/mnt/data/add-educational-comments-v2-pack/add-educational-comments/SKILL.md`

The evals checked:

1. Static structure and progressive-disclosure requirements.
2. Trigger-prompt proxy behavior from `evals/trigger-evals.json`.
3. Old-vs-new benchmark aggregation.

## Limitation

This was not a live autonomous-agent execution benchmark. No subagent was spawned and no real source files were edited. The results are objective for package structure and trigger-boundary text coverage, but a live agent harness is still needed to measure real activation rates, output quality, timing, and token usage.

## Results

| Eval | Previous | Revised |
|---|---:|---:|
| Static checks | 1/12 | 12/12 |
| Trigger proxy | 6/12 | 12/12 |
| Combined | 7/24 | 24/24 |

## Key Improvements

- `SKILL.md` reduced from 657 lines to 216 lines.
- Examples, validation matrix, regression details, Fetch List handling, file-classification detail, and extended gotchas moved into `references/` or `assets/`.
- `compatibility` frontmatter added.
- `trigger-evals.json` added with positive triggers and near-miss negatives.
