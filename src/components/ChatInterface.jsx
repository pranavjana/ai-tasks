import SearchBar from './SearchBar';
import Timeline from './Timeline';
import Tasks from './Tasks';
import TaskCard from './TaskCard';
import TaskCreationTimeline from './TaskCreationTimeline';
import { Sidebar, SidebarBody, SidebarLink, useSidebar } from './ui/Sidebar';
import { MessageSquare, Bell, Calendar, ArrowRight, LayoutDashboard, User, Settings, LogOut } from 'lucide-react';
import { useState, useEffect } from 'react';
import geminiService from '../services/gemini';
import Button from './Button';
import { useAuth } from '../contexts/AuthContext';
import { cn } from '../lib/utils';
import TypewriterEffect from './TypewriterEffect';
import { supabase } from '../lib/supabase';

const Message = ({ content, type = 'user', task, tasks, isNew }) => (
  <div className={`flex ${type === 'user' ? 'justify-end' : 'justify-start'} mb-4`}>
    <div className={`max-w-[80%] rounded-lg p-3 ${
      type === 'user' 
        ? 'bg-neutral-800 text-white rounded-br-none' 
        : 'bg-transparent text-white rounded-bl-none'
    }`}>
      {type === 'user' ? content : (
        <TypewriterEffect text={content} />
      )}
      {task && (
        <div className="mt-4">
          <TaskCard task={task} />
          <div className="mt-2">
            <Button 
              size="sm" 
              className="w-full hover:bg-neutral-700"
              onClick={() => window.dispatchEvent(new CustomEvent('viewReminders'))}
            >
              View in Reminders <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      )}
      {tasks && tasks.length > 0 && (
        <div className="mt-4">
          <TaskCreationTimeline tasks={tasks} />
          <div className="mt-4">
            <Button 
              size="sm" 
              className="w-full hover:bg-neutral-700"
              onClick={() => window.dispatchEvent(new CustomEvent('viewReminders'))}
            >
              View All in Reminders <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      )}
    </div>
  </div>
);

