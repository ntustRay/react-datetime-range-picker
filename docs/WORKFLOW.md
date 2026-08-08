# Autonomous TDD Workflow

This workflow tells a coding agent how to move from the product contract to a
completed Version 1 without losing the agreed behavior, test discipline, or
progress state. It is an execution loop, not authorization to change product
scope, publish npm packages, or push to GitHub.

## Sources of Truth

Read these files at the beginning of every run, in this order:

1. [`../AGENTS.md`](../AGENTS.md) for repository rules.
2. [`CONTEXT.md`](CONTEXT.md) for domain language and product behavior.
3. [`TODO.md`](TODO.md) for remaining coverage and ordering.
4. [`../README.md`](../README.md) for the current public project status.
5. The current source, tests, package configuration, and Git diff.

When files disagree, stop before writing code. Product behavior in
`CONTEXT.md` wins over a stale TODO. Higher-level agent instructions win over
this workflow.

## Confirmed Test Seams

Tests may observe behavior only through these user-confirmed seams:

1. Public TypeScript exports.
2. Public timestamp normalization and range-validation functions.
3. The rendered controlled React picker.
4. The packed npm artifact installed by a clean consumer.
5. Browser-visible workflows exercised through the demo application.

Do not add another seam without user confirmation. Do not test private
functions, internal module calls, hook implementation, or React state.

## Requirement Clarity Gate

Before selecting work, classify every requirement involved in the next slice:

- **Clear**: `CONTEXT.md` gives one observable answer.
- **Discoverable**: repository state or official tool documentation gives one
  answer; inspect it instead of asking.
- **Conservative implementation choice**: multiple internal solutions preserve
  the same public behavior; choose the smallest one and record no new contract.
- **Product decision**: alternatives change public API, observable behavior,
  accessibility, compatibility, or published output; stop and ask one focused
  question with a recommendation.

Never convert a product decision into an implementation assumption. Current
known product decisions that must be resolved before their dependent slice are:

- Final public prop, callback, and validation-error names.
- The responsive container threshold and initial visual design tokens.
- npm publishing and trusted-publishing behavior.

These do not block unrelated foundation or domain slices.

## Select the Next Slice

Choose exactly one slice using this order:

1. Fix a failing existing check before adding behavior.
2. Finish an already-started RED test before selecting new work.
3. Select the earliest unchecked TODO whose prerequisites are complete.
4. Prefer a thin end-to-end capability over completing an internal layer.
5. Prefer the smallest slice that produces one observable behavior.

A valid slice has:

- one behavior statement;
- one confirmed seam;
- one primary failing test;
- known prerequisites;
- a focused verification command;
- no unresolved product decision.

If a TODO is too large, split it into smaller adjacent checkboxes before
writing the test. Do not mark the parent complete until all child behavior is
green.

## The Loop

Run this loop until the Version 1 definition of done is complete or a stop
condition is reached:

```text
while Version 1 is not complete:
    refresh repository state and read the sources of truth
    repair any failed existing check
    select one eligible vertical slice
    pass the requirement clarity gate
    RED: write one failing test at a confirmed seam
    RED: run it and confirm the expected reason for failure
    GREEN: write the minimum production code needed to pass
    GREEN: run the focused test and related checks
    REVIEW: simplify without changing behavior
    VERIFY: run the proportional verification gate
    RECORD: update TODO.md and affected documentation
    INSPECT: review status and diff for scope and secrets
    COMMIT: create one focused commit when commits are authorized
```

Never perform several RED steps followed by several GREEN steps. Complete one
vertical slice before selecting the next.

## RED

1. Express the missing behavior in consumer language.
2. Choose the narrowest confirmed seam that proves it.
3. Use a known literal, specification example, or independently worked result.
4. Write one focused test with one logical behavioral assertion.
5. Run only that test or the smallest supported test target.
6. Observe failure.
7. Confirm the failure message points to missing behavior.

If the test passes immediately, it is not a valid RED step. Determine whether
the behavior already exists, the assertion is insensitive, or the test uses
the wrong seam. Do not weaken an expectation merely to manufacture a failure.

