'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import Button from './Button';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

const LoginPage = () => {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [mode, setMode] = useState('login'); // 'login' or 'signup'
  const { signIn, signUp, user, setAuthCookie } = useAuth();

  // Check for error parameters in the URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const errorMsg = params.get('error');
    
    if (errorMsg) {
      console.error('Error from OAuth callback:', errorMsg);
      
      // Show a more user-friendly error message for code verifier issues
      if (errorMsg === 'auth_flow_interrupted_please_try_again') {
        setError({
          type: 'error',
          message: 'Authentication flow was interrupted. Please try again.'
        });
      } else {
        setError({
          type: 'error',
          message: decodeURIComponent(errorMsg)
        });
      }
      
      // Clear any stale PKCE state that might be causing issues
      localStorage.removeItem('supabase-auth-code-verifier');
    }
  }, []);

  // Only check authentication once on mount, not on every render
  useEffect(() => {
    // Skip client-side redirect if we're already being server-side redirected
    // This prevents the double-redirect loop
    const hasRedirectParam = new URLSearchParams(window.location.search).has('no_redirect');
    
    if (hasRedirectParam) {
      console.log('Skipping client-side redirect check due to no_redirect parameter');
      return;
    }
    
    console.log('LoginPage mounted, checking auth state');
    
    // Check for OAuth redirect result
    const checkOAuthRedirect = async () => {
      const { data, error } = await supabase.auth.getSession();
      console.log('Session check result:', { 
        hasSession: !!data?.session,
        error: error?.message || 'none'
      });
      
      if (data?.session) {
        console.log('OAuth redirect detected with valid session');
        handleSuccessfulAuth(data.session);
      }
    };
    
    checkOAuthRedirect();
  }, []);
  
  // Handle successful authentication (for both email and OAuth)
  const handleSuccessfulAuth = (session) => {
    if (!session) {
      console.error('No session data provided to handleSuccessfulAuth');
      return;
    }
    
    try {
      console.log('Setting up auth after successful login');
      
      // Store session in localStorage directly
      localStorage.setItem('supabase-session', JSON.stringify(session));
      
      // Set cookies manually with document.cookie
      const expiresIn = session.expires_in || 3600;
      document.cookie = `supabase-auth-token=${session.access_token}; path=/; max-age=${expiresIn}; SameSite=Lax`;
      document.cookie = `auth-status=authenticated; path=/; max-age=${expiresIn}; SameSite=Lax`;
      
      console.log('Session stored in localStorage and cookies set');
      
      // Force a full page reload to ensure the server sees the cookies
      console.log('Redirecting to app with full page reload');
      window.location.href = '/app?login_success=true&t=' + Date.now();
    } catch (e) {
      console.error('Error storing session:', e);
      setError({
        type: 'error',
        message: 'Failed to store authentication data. Please try again.'
      });
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Clear any existing PKCE state before starting a new flow
      localStorage.removeItem('supabase-auth-code-verifier');
      console.log('Cleared existing code verifier from localStorage');
      
      // Clear all Supabase related cookies to start fresh
      document.cookie = 'sb-access-token=; Max-Age=0; path=/; domain=' + window.location.hostname;
      document.cookie = 'sb-refresh-token=; Max-Age=0; path=/; domain=' + window.location.hostname;
      document.cookie = 'supabase-auth-token=; Max-Age=0; path=/; domain=' + window.location.hostname;
      document.cookie = 'auth-status=; Max-Age=0; path=/; domain=' + window.location.hostname;
      console.log('Cleared existing auth cookies');

      // Get the current URL to use as the site URL
      const siteUrl = window.location.origin;
      const callbackUrl = `${siteUrl}/auth/callback`;
      console.log('Using callback URL:', callbackUrl);
      
      // Configure OAuth options
      const options = {
        redirectTo: callbackUrl,
        skipBrowserRedirect: false, // Important: Let Supabase handle the redirect
      };
      
      console.log('Starting Google OAuth flow with PKCE...');
      
      // Start the sign in process
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options
      });
      
      if (error) {
        console.error('Error starting Google sign in:', error);
        throw error;
      }
      
      if (!data?.url) {
        console.error('No OAuth URL returned from Supabase');
        throw new Error('No OAuth URL returned from Supabase');
      }
      
      console.log('OAuth URL received, redirecting to:', data.url);
      
      // Let the browser handle the redirect
      window.location.href = data.url;
    } catch (error) {
      console.error('Error signing in with Google:', error);
      setError({
        type: 'error',
        message: error.message || 'Failed to connect to Google. Please try again.'
      });
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      console.log('Attempting to sign in with:', { email });
      
      if (mode === 'login') {
        // Use direct Supabase auth instead of the context method for more control
        const { data, error } = await supabase.auth.signInWithPassword({ 
          email, 
          password 
        });
        
        if (error) {
          console.error('Login error:', error.message);
          setError({
            type: 'error',
            message: error.message
          });
        } else if (data && data.session) {
          console.log('Login successful, session data received');
          handleSuccessfulAuth(data.session);
        } else {
          console.error('Login successful but no session data returned');
          setError({
            type: 'error',
            message: 'Authentication successful but session data is missing. Please try again.'
          });
        }
      } else {
        const { data, error } = await signUp({ email, password });
        
        if (error) {
          console.error('Signup error:', error.message);
          setError({
            type: 'error',
            message: error.message
          });
        } else {
          console.log('Signup successful');
          setError({
            type: 'success',
            message: 'Check your email for the verification link!'
          });
        }
      }
    } catch (err) {
      console.error('Unexpected auth error:', err);
      setError({
        type: 'error',
        message: 'An unexpected error occurred. Please try again.'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    router.push('/');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-900 px-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="text-4xl font-bold text-white">
            {mode === 'login' ? 'Welcome back' : 'Create an account'}
          </h2>
          <p className="mt-2 text-sm text-neutral-400">
            {mode === 'login' 
              ? "Don't have an account? " 
              : "Already have an account? "}
            <button
              onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
              className="text-white hover:underline focus:outline-none"
            >
              {mode === 'login' ? 'Sign up' : 'Log in'}
            </button>
          </p>
        </div>

        <div className="space-y-4">
          {/* Google Sign In Button */}
          <Button
            onClick={handleGoogleLogin}
            className="w-full bg-white hover:bg-gray-50 text-black flex items-center justify-center gap-2"
            disabled={loading}
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            Continue with Google
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-neutral-800"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-neutral-900 text-neutral-400">Or continue with email</span>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          {error && (
            <div className={`p-3 rounded-lg text-sm ${
              error.type === 'error' 
                ? 'bg-red-500/10 text-red-500' 
                : 'bg-green-500/10 text-green-500'
            }`}>
              {error.message}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="sr-only">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-700 text-white placeholder-neutral-400"
                placeholder="Email address"
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-700 text-white placeholder-neutral-400"
                placeholder="Password"
              />
            </div>
          </div>

          <div className="flex gap-4">
            <Button
              type="submit"
              className="flex-1"
              disabled={loading}
            >
              {loading ? 'Processing...' : mode === 'login' ? 'Log in' : 'Sign up'}
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={handleCancel}
              className="flex-1 border border-neutral-700"
              disabled={loading}
            >
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoginPage; 