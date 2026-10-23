import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import type { NextFetchEvent } from 'next/server';
import { middleware } from './middleware';

function request(path: string, headers: Record<string, string> = {}) {
  return new NextRequest(`http://localhost${path}`, { headers });
}

function fetchEvent() {
  const pending: Promise<unknown>[] = [];
  const event = {
    waitUntil: (promise: Promise<unknown>) => {
      pending.push(promise);
    },
  } as unknown as NextFetchEvent;
  return { event, pending };
}

async function run(path: string, headers: Record<string, string> = {}) {
  const { event, pending } = fetchEvent();
  const response = middleware(request(path, headers), event);
  await Promise.all(pending);
  return response;
}

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn(async () => new Response('', { status: 200 })));
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe('deployment fence', () => {
  it('is off by default, so upstream OSIRIS routes keep working', async () => {
    const response = await run('/api/earthquakes');
    expect(response.status).toBe(200);
    expect(response.headers.get('x-middleware-next')).toBe('1');
  });

  it('allows only the NusaWatch surface when NUSAWATCH_FENCE=1', async () => {
    vi.stubEnv('NUSAWATCH_FENCE', '1');

    const allowed = ['/watch', '/watch/', '/api/nusawatch/events', '/api/nusawatch/sources'];
    for (const path of allowed) {
      const response = await run(path);
      expect(response.headers.get('x-middleware-next'), path).toBe('1');
    }
  });

  it('404s every other route when fenced', async () => {
    vi.stubEnv('NUSAWATCH_FENCE', '1');

    const blocked = [
      '/',
      '/osint',
      '/api/earthquakes',
      '/api/osint/people',
      '/api/scanner',
      '/api/cctv/proxy',
      '/bolags',
      '/watchtower',
    ];

    for (const path of blocked) {
      const response = await run(path);
      // The root redirects instead of 404 so a visitor lands on the product.
      if (path === '/') {
        expect(response.status, path).toBe(307);
        expect(response.headers.get('location'), path).toBe('http://localhost/watch');
      } else {
        expect(response.status, path).toBe(404);
      }
    }
  });

  it('keeps the health check reachable when fenced', async () => {
    vi.stubEnv('NUSAWATCH_FENCE', '1');
    const response = await run('/api/health');
    expect(response.headers.get('x-middleware-next')).toBe('1');
  });

  it('does not mistake a lookalike prefix for the surface', async () => {
    vi.stubEnv('NUSAWATCH_FENCE', '1');
    expect((await run('/watchtower')).status).toBe(404);
    expect((await run('/api/nusawatch-admin')).status).toBe(404);
  });
});

describe('analytics boundary', () => {
  it('never beacons for the NusaWatch surface, even unfenced', async () => {
    await run('/watch', { 'cf-connecting-ip': '203.0.113.9' });
    await run('/api/nusawatch/events', { 'cf-connecting-ip': '203.0.113.9' });

    expect(vi.mocked(fetch)).not.toHaveBeenCalled();
  });

  it('never beacons for any API route', async () => {
    await run('/api/earthquakes');
    expect(vi.mocked(fetch)).not.toHaveBeenCalled();
  });

  it('keeps the dashboard analytics working', async () => {
    await run('/bolags', { 'cf-connecting-ip': '203.0.113.9' });

    expect(vi.mocked(fetch)).toHaveBeenCalledTimes(2);
    const bodies = vi.mocked(fetch).mock.calls.map(call => String(call[1]?.body ?? ''));
    expect(bodies.some(body => body.includes('Network Log'))).toBe(true);
    expect(bodies.some(body => body.includes('203.0.113.9'))).toBe(true);
  });
});
