# Product Requirements

## User stories

### Overview
- As a user, I can understand the current state of selected data sources at a glance.
- As a user, I can distinguish live/recent, stale, unavailable, and demo data.
- As a user, I can move from an overview metric to the underlying events.

### Event exploration
- As a user, I can filter events by category, region, and time range.
- As a user, I can search events by available text fields.
- As a user, I can sort events by event time or last update.
- As a user, I can open a detail view without losing my current filters.
- As a user, I can see a useful empty state when no events match.

### Map
- As a user, I can toggle supported layers.
- As a user, I can select a marker and see the corresponding event.
- As a user, I can distinguish event categories visually without relying on color alone.
- As a user, I can understand when a layer is unavailable or contains stale data.

### Source transparency
- As a user, I can open the original source.
- As a user, I can see event time separately from fetched/updated time.
- As a user, I can understand limitations or missing fields.
- As a user, I can see a source's last successful update and current error status where available.

## MVP requirements

P0:
- App runs with documented commands.
- Responsive navigation and application shell.
- Overview page.
- Unified event model.
- At least one working source adapter; target two after the first vertical slice is stable.
- Event list and detail.
- Map integration reusing existing capability where possible.
- Filters for category, time, and supported region.
- Source provenance and freshness metadata.
- Loading, empty, stale, and error states.
- No exposed secrets.
- Basic tests for normalization and filtering.

P1:
- Timeline chart.
- Region comparison.
- Export filtered events as CSV/JSON if safe and appropriate.
- Improved keyboard navigation and accessibility.
- Source status page.

P2:
- AI intelligence brief with citations to input events/sources.
- Saved filters.
- Optional alerts.

## UX behavior requirements

- Filters must be reflected in all relevant views, not just the visible list.
- Reset filters must restore a predictable default.
- Loading must not be confused with an empty result.
- Errors must be actionable and must not reveal secrets or stack traces to end users.
- Stale data must not be labelled live.
- Dates must show a clear timezone or local-time convention.
- Map marker selection and list selection should stay synchronized when feasible.
- Mobile layout must preserve core functionality, not merely shrink desktop UI.

## Product analytics

Do not add invasive tracking by default. If analytics are later needed, document the data collected, purpose, retention, and consent requirements.
