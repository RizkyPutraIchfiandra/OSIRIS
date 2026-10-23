# Prompt — Add One Public Data Source

Add exactly one source adapter for the requested public data source.

Before implementation, verify:
- Official API documentation and permitted use.
- Attribution and license.
- Authentication requirements and safe environment-variable names.
- Rate limits, update cadence, and timezone semantics.
- Actual response schema using documentation or a safe fixture.
- Existing adapter and normalization conventions.

Implement:
1. Server-side adapter following existing patterns.
2. Payload validation.
3. Normalization to the project's canonical event type.
4. Safe timeout/error mapping and caching if appropriate.
5. Source metadata and freshness behavior.
6. Fixture-based tests for valid, empty, malformed, and error responses.
7. Documentation of source limitations.

Do not invent fields or call data real-time without evidence. Do not expose keys to the client. If terms or schema cannot be verified, stop and report the blocker instead of guessing.
