'use client';

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import ChatInterface from '@/components/ChatInterface';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import dynamic from 'next/dynamic';

// Dynamically import the App component with no SSR
const AppClient = dynamic(() => import('../../App'), { ssr: false });

function AppContent({ initialTasks }) {
  const { user, authInitialized } = useAuth();
  const [tasks, setTasks] = useState(initialTasks);
  const [servicesInitialized, setServicesInitialized] = useState(false);
  const [servicesError, setServicesError] = useState(null);
  const initializationAttempted = useRef(false);
  
  // Initialize services only once
  useEffect(() => {
    if (!servicesInitialized && !initializationAttempted.current) {
      initializationAttempted.current = true;
      
      console.log('Initializing services...');
      const initServices = async () => {
        try {
          // Create a registry of services first
          const services = await import('@/services/initServices');
          
          // Initialize all services before trying to use any of them
          services.initializeServices();
          
          // Mark that initialization completed successfully
          setServicesInitialized(true);
          console.log('Services initialized successfully');
        } catch (error) {
          console.error('Error initializing services:', error);
          setServicesError(error.message);
        }
      };
      
      initServices();
    }
  }, [servicesInitialized]);
  
  // Subscribe to task changes only when authenticated
  useEffect(() => {
    if (!user || !authInitialized || !servicesInitialized) return;
    
    console.log('Setting up task subscription for user:', user.id);
    
    // Subscribe to changes
    const channel = supabase
      .channel('tasks_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'tasks' }, 
        (payload) => {
          console.log('Task change received:', payload.eventType);
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
      console.log('Cleaning up task subscription');
      supabase.removeChannel(channel);
      window.removeEventListener('tasksUpdated', handleTasksUpdated);
    };
  }, [user, authInitialized, servicesInitialized]);

  // If services failed to initialize, show error state
  if (servicesError) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-neutral-900">
        <div className="text-white text-center max-w-md p-6 bg-neutral-800 rounded-lg">
          <h2 className="text-xl font-bold mb-3">Application Error</h2>
          <p className="mb-4">We encountered a problem initializing the application:</p>
          <div className="bg-red-900/20 p-3 rounded text-red-300 text-sm mb-4">
            {servicesError}
          </div>
          <button 
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-white text-black rounded hover:bg-neutral-200 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // If not authenticated or services not initialized, show loading state
  if (!authInitialized || !servicesInitialized) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-neutral-900">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white mx-auto mb-4"></div>
          <p>Loading application...</p>
        </div>
      </div>
    );
  }

  return <ChatInterface initialTasks={tasks} />;
}

export default function AppWrapper() {
  return (
    <AuthProvider>
      <AppClient />
    </AuthProvider>
  );
} 
