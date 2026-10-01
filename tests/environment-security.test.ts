import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const script = resolve(import.meta.dirname, '../scripts/validate-planner-env.mjs');

function runValidator(url: string, key: string, cloudRequired = false) {
  return spawnSync(process.execPath, [script, 'production'], {
    cwd: resolve(import.meta.dirname, '..'),
    encoding: 'utf8',
    env: {
      ...process.env,
      VITE_SUPABASE_URL: url,
      VITE_SUPABASE_ANON_KEY: key,
      PLANNER_REQUIRE_CLOUD: cloudRequired ? 'true' : '',
    },
  });
}

describe('planner build environment security', () => {
  it('allows a demo-only build with no cloud values', () => {
    expect(runValidator('', '').status).toBe(0);
  });

  it('blocks a production-gated build when cloud values are missing', () => {
    const result = runValidator('', '', true);
    expect(result.status).not.toBe(0);
    expect(`${result.stdout}${result.stderr}`).toContain('cloud mode is required');
  });

  it('allows a public Supabase publishable key', () => {
    expect(runValidator('https://example.supabase.co', 'sb_publishable_example').status).toBe(0);
  });

  it('fails closed when only one cloud variable is set', () => {
    expect(runValidator('https://example.supabase.co', '').status).not.toBe(0);
  });

  it('blocks secret keys before Vite can emit a browser bundle', () => {
    const secret = ['sb', 'secret', 'test-value'].join('_');
    const result = runValidator('https://example.supabase.co', secret);
    expect(result.status).not.toBe(0);
    expect(`${result.stdout}${result.stderr}`).not.toContain(secret);
  });

  it('blocks a legacy service-role JWT before Vite can emit it', () => {
    const header = Buffer.from(JSON.stringify({ alg: 'HS256' })).toString('base64url');
    const payload = Buffer.from(JSON.stringify({ role: 'service_role' })).toString('base64url');
    expect(runValidator('https://example.supabase.co', `${header}.${payload}.signature`).status).not.toBe(0);
  });

  it('blocks opaque keys and credential-bearing project URLs', () => {
    const fictionalCredential = ['fictional', 'test', 'value'].join('-');
    expect(runValidator('https://example.supabase.co', 'unknown-secret').status).not.toBe(0);
    expect(runValidator(`https://test-user:${fictionalCredential}@example.supabase.co`, 'sb_publishable_example').status).not.toBe(0);
    expect(runValidator(`https://example.supabase.co?token=${fictionalCredential}`, 'sb_publishable_example').status).not.toBe(0);
  });
});
