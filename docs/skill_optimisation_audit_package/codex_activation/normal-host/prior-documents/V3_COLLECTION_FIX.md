# Full-suite collection repair — 17 October 2026

The two pre-existing skills-ref collection errors are resolved.

The active test baseline is now **Python 3.14.7**, pinned in
`skills/writing-skills/scripts/.python-version`. The prior 3.13.11 worktree
environment was upgraded; see
[fresh baseline evidence](v3_python314_test_baseline.json). Earlier 3.13.11
results below are preserved as historical reproduction and compatibility
evidence.

## Cause and minimal fix

`test_prompt.py` and `test_render_graphs.py` annotated helper arguments with
`defusedxml.ElementTree.Element`. That module supplies secure parsing functions
but does not export the stdlib Element class. Python 3.13 evaluates the
annotations at import and raises AttributeError; Python 3.14's deferred
annotations let collection proceed while leaving the invalid types unresolved.

Both helpers now import `Element` from `xml.etree.ElementTree` for their type
annotations. All parsing still uses defusedxml. The SVG helper explicitly
asserts its parsed root is present before accessing it, satisfying the optional
return contract without weakening any artifact assertions.

## Verification

| Check                                          | Observed result                                                            |
| ---------------------------------------------- | -------------------------------------------------------------------------- |
| Original Python 3.13.11 reproduction           | Both collection errors reproduced before the fix                           |
| Original Pyright probe                         | Four errors: two invalid Element attributes and two optional-root accesses |
| Affected tests, Python 3.13.11                 | 49 passed                                                                  |
| Full skills-ref suite, Python 3.13.11          | 203 passed                                                                 |
| Full skills-ref suite, workspace Python 3.14.7 | 203 passed                                                                 |
| Ruff, changed two files                        | All checks passed                                                          |
| Pyright 1.1.414, changed two files             | Zero errors and warnings in both environments                              |
| Independent Python/code review                 | No material findings; secure parsing retained                              |

The existing failing collection is the regression reproduction; no duplicate
test was added merely to assert import spelling. The full tests exercise real
XML round-tripping and Node/Graphviz rendering. No dependency, interpreter,
policy or runtime application change was required.

## Host decision

The user selected Codex as primary for this task and uses Claude Code equally.
Natural activation means a fresh ordinary request leads the actual host to
discover the revised package, read it, apply its instructions and produce the
expected artifact, without naming the skill in the request. The earlier subagent
tests established behavior after explicit loading, not that discovery.

An isolated Codex CLI check is recorded separately. Claude Code remains a
separate acceptance target; the primary-host choice does not establish its
activation. Existing user-installed skills were not overwritten.
