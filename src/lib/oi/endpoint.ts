/**
 * The base URL of a visitor's own OpenAI-compatible endpoint.
 *
 * This module is browser-safe: the panel validates what is typed before it
 * sends anything, and the server re-checks the same rules on the way in. It
 * only checks the shape here. Whether the host may actually be reached is a
 * network question, answered on the server by `safeFetch` (SSRF guard), which
 * blocks loopback, private and reserved addresses on every hop.
 */

/** A URL longer than this is not a base URL: it is a mistake or an attack. */
export const CUSTOM_BASE_MAX = 2048;

export type CustomBase = { ok: true; url: string } | { ok: false; error: string };

/** `https://api.example.com/v1/` → `https://api.example.com/v1`, with the rules applied. */
export function validateCustomBase(input: unknown): CustomBase {
  if (typeof input !== 'string' || !input.trim()) return { ok: false, error: 'Enter the endpoint URL.' };
  const raw = input.trim();
  if (raw.length > CUSTOM_BASE_MAX) return { ok: false, error: 'That URL is too long.' };
  // The URL parser silently resolves "..", so reject the raw form rather than
  // quietly pointing the base at a different path than the visitor typed.
  if (raw.includes('..')) return { ok: false, error: 'The endpoint URL has an invalid path.' };

  let parsed: URL;
  try {
    parsed = new URL(raw);
  } catch {
    return { ok: false, error: 'That is not a valid URL. Include https:// and the host.' };
  }

  if (parsed.protocol !== 'https:') return { ok: false, error: 'The endpoint must use HTTPS.' };
  if (parsed.username || parsed.password) return { ok: false, error: 'Do not put a key or password in the URL.' };
  if (parsed.search || parsed.hash) return { ok: false, error: 'The endpoint URL cannot have a query or fragment.' };
  if (!parsed.hostname) return { ok: false, error: 'That URL has no host.' };

  const host = parsed.hostname.toLowerCase();
  if (host === 'localhost' || host.endsWith('.localhost') || host.endsWith('.local') || host.endsWith('.internal')) {
    return { ok: false, error: 'The endpoint must be a public host, not a local one.' };
  }
  // The base is exactly what the visitor typed, minus trailing slashes; the
  // provider calls append /chat/completions and /models to it.
  const path = parsed.pathname.replace(/\/+$/, '');
  return { ok: true, url: `${parsed.origin}${path}` };
}
