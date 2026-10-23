# Prompt — Repository Audit

Read `docs/ai/README.md`, `docs/ai/01_AGENT_START_HERE.md`, `docs/ai/00_PROJECT_BRIEF.md`, `docs/ai/02_REPO_AUDIT.md`, and `docs/ai/13_TASK_BOARD.md`.

Task: perform Phase 0 repository audit only.

Rules:
- Do not implement features or refactor.
- Inspect the actual checkout and preserve user changes.
- Verify the framework, package manager, scripts, routing, UI, map, API routes, source adapters, tests, deployment, environment-variable conventions, and license.
- Never expose secret values.
- Do not assume any proposed path in the documentation already exists.
- Run only safe, relevant baseline commands and record actual outcomes.

Create or update `docs/ai/REPO_AUDIT_REPORT.md` using the required structure in `02_REPO_AUDIT.md`. Update `13_TASK_BOARD.md` only for tasks supported by evidence. Report unknowns and blockers explicitly.

At the end, provide:
1. Verified stack.
2. Actual commands and results.
3. Important existing files/modules.
4. Main risks.
5. A minimal file-level plan for NW-005.
Do not begin implementation.
