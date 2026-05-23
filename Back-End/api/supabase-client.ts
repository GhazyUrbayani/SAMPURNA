import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/database.types';

// Supabase Configuration
// For Figma Make deployment, credentials are hardcoded here
// These are PUBLIC keys and safe to expose (RLS is enabled)
const SUPABASE_URL = 'https://blibawahlbufacgjzqok.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJsaWJhd2FobGJ1ZmFjZ2p6cW9rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc5ODc2MzEsImV4cCI6MjA5MzU2MzYzMX0.h49G_KddKHN7KTjU1d4Sb76lurNNuSnpIk1TfxtiyBs';

// Alternative: Use environment variables (for local development with .env)
// const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://blibawahlbufacgjzqok.supabase.co';
// const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Create Supabase client
export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

// Helper function to check connection
export async function testSupabaseConnection() {
  try {
    const { data, error } = await supabase.from('trash_bins').select('count');
    if (error) throw error;
    console.log('✅ Supabase connected successfully');
    return true;
  } catch (error) {
    console.error('❌ Supabase connection failed:', error);
    return false;
  }
}

// Helper to get Supabase config info
export function getSupabaseConfig() {
  return {
    url: SUPABASE_URL,
    hasKey: !!SUPABASE_ANON_KEY,
  };
}
