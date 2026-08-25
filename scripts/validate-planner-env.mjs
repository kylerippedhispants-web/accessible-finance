import { resolve } from 'node:path';
import { loadEnv } from 'vite';

function legacyJwtRole(key) {
  const [, payload] = key.split('.');
  if (!payload) return undefined;

  try {
    const decoded = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    return typeof decoded.role === 'string' ? decoded.role : undefined;
  } catch {
    return undefined;
  }
}

function validatePublicConfiguration(env) {
  const urlValue = env.VITE_SUPABASE_URL?.trim() ?? '';
  const key = env.VITE_SUPABASE_ANON_KEY?.trim() ?? '';

  if (!urlValue && !key) return false;
  if (!urlValue || !key) {
    throw new Error('Planner cloud configuration is incomplete. Set both public Supabase variables or neither.');
  }

  let url;
  try {
    url = new URL(urlValue);
  } catch {
    throw new Error('VITE_SUPABASE_URL is not a valid URL.');
  }
  if (url.protocol !== 'https:' || !url.hostname.endsWith('.supabase.co')) {
    throw new Error('VITE_SUPABASE_URL must be the HTTPS URL of a Supabase project.');
  }
  if (url.username || url.password || url.search || url.hash || url.pathname !== '/') {
    throw new Error('VITE_SUPABASE_URL must be a credential-free Supabase project origin.');
  }

  const normalizedKey = key.toLowerCase();
  const role = legacyJwtRole(key);
  const isPublishableKey = normalizedKey.startsWith('sb_publishable_');
  const isLegacyAnonKey = role === 'anon' && key.split('.').length === 3;
  if (!isPublishableKey && !isLegacyAnonKey) {
    throw new Error('Refusing to build: VITE_SUPABASE_ANON_KEY is not a recognized public publishable or legacy anon key.');
  }
  return true;
}

const mode = process.argv[2] ?? 'production';
const repositoryRoot = resolve(import.meta.dirname, '..');

try {
  const configured = validatePublicConfiguration(loadEnv(mode, repositoryRoot, 'VITE_'));
  process.stdout.write(configured
    ? 'Validated public Supabase browser configuration.\n'
    : 'Supabase browser configuration is empty; building Demo Mode without cloud sync.\n');
} catch (error) {
  process.stderr.write(`${error instanceof Error ? error.message : 'Planner environment validation failed.'}\n`);
  process.exitCode = 1;
}
