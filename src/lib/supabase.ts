import { createClient } from '@supabase/supabase-js';

// Environment variables for Supabase connection
const envUrl = import.meta.env.VITE_SUPABASE_URL;
const envAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Default fallback configuration for local dev and demo runs
export const DEFAULT_SUPABASE_URL = 'https://vector-logistics-ops.supabase.co';
export const DEFAULT_SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM1MDQ4MDAsImlhdCI6MTcwMDAwMDAwMH0.vector_ops_demo_key';

export const supabaseUrl = envUrl || DEFAULT_SUPABASE_URL;
export const supabaseAnonKey = envAnonKey || DEFAULT_SUPABASE_ANON_KEY;

/**
 * Returns whether Supabase is configured with custom credentials
 */
export const isSupabaseLiveConfigured = (): boolean => {
  return Boolean(
    envUrl &&
      envAnonKey &&
      !envUrl.includes('your-project') &&
      envUrl.startsWith('http')
  );
};

// Initialize the official Supabase Client
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});
