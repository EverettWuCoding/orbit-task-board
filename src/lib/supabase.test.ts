import { describe, expect, it, vi } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import { SupabaseRepository, validateSupabaseConfig } from './supabase';

const jwt = (role: string) => `header.${btoa(JSON.stringify({ role }))}.signature`;
describe('configuration safety', () => {
  it('allows a clearly intentional demo and public keys', () => {
    expect(validateSupabaseConfig('', '')).toBeNull();
    expect(validateSupabaseConfig('https://project.supabase.co', 'sb_publishable_example')).toBeNull();
    expect(validateSupabaseConfig('https://project.supabase.co', jwt('anon'))).toBeNull();
  });
  it('rejects partial config, non-HTTPS URLs and privileged keys', () => {
    expect(validateSupabaseConfig('https://project.supabase.co', '')).toContain('partially');
    expect(validateSupabaseConfig('invalid', jwt('anon'))).toContain('valid');
    expect(validateSupabaseConfig('http://project.supabase.co', jwt('anon'))).toContain('HTTPS');
    expect(validateSupabaseConfig('https://project.supabase.co', 'sb_secret_bad')).toContain('secret');
    expect(validateSupabaseConfig('https://project.supabase.co', jwt('service_role'))).toContain('Service-role');
  });
});
describe('Supabase guest auth', () => {
  it('reuses an existing browser guest session without another signup', async () => {
    const signup = vi.fn();
    const client = { auth: { getSession: vi.fn().mockResolvedValue({ data: { session: { user: { id: 'guest-a' } } }, error: null }), signInAnonymously: signup } } as unknown as SupabaseClient;
    expect(await new SupabaseRepository(client).initialize()).toBe('guest-a');
    expect(signup).not.toHaveBeenCalled();
  });
  it('deduplicates simultaneous sign-ins and retries after an auth error', async () => {
    const signup = vi.fn().mockResolvedValueOnce({ error: new Error('disabled'), data: {} }).mockResolvedValue({ error: null, data: { user: { id: 'new-guest' } } });
    const client = { auth: { getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }), signInAnonymously: signup } } as unknown as SupabaseClient;
    const repo = new SupabaseRepository(client);
    await expect(repo.initialize()).rejects.toThrow('disabled');
    expect(await Promise.all([repo.initialize(), repo.initialize()])).toEqual(['new-guest', 'new-guest']);
    expect(signup).toHaveBeenCalledTimes(2);
  });
});