'use client';

import { createBrowserClient } from '@supabase/ssr';
import { env } from './env';

const supabaseUrl = env.SUPABASE_URL;
const supabaseKey = env.SUPABASE_ANON_KEY;

// Create Supabase client using the recommended pattern from the blog post
export const supabase = createBrowserClient(
  supabaseUrl,
  supabaseKey
); 