import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const root = resolve(import.meta.dirname, '..');
const read = (path: string) => readFileSync(resolve(root, path), 'utf8');

describe('deployed planner security boundaries', () => {
  it('validates public environment values before building browser assets', () => {
    const packageJson = JSON.parse(read('package.json')) as { scripts: Record<string, string> };
    const build = packageJson.scripts.build;
    expect(build).toContain('validate-planner-env.mjs production');
    expect(build.indexOf('validate-planner-env.mjs')).toBeLessThan(build.indexOf('vite build'));
  });

  it('loads root-level ignored environment files documented for local setup', () => {
    expect(read('vite.config.mts')).toMatch(/envDir:\s*import\.meta\.dirname/);
    expect(read('.gitignore')).toMatch(/^\.env\.\*$/m);
    expect(read('.gitignore')).toMatch(/^!\.env\.example$/m);
  });

  it('does not persist cloud auth tokens in same-origin browser storage', () => {
    const client = read('planner-app/src/lib/supabase.ts');
    expect(client).toMatch(/persistSession:\s*false/);
    expect(client).not.toMatch(/persistSession:\s*true/);
  });

  it('scopes deep-link rewrites and hardened headers to the planner', () => {
    const netlify = read('netlify.toml');
    expect(netlify).toContain('from = "/planner/*"');
    expect(netlify).toContain('Content-Security-Policy');
    expect(netlify).toContain("frame-ancestors 'none'");
    expect(netlify).toContain('Cross-Origin-Opener-Policy');
    expect(netlify).toContain('PLANNER_REQUIRE_CLOUD = "true"');
    expect(netlify).not.toContain('wss://*.supabase.co');
    expect(netlify).not.toMatch(/from\s*=\s*"\/\*"/);
  });

  it('publicly discloses Planner financial data processing and session behaviour', () => {
    const privacy = read('privacy.html');
    expect(privacy).toContain('Planner profile and financial inputs');
    expect(privacy).toContain('Supabase');
    expect(privacy).toContain('does not persist its Supabase authentication session');
    expect(privacy).toContain('request deletion');
  });
});
