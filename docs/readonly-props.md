# Bulk read-only React props

Run these commands from the repository root with dependencies installed:

```powershell
# Preview; does not change files
node scripts/readonly-props.mjs

# Apply after checking clean target files and whole-project TypeScript compatibility
node scripts/readonly-props.mjs --write

# Limit a preview or write to tracked files within a directory
node scripts/readonly-props.mjs --write ClientApp/src/components/Buttons

# Check for candidates without writing (nonzero when work remains)
node scripts/readonly-props.mjs --check

# Report the stricter ESLint parameter rule; does not change files
node scripts/readonly-props.mjs --audit-parameters

# Run the tooling regression tests
node --test scripts/readonly-props.test.mjs
```

## What the fix does

The TypeScript syntax tree identifies PascalCase functions returning JSX and
anonymous default exports, including explicitly typed callbacks inside wrappers
such as `memo` and `forwardRef`. It wraps only the first parameter's annotation:

```tsx
function Welcome(props: Readonly<Props>) {
  return <div>{props.name}</div>;
}
```

Destructured props, generic props, intersection types and default values work
too. Existing `Readonly<T>` annotations and inline types with only readonly
members are skipped. The tool changes annotation spans only; it preserves
comments, line endings and runtime code. It does not change shared interfaces or
generated API types. No dependencies, lint configuration or package scripts are
added.

Detection is conservative, **not an implementation of Sonar's S6759 analyzer**.
It can miss components returning variables, `null`, strings, or `createElement`,
and other indirect component definitions. Contextually typed props such as
`const Card: FC<Props> = (props) => ...`, explicit `any`/`unknown`, rest
parameters and shadowed `Readonly` declarations are reported for manual review.
Type aliases already resolving to readonly properties may receive a redundant
wrapper. Rerun SonarQube/SonarLint to verify complete S6759 coverage; `--check`
only checks this tool's supported patterns.

## Upstream and downstream effects

`Readonly<Props>` restricts assignment to top-level properties inside the
component. It does not freeze an object at runtime, make nested arrays
immutable, or by itself prevent React rerenders. Ordinary mutable parent objects
remain valid inputs. Callback signatures, nested DTOs and library-owned state
remain unchanged. The fixture tests check caller compatibility and identical
emitted JavaScript for representative transformations.

The write command requires both the current project and the proposed project to
type-check. The proposed contents are checked in memory across the full
`tsconfig.json`, including consumers, before any file is written. Assignments
such as `props.name = 'new name'` are therefore rejected before writing. Resolve
those assignments by fixing ownership (for example local state or a callback),
not by casting away readonly. A successful type-check is not a proof of deep
immutability: aliases, casts and calls to mutating helpers still need review.

The command uses tracked handwritten `ClientApp/src/**/*.tsx` files, excluding
vendor mirrors, parent packages, stories and test files. It refuses staged or
unstaged changes in files it would edit, symlinked props source files, and
changes made during validation. Existing errors anywhere in the project block
write mode; preview remains available. Ordinary write failures restore files
already touched; this is not a crash-proof filesystem transaction. Review the
Git diff afterward.

## The two rules are different

[Sonar S6759](https://rules.sonarsource.com/typescript/RSPEC-6759/) concerns
React props.
[TypeScript's Readonly utility](https://www.typescriptlang.org/docs/handbook/utility-types.html#readonlytype)
is shallow. By contrast,
[prefer-readonly-parameter-types](https://typescript-eslint.io/rules/prefer-readonly-parameter-types/)
checks nested objects, array elements, tuple elements and function parameters
throughout the codebase. This repository already enables that ESLint rule.

For example, `Readonly<{ items: string[] }>` still contains a mutable array and
does not satisfy the deeper rule. `Readonly<{ items: readonly string[] }>` can,
but passing that array to a function requiring `string[]` may fail. Propagate
readonly input types through genuinely read-only consumers, or deliberately copy
an array at a mutation boundary. Do not blindly deep-wrap Formik values, React
events, mutable refs, API model instances or third-party callback contracts.

`--audit-parameters` uses the installed ESLint configuration and prints those
findings for tracked handwritten app `.ts` and `.tsx` files, including app
stories and tests. It reports fatal parser errors as failures. It does not
auto-fix this deeper rule or claim to cover root configs and the separate
`tests` directory; use `npm run lint` for the repository's full configured
scope.

## Validation and exit codes

After applying, format only the touched files with the installed Prettier,
inspect the diff, then run `npm run type-check`, `npm run lint`, the relevant
unit and Storybook tests, and a new Sonar analysis. Follow the repository's
Storybook MCP workflow when reviewing or modifying components. Existing
unrelated findings are not suppressed by this tool.

- `0`: preview completed, check found no supported candidates, or write
  completed without reported manual-review items.
- `1`: check found candidates/manual-review items, parameter audit found
  findings, or write completed with manual-review items remaining.
- `2`: invalid arguments or safety/validation failure. Validation failures
  happen before writing.

The script is standalone; it does not alter existing CI or lint policy. Use Git
to review and selectively revert only the annotation edits if a batch is
unwanted.
