# Prompt — End-of-Session Handoff

Prepare the project for a fresh model/context window.

1. Update `13_TASK_BOARD.md` with accurate task statuses.
2. Add a truthful entry to `14_CHANGELOG.md`.
3. Update `12_DECISION_LOG.md` if a durable decision changed.
4. Record unresolved issues and exact reproduction steps.
5. Record commands run and actual pass/fail outcomes.
6. Identify the current branch and relevant changed files without exposing secrets.
7. Write a short handoff summary in `docs/ai/NEXT_SESSION.md` containing:
   - Project/milestone
   - What is done
   - What is in progress
   - Known failures/blockers
   - Files to inspect first
   - The single next recommended task
   - Acceptance criteria for that task

Do not mark tasks done without evidence. Do not include the full conversation; preserve only actionable project state.
