import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const requestUrl = new URL(request.url);
    const code = requestUrl.searchParams.get('code');
    const error = requestUrl.searchParams.get('error');
    const errorDescription = requestUrl.searchParams.get('error_description');
    
    console.log('OAuth callback received with params:', {
      code: code ? 'present' : 'missing',
      error: error || 'none',
      errorDescription: errorDescription || 'none',
      allParams: Object.fromEntries(requestUrl.searchParams.entries())
    });
    
    // Handle error from OAuth provider
    if (error) {
      console.error(`OAuth error: ${error}`, errorDescription);
      return NextResponse.redirect(
        new URL(`/login?error=${encodeURIComponent(errorDescription || error)}`, requestUrl.origin)
      );
    }
    
    if (!code) {
      console.error('No code provided in OAuth callback');
      return NextResponse.redirect(
        new URL('/login?error=no_code_received_from_provider', requestUrl.origin)
      );
    }
    
    // Create Supabase client with async cookie handling
    const cookieStore = cookies();
    
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          async get(name) {
            const cookie = cookieStore.get(name);
            return cookie?.value;
          },
          async set(name, value, options) {
            cookieStore.set({ name, value, ...options });
          },
          async remove(name, options) {
            cookieStore.set({ name, value: "", ...options });
          },
        },
      }
    );
    
    // Exchange the code for a session
    console.log('Exchanging code for session...');
    const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
    
    if (exchangeError) {
      console.error('Error exchanging code for session:', exchangeError.message);
      
      // If the error is about code verifier, redirect to login page to start fresh
      if (exchangeError.message.includes('code verifier')) {
        console.log('Code verifier issue detected, redirecting to login page to start fresh');
        return NextResponse.redirect(
          new URL('/login?error=auth_flow_interrupted_please_try_again', requestUrl.origin)
        );
      }
      
      return NextResponse.redirect(
        new URL(`/login?error=${encodeURIComponent(exchangeError.message)}`, requestUrl.origin)
      );
    }
    
    if (!data || !data.session) {
      console.error('No session returned from code exchange');
      return NextResponse.redirect(
        new URL('/login?error=no_session_returned', requestUrl.origin)
      );
    }
    
    console.log('OAuth callback successful, session obtained:', {
      userId: data.session.user.id,
      expiresAt: new Date(data.session.expires_at * 1000).toISOString(),
    });
    
    // Set an additional auth status cookie for more robust auth checking
    cookieStore.set('auth-status', 'authenticated', {
      maxAge: 30 * 24 * 60 * 60, // 30 days
      path: '/', 
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production'
    });
    
    // Create a response that redirects to the app
    const timestamp = Date.now();
    const redirectUrl = new URL(`/app?login_success=true&t=${timestamp}`, requestUrl.origin);
    
    // Redirect to the app page
    return NextResponse.redirect(redirectUrl);
  } catch (error) {
    console.error('Unexpected error in OAuth callback:', error);
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent('Server error: ' + (error.message || 'Unknown error'))}`, 
      new URL(request.url).origin)
    );
  }
} 