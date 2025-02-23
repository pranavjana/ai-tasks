import { AuthProvider, useAuth } from './contexts/AuthContext';
import ChatInterface from './components/ChatInterface';
import LoginPage from './components/LoginPage';
import { supabase } from './lib/supabase';
import { useEffect, useState } from "react";
import TaskCard from './components/TaskCard';

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

      return () => {
        supabase.removeChannel(channel);
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
    return <LoginPage />;
  }

  return <ChatInterface initialTasks={tasks} />;
}

function App() {
  return (
    <AuthProvider>
      <ProtectedApp />
    </AuthProvider>
  );
}

export default App;
