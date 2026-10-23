# API and External Data Integration Rules

## Integration strategy

1. Audit existing adapters and API routes.
2. Reuse working integrations if their license, behavior, and quality are acceptable.
3. Add one new source at a time.
4. Keep upstream requests server-side when credentials or provider restrictions require it.
5. Normalize at the boundary.
6. Return a consistent application-level response shape.

## API response envelope (proposal)

```ts
interface ApiResult<T> {
  data: T;
  meta: {
    fetchedAt: string;
    sourceId?: string;
    stale?: boolean;
    partial?: boolean;
  };
  error?: {
    code: string;
    message: string; // safe user-facing message
  };
}
```

Do not introduce this envelope if the repository already has a consistent contract. Prefer extending existing contracts.

## Adapter responsibilities

- Make a request to a documented public endpoint.
- Apply timeout and reasonable retry behavior where supported.
- Respect provider rate limits and terms.
- Validate status code and payload shape.
- Normalize source-specific data into the canonical model.
- Attach fetch timestamp and source identity.
- Map provider failures to safe, predictable errors.
- Avoid logging tokens, full authorization headers, or sensitive request parameters.

## Frontend responsibilities

- Consume the application's API contract, not undocumented third-party APIs directly.
- Show loading, empty, stale, and error states.
- Avoid exposing secrets or provider-only headers.
- Cancel obsolete requests where the existing framework supports it.
- Do not repeatedly poll faster than the source permits.

## Data-source selection checklist

Before adding a source, document:
- Does it provide data useful to the Indonesia-first product?
- Is the endpoint official or otherwise trustworthy?
- Is public use permitted by terms and license?
- Is attribution required?
- Is an API key needed?
- What are the rate limits?
- How frequently does data update?
- Are timestamps and coordinates available?
- What happens when the source is unavailable?
- Can this source be tested with a saved fixture?

## Live-data honesty

Never label an integration “real-time” solely because the UI refreshes. The actual source update cadence and ingestion delay must be understood. Use labels such as “latest available” when true real-time delivery cannot be established.
