'use client';

// This file provides a consistent way to access environment variables in both client and server components
export const env = {
  SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
  GEMINI_API_KEY: process.env.NEXT_PUBLIC_GEMINI_API_KEY || '',
  OPENAI_API_KEY: process.env.NEXT_PUBLIC_OPENAI_API_KEY || '',
  SITE_URL: process.env.NEXT_PUBLIC_SITE_URL || '',
  GOOGLE_CLIENT_ID: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '',
}; 
