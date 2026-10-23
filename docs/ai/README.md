# NusaWatch — AI Handoff Pack

This documentation pack guides an AI coding agent (DeepSeek V4.1 Flash or another coding model) while adapting the OSIRIS repository into **NusaWatch**, an Indonesia-focused, public-data situational-awareness dashboard.

## First rule

**Do not start coding immediately.** Inspect the actual repository first. The repository is the source of truth for its framework, scripts, file paths, APIs, conventions, and license. Some paths and technologies mentioned in this pack are conceptual until verified.

## Start here, in order

1. `00_PROJECT_BRIEF.md` — product definition and boundaries.
2. `01_AGENT_START_HERE.md` — mandatory first-session instructions.
3. `02_REPO_AUDIT.md` — repository reconnaissance checklist.
4. `03_PRODUCT_REQUIREMENTS.md` — MVP scope and user stories.
5. `04_ARCHITECTURE.md` — target architecture principles.
6. `05_UI_UX_GUIDELINES.md` — visual and interaction requirements.
7. `06_DATA_CONTRACTS.md` — canonical event model and source provenance.
8. `07_API_AND_INTEGRATION.md` — integration rules.
9. `08_SECURITY_PRIVACY_LICENSE.md` — safety, privacy, secrets, and attribution.
10. `09_TESTING_AND_QUALITY.md` — test strategy and completion gates.
11. `10_IMPLEMENTATION_ROADMAP.md` — phased work plan.
12. `11_ACCEPTANCE_CRITERIA.md` — definition of done.
13. `12_DECISION_LOG.md` — record decisions; update when decisions change.
14. `13_TASK_BOARD.md` — current task and status.
15. `14_CHANGELOG.md` — meaningful implementation history.
16. `15_PROMPTS/` — reusable prompts for audit, implementation, review, and debugging.

## How to use with DeepSeek

- Put this folder in the repository as `docs/ai/` (recommended), or attach/paste the relevant files into the coding environment.
- If the model supports project rules or persistent instructions, point it to `docs/ai/01_AGENT_START_HERE.md` and `docs/ai/00_PROJECT_BRIEF.md`.
- Keep the documents available in the context window. If the model cannot read the whole folder, instruct it to read `README.md`, `01_AGENT_START_HERE.md`, `00_PROJECT_BRIEF.md`, `13_TASK_BOARD.md`, and only the relevant technical docs for the current task.
- Ask it to work on **one milestone or one small task at a time**.
- Require it to update `13_TASK_BOARD.md`, `14_CHANGELOG.md`, and `12_DECISION_LOG.md` when applicable.

## Truth labels

Every repository-specific statement must be marked mentally (or in documentation) as one of:
- **Verified** — inspected in the current checkout.
- **Proposed** — target design, not yet implemented.
- **Unknown** — must be investigated.

Do not let the agent turn proposed designs into claims about existing code.
