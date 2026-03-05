// Supabase client configuration
// API key is safe client-side — Row Level Security protects data
// Claude API key lives ONLY in Edge Functions (server-side)

import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import { MMKV } from 'react-native-mmkv';

// Local storage adapter for Supabase auth
const storage = new MMKV({ id: 'supabase-auth' });

const mmkvStorageAdapter = {
  getItem: (key: string) => {
    const value = storage.getString(key);
    return value ?? null;
  },
  setItem: (key: string, value: string) => {
    storage.set(key, value);
  },
  removeItem: (key: string) => {
    storage.delete(key);
  },
};

const SUPABASE_URL = 'https://bsbdtdexdlyruojyabtn.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJzYmR0ZGV4ZGx5cnVvanlhYnRuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI2NzUyNzksImV4cCI6MjA4ODI1MTI3OX0.eGic5unkBsjNrAO9PkB1o2814OH0EBuVtGd-hl5UqN8';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: mmkvStorageAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Helper: Get current user ID (throws if not logged in)
export async function getCurrentUserId(): Promise<string> {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) throw new Error('Not authenticated');
  return user.id;
}
