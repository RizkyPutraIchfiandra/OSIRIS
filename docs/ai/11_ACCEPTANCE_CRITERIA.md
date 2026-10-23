# Acceptance Criteria and Definition of Done

## Global definition of done

A task is complete only when:
- The stated behavior exists in the actual application.
- Acceptance criteria have been checked.
- Relevant automated checks were run and results reported.
- No unrelated user changes were overwritten.
- Documentation and task status are updated.
- Known limitations are explicit.

## MVP acceptance criteria

### Application shell
- [ ] App starts with documented commands.
- [ ] Product name and visual system are consistent.
- [ ] Navigation works at desktop and mobile widths.
- [ ] Upstream credits are present.

### Data
- [ ] At least one real, permitted public source works.
- [ ] Event data is validated and normalized.
- [ ] Event time and fetch time are separate.
- [ ] Source attribution and source URL are shown where available.
- [ ] Missing data is not fabricated.
- [ ] Stale and failed sources are clearly represented.

### Explorer
- [ ] Category filter works.
- [ ] Time filter works according to a documented timezone rule.
- [ ] Region filter works for supported data.
- [ ] Clear/reset behavior works.
- [ ] Empty state works.
- [ ] Error state works.
- [ ] Event detail works.

### Map
- [ ] Markers derive from normalized data.
- [ ] Invalid coordinates are excluded safely.
- [ ] Marker/list selection is synchronized if specified.
- [ ] Map has a non-map alternative list.
- [ ] Map/data loading failures are communicated.

### Quality
- [ ] Relevant tests pass or pre-existing failures are documented.
- [ ] Lint/typecheck/build results are recorded.
- [ ] No secret values are committed.
- [ ] README includes setup, sources, attribution, limitations, and screenshots.
- [ ] App does not call demo content “live”.

## Per-task acceptance template

Task:
User-visible result:
Files/modules expected:
Acceptance criteria:
Tests to run:
Risks:
Out of scope:
