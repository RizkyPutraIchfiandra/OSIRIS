# Prompt — Debug Without Guessing

Investigate the reported failure before changing code.

1. Capture the exact error, command, and reproduction steps.
2. Inspect the relevant code and configuration.
3. Identify at least one evidence-backed root-cause hypothesis.
4. Distinguish the root cause from symptoms.
5. Make the smallest targeted fix.
6. Add a regression test where feasible.
7. Rerun the failing command and related checks.
8. Report actual results and any remaining uncertainty.

Do not rewrite the module, change frameworks, disable checks, or suppress errors without evidence. Never paste secrets into logs or reports.
