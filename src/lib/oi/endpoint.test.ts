import { describe, it, expect } from 'vitest';
import { validateCustomBase } from './endpoint';

describe('validateCustomBase', () => {
  it('takes an HTTPS base URL and drops trailing slashes', () => {
    expect(validateCustomBase('https://api.example.com/v1/')).toEqual({ ok: true, url: 'https://api.example.com/v1' });
    expect(validateCustomBase('  https://api.example.com  ')).toEqual({ ok: true, url: 'https://api.example.com' });
    expect(validateCustomBase('https://api.example.com:8443/openai/v1')).toEqual({ ok: true, url: 'https://api.example.com:8443/openai/v1' });
  });

  it('requires HTTPS', () => {
    expect(validateCustomBase('http://api.example.com/v1')).toMatchObject({ ok: false });
    expect(validateCustomBase('ftp://api.example.com/v1')).toMatchObject({ ok: false });
  });

  it('refuses credentials, queries and fragments in the URL', () => {
    expect(validateCustomBase('https://user:pass@api.example.com/v1')).toMatchObject({ ok: false });
    expect(validateCustomBase('https://api.example.com/v1?key=secret')).toMatchObject({ ok: false });
    expect(validateCustomBase('https://api.example.com/v1#x')).toMatchObject({ ok: false });
  });

  it('refuses local names and malformed input', () => {
    expect(validateCustomBase('https://localhost:11434/v1')).toMatchObject({ ok: false });
    expect(validateCustomBase('https://box.local/v1')).toMatchObject({ ok: false });
    expect(validateCustomBase('https://metadata.google.internal/v1')).toMatchObject({ ok: false });
    expect(validateCustomBase('https://api.example.com/v1/../admin')).toMatchObject({ ok: false });
    expect(validateCustomBase('not a url')).toMatchObject({ ok: false });
    expect(validateCustomBase('')).toMatchObject({ ok: false });
    expect(validateCustomBase(undefined)).toMatchObject({ ok: false });
  });
});
