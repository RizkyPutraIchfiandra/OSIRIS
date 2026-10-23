# Testing and Quality Strategy

## First step

Discover the existing test tools and scripts. Do not install another test framework before checking the repository.

## Test layers

### Unit tests
- Source payload normalization.
- Missing or malformed field handling.
- Coordinate validation.
- Freshness calculation.
- Filter and sort logic.
- Deterministic event IDs.
- Error mapping.

### Integration tests
- API route response contract.
- Source adapter behavior using saved fixtures or mocked upstream responses.
- Partial failure when one source is down.
- Caching behavior where testable.

### End-to-end tests
- Application loads.
- User can filter events.
- User can open an event detail.
- Map/list selection sync works if implemented.
- Empty and error states are understandable.
- Mobile navigation and filter interaction work.

## Quality gates

A task is not done merely because code was written. Relevant checks must be run and reported honestly:
- lint
- typecheck
- unit tests
- integration tests
- production build
- targeted manual verification

Only run commands that exist in the actual project. If a check is unavailable, report it as not run and explain why.

## Regression policy

- Add a regression test for each fixed bug when feasible.
- Keep test fixtures representative and free of real secrets.
- Avoid tests that depend on a live third-party API unless explicitly intended as an optional smoke test.
- Do not make CI flaky because an external service is unavailable.

## Accessibility and responsive quality

Check keyboard navigation, visible focus, labels, contrast, mobile layout, reduced motion, and a list alternative for map-only content.

## Performance

Measure before optimizing. Avoid rendering all events/markers at once if volume becomes a demonstrated problem. Use clustering or pagination only when supported by actual needs and the existing map library.
