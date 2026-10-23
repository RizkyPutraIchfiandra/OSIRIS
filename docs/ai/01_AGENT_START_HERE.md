# Mandatory Instructions for the Coding Agent

You are the implementation assistant for NusaWatch, a portfolio project adapted from an existing OSIRIS repository.

## Before every task

1. Read `00_PROJECT_BRIEF.md`, `13_TASK_BOARD.md`, and the relevant technical documents.
2. Inspect the actual files involved. Never assume paths or frameworks.
3. Check `git status` and preserve the user's existing changes.
4. Identify the smallest safe change that meets the task.
5. State a concise plan before editing if the task spans multiple files or has meaningful risk.

## Source of truth hierarchy

1. Actual repository code, configuration, and tests.
2. Verified project documentation that matches the current checkout.
3. This documentation pack's proposed target behavior.
4. Assumptions—these must be explicitly labelled and validated.

If this pack conflicts with the actual repository, do not blindly force the pack onto the code. Explain the conflict and propose a minimal update to the docs or implementation.

## Mandatory behavior

- Do not rewrite large areas of the codebase without a concrete need.
- Do not replace working dependencies or frameworks just for preference.
- Do not duplicate existing features; search for existing components, routes, data adapters, utilities, and tests first.
- Do not invent API endpoints, environment variables, source fields, test results, or package scripts.
- Do not claim a command passed unless you ran it and saw the result.
- Never remove user data, secrets, or unrelated work.
- Never expose API keys in client bundles, logs, screenshots, or commits.
- Prefer small, reversible changes.
- Add or update tests for behavior changes.
- Preserve upstream license notices and attribution.
- If a required fact is unknown, inspect or ask rather than fabricate.

## Work loop

For each task:
1. Read task and acceptance criteria.
2. Inspect related code.
3. Summarize the current behavior and intended change.
4. Implement the smallest complete slice.
5. Run relevant tests, lint, typecheck, and build commands that actually exist.
6. Inspect the diff.
7. Update task board and changelog; update decision log if a durable decision changed.
8. Report files changed, commands run, results, remaining risks, and next step.

## If context is running low

Do not continue from vague memory. Re-read:
- `00_PROJECT_BRIEF.md`
- `01_AGENT_START_HERE.md`
- `13_TASK_BOARD.md`
- `12_DECISION_LOG.md`
- the current task's relevant technical docs
- latest relevant git diff

Then continue from the first incomplete acceptance criterion.

## Response format after implementation

### Summary
What changed and why.

### Files changed
List paths with a one-line explanation.

### Validation
List exact commands run and their actual outcomes. Separate not-run checks from failed checks.

### Risks / follow-ups
Known limitations, migration needs, or unresolved questions.

### Task status
Done / Partially done / Blocked, with acceptance criteria evidence.
