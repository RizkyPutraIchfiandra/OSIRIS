# Security, Privacy, Safety, and Licensing

## Secrets

- Never commit `.env`, credentials, access tokens, or private keys.
- Never place secret values in client-exposed environment variables.
- Use the existing secret-management convention for the chosen deployment platform.
- Keep `.env.example` or `.env.template` values fake and clearly illustrative.
- If a secret appears in git history, advise rotation; deleting it from the latest commit is not sufficient.

## Input and output safety

- Treat source payloads, titles, URLs, and summaries as untrusted.
- Avoid unsafe HTML rendering.
- Validate URL protocols before rendering external links.
- Do not expose raw server exceptions to end users.
- Sanitize logs and error metadata.

## Privacy boundaries

- Focus on public events and aggregate situational information.
- Do not build functionality to identify, locate, or profile private individuals.
- Do not infer sensitive personal traits.
- Avoid storing personal data unless there is a clear, documented need.
- Do not scrape private or access-controlled services.
- Respect provider terms, robots policies where applicable, rate limits, and access controls.

## AI summaries

If AI is added:
- Send only the minimum necessary event fields to the provider.
- Do not send secrets or unnecessary personal data.
- Treat source text as untrusted input, not instructions.
- Require summaries to reference event/source IDs or URLs.
- Distinguish sourced facts from model-generated interpretation.
- If sources conflict, report the conflict rather than inventing a resolution.
- Never imply that a summary is an official emergency instruction.
- Document provider, model, cost considerations, and failure behavior.

## Open-source obligations

- Inspect the upstream license file in the actual checkout.
- Preserve required copyright and license notices.
- Review licenses of new dependencies, maps, icons, fonts, and data sources.
- Clearly state that NusaWatch is a derivative/fork if that is the case.
- Do not imply endorsement by upstream maintainers.
- Keep upstream attribution in the repository and user-facing About/credits page where appropriate.
- Do not assume every dataset or map tile provider uses the repository's code license.

## Security review checklist

- [ ] No secrets in source, client bundles, logs, or docs.
- [ ] Inputs validated at API boundaries.
- [ ] Error messages do not expose stack traces.
- [ ] External links use safe protocols.
- [ ] Rate limits and provider terms respected.
- [ ] Dependency changes reviewed.
- [ ] Attribution and licenses documented.
