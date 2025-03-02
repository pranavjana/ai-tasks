import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { headers } from 'next/headers';
import LandingPage from '@/components/LandingPage';

export const metadata = {
  title: 'Task AI - Home',
  description: 'AI-powered task management',
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

// Disable caching for this page to ensure fresh auth checks
export const dynamic = 'force-dynamic';
export const revalidate = 0; // revalidate on every request

export default async function Home({ searchParams }) {
  // Get request headers to check for redirect loop
  const headersList = await headers();
  const referer = headersList.get('referer') || '';
  
  // Check for authentication cookies on the server
  const cookieStore = await cookies();
  const supabaseSession = cookieStore.get('supabase-auth-token');
  const authStatus = cookieStore.get('auth-status');
  
  console.log('Home page - Auth check:', {
    tokenExists: !!supabaseSession,
    statusExists: !!authStatus,
    referer,
    cookieValue: supabaseSession?.value?.substring(0, 10) || 'none'
  });
  
  // If user is logged in, redirect to app
  // Check both cookies for more robust authentication
  if ((supabaseSession && supabaseSession.value) || (authStatus && authStatus.value === 'authenticated')) {
    console.log('Home page - Authenticated, redirecting to app');
    
    // Add a query parameter to prevent client-side redirect loops
    return redirect('/app?no_redirect=true');
  }
  
  console.log('Home page - Not authenticated, rendering landing page');
  
  // Render the landing page for non-authenticated users
  return <LandingPage />;
} 
