import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim() ?? '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim() ?? '';

function keyRole(key: string): string | undefined {
  const [, payload] = key.split('.');
  if (!payload) return undefined;

  try {
    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
    const decoded = JSON.parse(atob(normalized)) as { role?: unknown };
    return typeof decoded.role === 'string' ? decoded.role : undefined;
  } catch {
    return undefined;
  }
}

function hasSafePublicConfiguration(): boolean {
  if (!supabaseUrl || !supabaseAnonKey) return false;

  try {
    const url = new URL(supabaseUrl);
    if (
      url.protocol !== 'https:'
      || !url.hostname.endsWith('.supabase.co')
      || url.username
      || url.password
      || url.search
      || url.hash
      || url.pathname !== '/'
    ) return false;
  } catch {
    return false;
  }

  const normalizedKey = supabaseAnonKey.toLowerCase();
  const role = keyRole(supabaseAnonKey);
  return normalizedKey.startsWith('sb_publishable_')
    || (role === 'anon' && supabaseAnonKey.split('.').length === 3);
}

export const isCloudConfigured = hasSafePublicConfiguration();

let client: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient | null {
  if (!isCloudConfigured) return null;
  if (client) return client;

  client = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: true,
      detectSessionInUrl: true,
      // The planner currently shares an origin with legacy pages that load
      // third-party scripts. Do not place refresh tokens in origin-wide web
      // storage. Persistent sign-in requires a separately isolated origin or
      // removing those scripts and enforcing a tested site-wide CSP.
      persistSession: false,
    },
    global: {
      headers: {
        'X-Client-Info': 'accessible-finance-planner-web/0.1.0',
      },
    },
  });

  return client;
}

export function cloudConfigurationMessage(): string {
  if (isCloudConfigured) return 'Cloud sync is available.';
  if (!supabaseUrl && !supabaseAnonKey) {
    return 'Cloud sync is not configured yet. Demo Mode is fully available.';
  }
  return 'Cloud sync configuration is incomplete or contains a non-public key.';
}
