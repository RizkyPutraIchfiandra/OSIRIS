/**
 * Server-side model calls: the fixed providers go straight out, a visitor's
 * own endpoint goes through the SSRF guard first.
 *
 * This is the only place that decides which fetch a provider gets, so a route
 * cannot accidentally call `createChat` with a custom base URL and the plain
 * fetch. Server-only: it imports the guard's Node DNS code.
 */
import { safeFetch } from '@/lib/ssrf-guard';
import { createChat, listModels, type ChatFn, type FetchLike, type ModelEntry, type ProviderId } from './providers';

const guarded = (provider: ProviderId): FetchLike =>
  provider === 'custom' ? (url, init) => safeFetch(url, init) : fetch;

/** A chat function for a provider, on the visitor's key, with the endpoint checked when it is custom. */
export function chatFor(provider: ProviderId, key: string, model: string, baseUrl?: string): ChatFn {
  return createChat(provider, key, model, guarded(provider), baseUrl);
}

/** The models a key can use, with the same guard for a custom endpoint. */
export function modelsFor(
  provider: ProviderId, key: string, baseUrl?: string,
): Promise<{ models: ModelEntry[]; listed: boolean }> {
  return listModels(provider, key, guarded(provider), baseUrl);
}
