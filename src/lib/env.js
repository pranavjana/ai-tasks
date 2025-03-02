'use client';

/**
 * This file provides a consistent way to access environment variables in client components
 * For server components, use process.env directly
 */

// Environment variables with fallbacks
export const env = {
  // Supabase configuration
  SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ihiuqrjobgyjujyboqnv.supabase.co',
  SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImloaXVxcmpvYmd5anVqeWJvcW52Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzk3OTA5MzQsImV4cCI6MjA1NTM2NjkzNH0.TQ22tyu6TW_Mi0sQSbkvx-UwwD87Fu-zhYQQfEZ2POs',
  
  // Ensure we have both standard and NEXT_PUBLIC_ versions for server/client usage
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ihiuqrjobgyjujyboqnv.supabase.co',
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImloaXVxcmpvYmd5anVqeWJvcW52Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzk3OTA5MzQsImV4cCI6MjA1NTM2NjkzNH0.TQ22tyu6TW_Mi0sQSbkvx-UwwD87Fu-zhYQQfEZ2POs',
  
  // Other API keys and configuration
  GEMINI_API_KEY: 'AIzaSyAOKVvbROIXRwFkJ8QRmwV19Rz3dmASEYM',
  OPENAI_API_KEY: '',
  SITE_URL: 'http://localhost:3000',
  GOOGLE_CLIENT_ID: '128428682376-l8l9oekmes4s3feqnctqpvliedd4q6e3.apps.googleusercontent.com',
  
  // Application configuration
  NODE_ENV: process.env.NODE_ENV || 'development',
};

// Log environment status on client-side for debugging
if (typeof window !== 'undefined') {
  console.log('Environment variables loaded:', {
    supabaseConfigured: !!env.SUPABASE_URL && !!env.SUPABASE_ANON_KEY,
    environment: env.NODE_ENV,
  });
} 
