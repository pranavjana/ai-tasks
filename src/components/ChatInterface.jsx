import SearchBar from './SearchBar';
import Timeline from './Timeline';
import Tasks from './Tasks';
import TaskCard from './TaskCard';
import { Sidebar, SidebarBody, SidebarLink, useSidebar } from './ui/Sidebar';
import { MessageSquare, Bell, Calendar, ArrowRight, LayoutDashboard, User, Settings, LogOut } from 'lucide-react';
import { useState, useEffect } from 'react';
import geminiService from '../services/gemini';
import Button from './Button';
import { useAuth } from '../contexts/AuthContext';
import { cn } from '../lib/utils';
import TypewriterEffect from './TypewriterEffect';

const Message = ({ content, type = 'user', task, isNew }) => (
  <div className={`flex ${type === 'user' ? 'justify-end' : 'justify-start'} mb-4`}>
    <div className={`max-w-[80%] rounded-lg p-3 ${
      type === 'user' 
        ? 'bg-neutral-800 text-white rounded-br-none' 
        : 'bg-transparent text-white rounded-bl-none'
    }`}>
      {type === 'user' || !isNew ? content : (
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
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState([]);
  const [newMessageId, setNewMessageId] = useState(null);
  const { user, signOut } = useAuth();

  useEffect(() => {
    setReminders(initialTasks);
  }, [initialTasks]);

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

  const handleUserInput = async (input) => {
    setLoading(true);
    const messageId = Date.now().toString(); // Generate unique ID for new message
    
    // Add user message
    setMessages(prev => [...prev, { id: messageId + '-user', content: input, type: 'user' }]);
    
    try {
      const response = await geminiService.createTask(input);
      
      if (response.type === 'task') {
        // Handle reminder creation
        setReminders(prev => [response.data, ...prev]);
        const aiMessageId = messageId + '-ai';
        setNewMessageId(aiMessageId); // Set this as the new message
        setMessages(prev => [...prev, {
          id: aiMessageId,
          content: `I've set up a reminder based on your request. Here's what I've scheduled:`,
          type: 'ai',
          task: response.data
        }]);
      } else if (response.type === 'conversation') {
        // Handle general conversation
        const aiMessageId = messageId + '-ai';
        setNewMessageId(aiMessageId); // Set this as the new message
        setMessages(prev => [...prev, {
          id: aiMessageId,
          content: response.data.response,
          type: 'ai'
        }]);
      }
    } catch (error) {
      console.error('Error processing input:', error);
      const errorMessageId = messageId + '-error';
      setNewMessageId(errorMessageId); // Set this as the new message
      setMessages(prev => [...prev, {
        id: errorMessageId,
        content: "I'm sorry, I couldn't process your request. Please try again.",
        type: 'ai'
      }]);
    } finally {
      setLoading(false);
      // Clear the new message ID after a short delay
      setTimeout(() => setNewMessageId(null), 100);
    }
  };

  // Listen for viewReminders event
  useEffect(() => {
    const handleViewReminders = () => setActiveSection('reminders');
    window.addEventListener('viewReminders', handleViewReminders);
    return () => window.removeEventListener('viewReminders', handleViewReminders);
  }, []);

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
                onTaskDelete={handleTaskDelete}
              />
            </div>
          )}
        </main>
      </div>
    </Sidebar>
  );
};

export default ChatInterface; 