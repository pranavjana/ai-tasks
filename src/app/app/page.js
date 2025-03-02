import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { headers } from 'next/headers';
import AppWrapper from './client';

export const metadata = {
  title: 'Task AI - Dashboard',
  description: 'Manage your tasks with AI assistance',
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

// Add stronger cache control - disable cache for this page to ensure fresh auth checks
export const dynamic = 'force-dynamic';
export const revalidate = 0; // revalidate on every request

export default async function AppPage({ searchParams }) {
  // Handle searchParams safely by converting to a regular object
  const params = Object.fromEntries(
    Object.entries(searchParams || {})
  );
  
  const isLoginSuccess = params.login_success === 'true';
  
  // Get request headers to check for redirect loop
  const headersList = await headers();
  const referer = headersList.get('referer') || '';
  const isFromLogin = referer.includes('/login');
  
  // Check for authentication cookies on the server
  const cookieStore = await cookies();
  const supabaseSession = cookieStore.get('supabase-auth-token');
  const authStatus = cookieStore.get('auth-status');
  
  console.log('App page - Auth check:', {
    tokenExists: !!supabaseSession,
    statusExists: !!authStatus,
    isFromLogin,
    isLoginSuccess,
    cookieValue: supabaseSession?.value?.substring(0, 10) || 'none'
  });
  
  // If coming directly from a successful login, skip the redirect check
  if (isLoginSuccess) {
    console.log('App page - Login success parameter detected, rendering app');
    return <AppWrapper />;
  }
  
  // If user is not logged in, redirect to login
  // Check both cookies for more robust authentication
  if ((!supabaseSession || !supabaseSession.value) && (!authStatus || authStatus.value !== 'authenticated')) {
    console.log('App page - Not authenticated, redirecting to login');
    
    // Add a query parameter to prevent client-side redirect loops
    return redirect('/login?no_redirect=true');
  }
  
  console.log('App page - Authenticated, rendering app');
  
  // Render the client-side App component
  return <AppWrapper />;
} 
