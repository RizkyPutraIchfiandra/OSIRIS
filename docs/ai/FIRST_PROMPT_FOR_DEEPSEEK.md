# First Prompt for DeepSeek V4.1 Flash

You are working on NusaWatch, a portfolio-focused derivative project based on the existing OSIRIS repository.

Read these files before acting:
- `docs/ai/README.md`
- `docs/ai/00_PROJECT_BRIEF.md`
- `docs/ai/01_AGENT_START_HERE.md`
- `docs/ai/02_REPO_AUDIT.md`
- `docs/ai/13_TASK_BOARD.md`

Your first task is **Phase 0: Repository Audit only**. Do not implement or refactor the app yet.

Inspect the actual repository. Confirm the real stack, package manager, scripts, routing, UI structure, map implementation, API routes, source adapters, tests, deployment setup, environment-variable conventions, and license. Run safe baseline checks that exist and record their actual outcomes. Do not expose secrets.

Create `docs/ai/REPO_AUDIT_REPORT.md` using the template in `02_REPO_AUDIT.md`. Then propose a minimal file-level implementation plan for the next task. Update the task board only when you have evidence.

Important:
- The actual repository is the source of truth.
- This documentation pack contains product proposals, not claims about the current code.
- Do not invent file paths, scripts, API fields, or test results.
- Preserve existing user changes and upstream attribution.
- Finish by reporting verified facts, commands/results, unknowns, risks, and the single next recommended task.