## GREEN

1. Write only enough production code to satisfy the RED test.
2. Follow existing architecture and naming.
3. Do not add optional fields, helpers, abstractions, or branches for future
   TODO items.
4. Do not use `any` or assertions to hide type problems.
5. Use `unknown` and validation at external boundaries.
6. Run the focused test until green.
7. Run the nearest related test group.

When green requires a large change, stop and shrink the slice. A test that can
only pass after implementing several independent behaviors is too broad.

## Review and Refactor

Refactoring happens only after green:

1. Remove duplication introduced by the completed slice.
2. Improve names using the vocabulary in `CONTEXT.md`.
3. Remove accidental public exports.
4. Remove unused branches and speculative configuration.
5. Keep tests at public seams.
6. Run the focused and related tests after each meaningful refactor.

Do not combine unrelated cleanup with the slice. A large architectural change
requires its own reviewed plan and must not hide inside refactoring.

## Verification Gate

Run the smallest useful checks after every slice. As scripts become available,
use this progression:

1. Focused unit, component, compile-time, or E2E test.
2. Related test file or project.
3. Typecheck for changed TypeScript surfaces.
4. Build for package/export changes.
5. E2E for browser-visible interaction changes.
6. `npm.cmd run check` when a coherent milestone is complete.
7. `npm pack --dry-run` for package-surface changes.

Build the current source before E2E; never allow E2E to run against a stale
artifact. If a required check cannot run, record why and do not mark its TODO
complete.

## Test Quality Gate

Reject a test when any answer below is yes:

- Does it inspect a private function or internal state?
- Does it mock a module owned by this package?
- Does it assert internal call order instead of observable behavior?
- Does it calculate the expected value with the algorithm under test?
- Would a behavior-preserving refactor break it?
- Does it contain several independent behaviors?
- Is a snapshot hiding the behavior that should be asserted explicitly?

Mock only real boundaries. The expected regular boundary is the current clock
for deterministic relative presets. Prefer real `Intl`, DOM, and internal
modules unless a demonstrated platform limitation requires a boundary.

## TODO Accounting

`TODO.md` is the progress ledger:

- Change `[ ]` to `[x]` only after behavior and required verification pass.
- Never mark a test TODO complete because test code exists; it must pass for the
  intended reason.
- Add a child TODO when implementation reveals a missing edge case.
- Add new product behavior to `CONTEXT.md` only after user agreement.
- Remove a TODO only when it is a proven duplicate; explain the removal in the
  commit.
- Keep deferred npm publication tasks unchecked until explicitly authorized.

At the end of a run, report completed TODO items, checks run, current failures,
the next eligible slice, and any decision needed from the user.

## Git Discipline

Before a commit:

1. Run `git status -sb`.
2. Inspect the complete diff.
3. Confirm every changed file belongs to the slice.
4. Run `git diff --check`.
5. Run the proportional verification gate.
6. Stage only intended paths.
7. Inspect `git diff --staged`.
8. Use a terse commit message describing the behavior.

Do not commit, push, open a pull request, create a release, or publish npm
without authority in the active user request. Never include unrelated working
tree changes.

## Stop Conditions

Stop the loop and report clearly when:

- a product decision is unresolved;
- source-of-truth documents conflict;
- the same required check fails after focused diagnosis and a reasonable fix;
- a dependency or platform limitation threatens an agreed requirement;
- completing the slice requires expanding public scope;
- unrelated user changes overlap the files needed by the slice;
- credentials, external publication, or destructive action needs new authority;
- the remaining work is npm publication and it has not been authorized.

Do not stop merely because the backlog is large. Continue slice by slice while
safe, authorized, unambiguous work remains.

## Completion Gate

Version 1 is complete only when:

1. Every item under `Definition of Done for Version 1` is checked.
2. No required earlier TODO remains unchecked unless explicitly moved to a
   documented later release.
3. The clean-install full check passes.
4. The packed artifact passes React 18 and React 19 consumer verification.
5. Documentation matches observable behavior.
6. `git status -sb` shows no unintended change.
7. npm publication remains a separate, explicitly authorized action.
