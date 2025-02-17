import { AuthProvider, useAuth } from './contexts/AuthContext';
import ChatInterface from './components/ChatInterface';
import LoginPage from './components/LoginPage';
import { createClient } from "@supabase/supabase-js";
import { useEffect, useState } from "react";
import TaskCard from './components/TaskCard';

// NEW: Correct Supabase URL initialization (if not already in environment variables)
const supabase = createClient(
  "https://ihiuqrjobgyjujyboqnv.supabase.co", 
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImloaXVxcmpvYmd5anVqeWJvcW52Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzk3OTA5MzQsImV4cCI6MjA1NTM2NjkzNH0.TQ22tyu6TW_Mi0sQSbkvx-UwwD87Fu-zhYQQfEZ2POs"
);

function TasksList() { 
  const [tasks, setTasks] = useState([]); 

  useEffect(() => { 
    getTasks(); 
  }, []); 

  async function getTasks() { 
    const { data, error } = await supabase.from("tasks").select(); 
    if (error) { 
      console.error("Error fetching tasks:", error); 
    } else { 
      setTasks(data); 
    } 
  } 

  return ( 
    <ul>
      {tasks.map((task) => ( 
        <li key={task.id}>{task.title}</li> 
      ))} 
    </ul> 
  ); 
}

const ProtectedApp = () => {
  const { user } = useAuth();

  if (!user) {
    return <LoginPage />;
  }

  return (
    <>
      <ChatInterface />
      <TasksList />
    </>
  );
};

function App() {
  return (
    <AuthProvider>
      <ProtectedApp />
    </AuthProvider>
  );
}

export default App;
