'use client';

import { AuthProvider, useAuth } from './contexts/AuthContext';
import ChatInterface from './components/ChatInterface';
import { supabase } from './lib/supabase';
import { useEffect, useState } from "react";
import { useRouter, usePathname } from 'next/navigation';

function ProtectedApp() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const router = useRouter();

  useEffect(() => {
    // If not authenticated, redirect to login
    if (!user) {
      router.push('/login');
      return;
    }

    // Fetch initial tasks
    fetchTasks();

    // Subscribe to changes
    const channel = supabase
      .channel('tasks_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'tasks' }, 
        (payload) => {
          console.log('Change received!', payload);
          // Handle different types of changes
          if (payload.eventType === 'INSERT') {
            setTasks(prev => [payload.new, ...prev]);
          } else if (payload.eventType === 'DELETE') {
            setTasks(prev => prev.filter(task => task.id !== payload.old.id));
          } else if (payload.eventType === 'UPDATE') {
            setTasks(prev => prev.map(task => 
              task.id === payload.new.id ? payload.new : task
            ));
          }
        }
      )
      .subscribe();

    // Listen for task updates from components
    const handleTasksUpdated = (event) => {
      setTasks(event.detail);
    };
    window.addEventListener('tasksUpdated', handleTasksUpdated);

    return () => {
      supabase.removeChannel(channel);
      window.removeEventListener('tasksUpdated', handleTasksUpdated);
    };
  }, [user, router]);

  const fetchTasks = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      setTasks(data || []);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    }
  };

  if (!user) {
    return null; // Will redirect in useEffect
  }

  return <ChatInterface initialTasks={tasks} />;
}

function App() {
  const [initialized, setInitialized] = useState(false);
  const [metricsService, setMetricsService] = useState(null);
  const { user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  
  useEffect(() => {
    // Initialize services
    if (typeof window !== 'undefined' && !initialized) {
      import('./services/initServices').then(module => {
        module.initializeServices();
        setInitialized(true);
        // Get metrics service after initialization
        const metrics = module.getService('metrics');
        setMetricsService(metrics);
      }).catch(error => {
        console.error('Failed to initialize services:', error);
      });
    }
  }, [initialized]);
  
  useEffect(() => {
    if (initialized && metricsService) {
      metricsService.info('app', 'App component mounted');
    }
    
    // Handle routing based on authentication state
    if (user) {
      if (pathname === '/' || pathname === '/login') {
        router.push('/app');
      }
    } else {
      if (pathname === '/app') {
        router.push('/login');
      }
    }
  }, [user, pathname, router, metricsService, initialized]);

  // Render the appropriate component based on the path
  if (pathname === '/app') {
    return (
      <AuthProvider>
        <ProtectedApp />
      </AuthProvider>
    );
  }
  
  // For other routes, return null as they will be handled by Next.js pages
  return null;
}

export default App;
