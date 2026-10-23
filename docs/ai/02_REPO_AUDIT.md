# Repository Audit Checklist

## Goal

Build a verified map of the existing OSIRIS project before making structural changes.

## Required inspection

- [ ] Confirm current branch and `git status`.
- [ ] Read root README and license files.
- [ ] Inspect package/dependency manifests and lockfile.
- [ ] Identify framework, language, build tool, package manager, and runtime versions.
- [ ] Identify development, lint, typecheck, test, and build commands.
- [ ] Map application entry points and routing conventions.
- [ ] Find existing layout, navigation, theme, map, charts, cards, and event components.
- [ ] Find all API routes, data-source adapters, fetch utilities, caching, and rate-limit handling.
- [ ] Find environment-variable templates and identify which values are server-only.
- [ ] Identify storage/database usage, if any.
- [ ] Identify existing tests and CI workflows.
- [ ] Check deployment configuration.
- [ ] Check upstream license, attribution requirements, and third-party asset licenses.
- [ ] Run the app using documented instructions if feasible.
- [ ] Run existing checks before changes to establish a baseline.

## Required output

Create `docs/ai/REPO_AUDIT_REPORT.md` containing:

1. **Verified stack** — exact tools and versions where visible.
2. **Commands** — exact working commands.
3. **Directory map** — only meaningful paths, with real paths from the checkout.
4. **Existing capabilities** — supported by code references.
5. **Data-source inventory** — source name, implementation path, fields, update method, key requirement, and failure behavior.
6. **Quality baseline** — checks run, pass/fail, and known warnings.
7. **Risk list** — secrets, brittle integrations, outdated dependencies, duplicated logic, license questions.
8. **Recommended extension points** — real files/modules to extend.
9. **Unknowns** — items not yet verified.

## Rules

- Do not claim a feature exists because it appears in a screenshot or marketing text.
- Do not print secret values into the audit report.
- Never include `.env` contents. Record variable names only, and only when safe.
- If an external API cannot be tested, record that limitation rather than treating it as broken.
- Do not refactor during the audit unless a minimal change is necessary to make the app run. Audit first, refactor later.

## Baseline report template

| Check | Command | Result | Notes |
|---|---|---|---|
| Install | actual package manager command | Not run | |
| Dev server | actual script | Not run | |
| Lint | actual script | Not run | |
| Typecheck | actual script | Not run | |
| Tests | actual script | Not run | |
| Build | actual script | Not run | |