const UserProfile = ({ user }) => {
  const { open } = useSidebar();
  
  return (
    <div className="border-t border-neutral-800 pt-4 mb-4">
      <div className={cn(
        "flex items-center",
        !open ? "justify-center" : "gap-3"
      )}>
        <div className="w-8 h-8 rounded-full bg-neutral-900 flex items-center justify-center overflow-hidden text-sm">
          {user?.user_metadata?.avatar_url ? (
            <img 
              src={user.user_metadata.avatar_url} 
              alt={user.email} 
              className="w-full h-full object-cover"
            />
          ) : (
            <span>{user?.email?.[0].toUpperCase()}</span>
          )}
        </div>
        {open && (
          <div className="flex-1 min-w-0">
            <p className="text-sm text-white truncate">
              {user?.user_metadata?.full_name || user?.email}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

const ChatInterface = ({ initialTasks = [] }) => {
  const [activeSection, setActiveSection] = useState('chat');
  const [reminders, setReminders] = useState(initialTasks);
  const [todos, setTodos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState([]);
  const [newMessageId, setNewMessageId] = useState(null);
  const { user, signOut } = useAuth();

  useEffect(() => {
    // Only set reminders once on mount
    if (initialTasks.length > 0) {
      setReminders(initialTasks);
    }
    
    // Fetch todos when component mounts
    const fetchTodos = async () => {
      try {
        const todos = await geminiService.fetchTodos();
        setTodos(todos);
      } catch (error) {
        console.error('Error fetching todos:', error);
      }
    };
    fetchTodos();
  }, []); // Remove initialTasks dependency

  const handleTaskDelete = (taskId) => {
    setReminders(prev => prev.filter(task => task.id !== taskId));
    setMessages(prev => prev.map(message => {
      if (message.task && message.task.id === taskId) {
        return {
          ...message,
          task: null,
          content: "This reminder has been deleted."
        };
      }
      return message;
    }));
  };

  const handleTodoToggle = async (todoId) => {
    try {
      const todo = todos.find(t => t.id === todoId);
      if (!todo) return;

      const { error } = await supabase
        .from('todos')
        .update({ completed: !todo.completed })
        .eq('id', todoId);

      if (error) throw error;
      
      setTodos(prev => prev.map(t => 
        t.id === todoId ? { ...t, completed: !t.completed } : t
      ));
    } catch (error) {
      console.error('Error toggling todo:', error);
    }
  };

  const handleSubtaskToggle = async (todoId, subtaskId) => {
    try {
      const todo = todos.find(t => t.id === todoId);
      if (!todo) return;

      const subtask = todo.subtasks?.find(s => s.id === subtaskId);
      if (!subtask) return;

      const { error } = await supabase
        .from('subtasks')
        .update({ completed: !subtask.completed })
        .eq('id', subtaskId);

      if (error) throw error;
      
      setTodos(prev => prev.map(t => {
        if (t.id !== todoId) return t;
        return {
          ...t,
          subtasks: t.subtasks.map(s =>
            s.id === subtaskId ? { ...s, completed: !s.completed } : s
          )
        };
      }));
    } catch (error) {
      console.error('Error toggling subtask:', error);
    }
  };

  const handleTodoDelete = async (todoId) => {
    try {
      const { error } = await supabase
        .from('todos')
        .delete()
        .eq('id', todoId);

      if (error) throw error;
      
      setTodos(prev => prev.filter(todo => todo.id !== todoId));
    } catch (error) {
      console.error('Error deleting todo:', error);
    }
  };

  const handleUserInput = async (input) => {
    setLoading(true);
    const messageId = Date.now().toString();
    
    setMessages(prev => [...prev, { id: messageId + '-user', content: input, type: 'user' }]);
    
    try {
      const response = await geminiService.createTask(input);
      
      if (response.type === 'task') {
        setReminders(prev => [response.data, ...prev]);
        const aiMessageId = messageId + '-ai';
        setNewMessageId(aiMessageId);
        setMessages(prev => [...prev, {
          id: aiMessageId,
          content: `I've set up a reminder based on your request. Here's what I've scheduled:`,
          type: 'ai',
          task: response.data
        }]);
      } else if (response.type === 'multiple_tasks') {
        setReminders(prev => [...response.data, ...prev]);
        const aiMessageId = messageId + '-ai';
        setNewMessageId(aiMessageId);
        setMessages(prev => [...prev, {
          id: aiMessageId,
          content: response.message || `I've set up ${response.data.length} reminders based on your request. Here's what I've scheduled:`,
          type: 'ai',
          tasks: response.data
        }]);
      } else if (response.type === 'todo') {
        setTodos(prev => [response.data, ...prev]);
        const aiMessageId = messageId + '-ai';
        setNewMessageId(aiMessageId);
        setMessages(prev => [...prev, {
          id: aiMessageId,
          content: `I've added "${response.data.title}" to your to-do list.`,
          type: 'ai'
        }]);
      } else if (response.type === 'conversation') {
        const aiMessageId = messageId + '-ai';
        setNewMessageId(aiMessageId);
        setMessages(prev => [...prev, {
          id: aiMessageId,
          content: response.data.response,
          type: 'ai'
        }]);
      }
    } catch (error) {
      console.error('Error processing input:', error);
      const errorMessageId = messageId + '-error';
      setNewMessageId(errorMessageId);
      setMessages(prev => [...prev, {
        id: errorMessageId,
        content: "I'm sorry, I couldn't process your request. Please try again.",
        type: 'ai'
      }]);
    } finally {
      setLoading(false);
      setTimeout(() => setNewMessageId(null), 100);
    }
  };

  // Listen for viewReminders event
  useEffect(() => {
    const handleViewReminders = () => setActiveSection('reminders');
    window.addEventListener('viewReminders', handleViewReminders);
    return () => window.removeEventListener('viewReminders', handleViewReminders);
  }, []);

  const testLogging = async () => {
    console.log('Testing console logs...');
    try {
      await geminiService.testLog();
      const response = await geminiService.createTask('what is today\'s date?');
      console.log('Test response:', response);
    } catch (error) {
      console.error('Test error:', error);
    }
  };

  const sidebarLinks = [
    { 
      href: "#", 
      label: "Chat", 
      icon: <MessageSquare className="w-full h-full" />,
      onClick: () => setActiveSection('chat')
    },
    { 
      href: "#", 
      label: "Reminders", 
      icon: <Bell className="w-full h-full" />,
      onClick: () => setActiveSection('reminders')
    },
    { 
      href: "#", 
      label: "Timeline", 
      icon: <Calendar className="w-full h-full" />,
      onClick: () => setActiveSection('timeline')
    },
  ];

  const bottomLinks = [
    {
      href: "#",
      label: "Profile",
      icon: <User className="w-full h-full" />,
      onClick: () => setActiveSection('profile')
    },
    {
      href: "#",
      label: "Settings",
      icon: <Settings className="w-full h-full" />,
      onClick: () => setActiveSection('settings')
    },
    {
      href: "#",
      label: "Logout",
      icon: <LogOut className="w-full h-full" />,
      onClick: signOut
    }
  ];

  return (
    <Sidebar>
      <div className="fixed inset-0 flex">
        <SidebarBody>
          <div className="flex flex-col h-full pt-4 px-2">
            {/* Main Navigation */}
            <div className="flex-1 space-y-1">
              {sidebarLinks.map((link) => (
                <SidebarLink 
                  key={link.label} 
                  link={{
                    ...link,
                    active: activeSection === link.label.toLowerCase()
                  }}
                />
              ))}
            </div>

            {/* Bottom Navigation */}
            <div className="space-y-1 mb-4">
              {bottomLinks.map((link) => (
                <SidebarLink 
                  key={link.label} 
                  link={link}
                />
              ))}
            </div>

            {/* User Profile */}
            <UserProfile user={user} />
          </div>
        </SidebarBody>

        <main className="flex-1 flex flex-col bg-neutral-900">
          {activeSection === 'chat' && (
            <div className="relative flex flex-col h-full">
              {messages.length === 0 ? (
                <>
                  <div className="flex-1 flex items-center justify-center p-4">
                    <div className="text-center space-y-6 w-full max-w-2xl">
                      <h1 className="text-4xl font-semibold text-white">
                        What can I help with?
                      </h1>
                      <p className="text-neutral-400">
                        Ask me to set reminders or just chat with me!
                      </p>
                    </div>
                  </div>
                  <div className="w-full bg-neutral-900 border-t border-neutral-800 p-4">
                    <div className="max-w-2xl mx-auto">
                      <SearchBar onSearch={handleUserInput} loading={loading} />
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-neutral-800 scrollbar-track-transparent">
                    <div className="max-w-2xl mx-auto px-4 py-4">
                      {messages.map((message) => (
                        <Message 
                          key={message.id}
                          {...message}
                          isNew={message.id === newMessageId}
                          task={message.task ? { ...message.task, onDelete: handleTaskDelete } : null}
                        />
                      ))}
                    </div>
                  </div>
                  <div className="w-full bg-neutral-900 border-t border-neutral-800 p-4">
                    <div className="max-w-2xl mx-auto">
                      <SearchBar onSearch={handleUserInput} loading={loading} />
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
          
          {activeSection === 'timeline' && (
            <div className="h-full overflow-auto p-4">
              <Timeline />
            </div>
          )}
          
          {activeSection === 'reminders' && (
            <div className="h-full overflow-auto">
              <Tasks 
                tasks={reminders}
                todos={todos}
                onTaskDelete={handleTaskDelete}
                onTodoToggle={handleTodoToggle}
                onTodoDelete={handleTodoDelete}
                onSubtaskToggle={handleSubtaskToggle}
              />
            </div>
          )}
        </main>
      </div>
    </Sidebar>
  );
};

export default ChatInterface; 