'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext({});

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authInitialized, setAuthInitialized] = useState(false);

  // Helper function to set the auth cookie
  const setAuthCookie = useCallback((session) => {
    if (session) {
      try {
        console.log('Setting auth cookies for session');
        
        // Set a more robust cookie with proper attributes
        // Use a longer expiration to ensure the cookie persists
        const expiresIn = session.expires_in || 3600;
        
        // Set the token cookie with the full session token
        document.cookie = `supabase-auth-token=${session.access_token}; path=/; max-age=${expiresIn}; SameSite=Lax`;
        
        // Also set a simpler cookie for easier detection
        document.cookie = `auth-status=authenticated; path=/; max-age=${expiresIn}; SameSite=Lax`;
        
        // Store the full session in localStorage as a backup
        localStorage.setItem('supabase-session', JSON.stringify(session));
        
        console.log('Auth cookies set successfully with expiration:', expiresIn);
        return true;
      } catch (e) {
        console.error('Failed to set auth cookies:', e);
        return false;
      }
    } else {
      try {
        // Clear cookies on sign out
        document.cookie = 'supabase-auth-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax';
        document.cookie = 'auth-status=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax';
        
        // Clear localStorage backup
        localStorage.removeItem('supabase-session');
        
        console.log('Auth cookies cleared successfully');
        return false;
      } catch (e) {
        console.error('Failed to clear auth cookies:', e);
        return false;
      }
    }
  }, []);

  // Initialize auth state once on mount
  useEffect(() => {
    let mounted = true;
    
    const initializeAuth = async () => {
      try {
        console.log('Initializing auth state...');
        
        // First try to get the session from Supabase
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting session:', error.message);
          throw error;
        }
        
        if (mounted) {
          const hasSession = !!session;
          console.log('Initial session check:', hasSession ? 'session found' : 'no session');
          
          if (hasSession) {
            setUser(session.user);
            setAuthCookie(session);
          } else {
            // Try to recover session from localStorage
            try {
              const storedSession = localStorage.getItem('supabase-session');
              if (storedSession) {
                const parsedSession = JSON.parse(storedSession);
                console.log('Recovered session from localStorage');
                
                // Verify the session is still valid
                const now = Math.floor(Date.now() / 1000);
                if (parsedSession.expires_at && parsedSession.expires_at > now) {
                  console.log('Recovered session is still valid');
                  setUser(parsedSession.user);
                  setAuthCookie(parsedSession);
                } else {
                  console.log('Recovered session is expired, clearing');
                  localStorage.removeItem('supabase-session');
                }
              }
            } catch (e) {
              console.error('Failed to recover session from localStorage:', e);
            }
          }
          
          setLoading(false);
          setAuthInitialized(true);
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        if (mounted) {
          setLoading(false);
          setAuthInitialized(true);
        }
      }
    };
    
    initializeAuth();
    
    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth state changed:', event, session ? 'session present' : 'no session');
      
      if (mounted) {
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          console.log('User signed in or token refreshed');
          setUser(session?.user ?? null);
          setAuthCookie(session);
        } else if (event === 'SIGNED_OUT') {
          console.log('User signed out');
          setUser(null);
          setAuthCookie(null);
        } else if (event === 'USER_UPDATED') {
          console.log('User updated');
          setUser(session?.user ?? null);
        }
      }
    });
    
    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [setAuthCookie]);

  const signUp = useCallback(async (data) => {
    try {
      console.log('Signing up with email:', data.email);
      return await supabase.auth.signUp(data);
    } catch (error) {
      console.error('Sign up error:', error);
      return { error };
    }
  }, []);

  const signIn = useCallback(async (data) => {
    try {
      console.log('Signing in with email:', data.email);
      const result = await supabase.auth.signInWithPassword(data);
      
      if (result.error) {
        console.error('Sign in error:', result.error.message);
      } else if (result.data.session) {
        console.log('Sign in successful, setting cookies');
        setAuthCookie(result.data.session);
      }
      
      return result;
    } catch (error) {
      console.error('Sign in error:', error);
      return { error };
    }
  }, [setAuthCookie]);

  const signOut = useCallback(async () => {
    try {
      console.log('Signing out...');
      
      // First clear cookies to prevent redirect loops
      setAuthCookie(null);
      
      // Then sign out from Supabase
      const result = await supabase.auth.signOut();
      
      if (result.error) {
        console.error('Sign out error:', result.error.message);
      } else {
        console.log('Sign out successful');
      }
      
      return result;
    } catch (error) {
      console.error('Sign out error:', error);
      return { error };
    }
  }, [setAuthCookie]);

  const value = {
    user,
    loading,
    authInitialized,
    signUp,
    signIn,
    signOut,
    setAuthCookie
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}; 