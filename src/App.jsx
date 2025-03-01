'use client';

import { AuthProvider, useAuth } from './contexts/AuthContext';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import ChatInterface from './components/ChatInterface';
import LoginPage from './components/LoginPage';
import LandingPage from './components/LandingPage';
import { supabase } from './lib/supabase';
import { useEffect, useState } from "react";
import { getService } from './services/initServices';

function ProtectedApp() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);

  useEffect(() => {
    if (user) {
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
    }
  }, [user]);

  const fetchTasks = async () => {
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
    return <Navigate to="/login" />;
  }

  return <ChatInterface initialTasks={tasks} />;
}

function App() {
  const [initialized, setInitialized] = useState(false);
  
  useEffect(() => {
    // Initialize services
    if (typeof window !== 'undefined' && !initialized) {
      import('./services/initServices').then(module => {
        module.initializeServices();
        setInitialized(true);
      });
    }
  }, [initialized]);

  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}

function AppRoutes() {
  const { user } = useAuth();
  const metricsService = getService('metrics');
  
  useEffect(() => {
    if (metricsService) {
      metricsService.info('app', 'App component mounted');
    }
  }, [metricsService]);

  return (
    <Routes>
      <Route path="/" element={user ? <Navigate to="/app" /> : <LandingPage />} />
      <Route path="/login" element={user ? <Navigate to="/app" /> : <LoginPage />} />
      <Route path="/app" element={<ProtectedApp />} />
    </Routes>
  );
}

export default App;
