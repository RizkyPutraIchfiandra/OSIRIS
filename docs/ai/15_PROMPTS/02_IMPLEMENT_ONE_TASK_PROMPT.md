# Prompt — Implement One Task

Implement only the approved task and its acceptance criteria.

Rules:
- Follow `01_AGENT_START_HERE.md`.
- Inspect current code before editing.
- Prefer the smallest complete vertical slice.
- Reuse existing components and patterns.
- Avoid unrelated refactors and dependency additions.
- Add/update tests for behavior changes.
- Keep source attribution and safe secret handling.
- Do not invent API behavior or claim unrun checks passed.

After implementation:
1. Run relevant tests, lint, typecheck, and build commands that exist.
2. Review the full diff for regressions and accidental changes.
3. Update `13_TASK_BOARD.md` and `14_CHANGELOG.md`.
4. Update `12_DECISION_LOG.md` only if a durable decision changed.
5. Report files changed, actual validation results, limitations, and the next task.

If a test fails, diagnose it. Do not weaken or delete tests merely to obtain a passing result.
