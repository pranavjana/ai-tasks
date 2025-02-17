import SearchBar from './SearchBar';
import Timeline from './Timeline';
import Tasks from './Tasks';
import TaskCard from './TaskCard';
import { Sidebar, SidebarBody, SidebarLink } from './ui/Sidebar';
import { MessageSquare, Bell, Calendar, ArrowRight, LayoutDashboard, User, Settings, LogOut } from 'lucide-react';
import { useState, useEffect } from 'react';
import geminiService from '../services/gemini';
import Button from './Button';
import { useAuth } from '../contexts/AuthContext';

const Message = ({ content, type = 'user', task }) => (
  <div className={`flex ${type === 'user' ? 'justify-end' : 'justify-start'} mb-4`}>
    <div className={`max-w-[80%] rounded-lg p-3 ${
      type === 'user' 
        ? 'bg-black text-white rounded-br-none' 
        : 'bg-neutral-800 text-white rounded-bl-none'
    }`}>
      {content}
      {task && (
        <div className="mt-4">
          <TaskCard task={task} />
          <div className="mt-2">
            <Button 
              size="sm" 
              className="w-full"
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

const ChatInterface = ({ initialTasks = [] }) => {
  const [activeSection, setActiveSection] = useState('chat');
  const [reminders, setReminders] = useState(initialTasks);
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState([]);
  const { user, signOut } = useAuth();

  useEffect(() => {
    setReminders(initialTasks);
  }, [initialTasks]);

  const handleUserInput = async (input) => {
    setLoading(true);
    // Add user message
    setMessages(prev => [...prev, { content: input, type: 'user' }]);
    
    try {
      const response = await geminiService.createTask(input);
      
      if (response.type === 'task') {
        // Handle reminder creation
        setReminders(prev => [response.data, ...prev]);
        setMessages(prev => [...prev, {
          content: `I've set up a reminder based on your request. Here's what I've scheduled:`,
          type: 'ai',
          task: response.data
        }]);
      } else if (response.type === 'conversation') {
        // Handle general conversation
        setMessages(prev => [...prev, {
          content: response.data.response,
          type: 'ai'
        }]);
      }
    } catch (error) {
      console.error('Error processing input:', error);
      setMessages(prev => [...prev, {
        content: "I'm sorry, I couldn't process your request. Please try again.",
        type: 'ai'
      }]);
    } finally {
      setLoading(false);
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
      icon: <MessageSquare className="w-4 h-4" />,
      onClick: () => setActiveSection('chat')
    },
    { 
      href: "#", 
      label: "Reminders", 
      icon: <Bell className="w-4 h-4" />,
      onClick: () => setActiveSection('reminders')
    },
    { 
      href: "#", 
      label: "Timeline", 
      icon: <Calendar className="w-4 h-4" />,
      onClick: () => setActiveSection('timeline')
    },
  ];

  const bottomLinks = [
    {
      href: "#",
      label: "Profile",
      icon: <User className="w-4 h-4" />,
      onClick: () => setActiveSection('profile')
    },
    {
      href: "#",
      label: "Settings",
      icon: <Settings className="w-4 h-4" />,
      onClick: () => setActiveSection('settings')
    },
    {
      href: "#",
      label: "Logout",
      icon: <LogOut className="w-4 h-4" />,
      onClick: signOut
    }
  ];

  return (
    <Sidebar>
      <div className="fixed inset-0 flex">
        <SidebarBody>
          <div className="flex flex-col h-full">
            {/* Main Navigation */}
            <div className="flex-1 space-y-1 pt-4">
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
            <div className="border-t border-neutral-800 pt-4 mt-4 space-y-1">
              {bottomLinks.map((link) => (
                <SidebarLink 
                  key={link.label} 
                  link={link}
                />
              ))}
            </div>

            {/* User Profile */}
            <div className="border-t border-neutral-800 pt-4 mt-4">
              <div className="flex items-center gap-3 px-2 py-2">
                <div className="w-8 h-8 rounded-full bg-neutral-800 flex items-center justify-center">
                  {user?.email?.[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white truncate">
                    {user?.email}
                  </p>
                </div>
              </div>
            </div>
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
                      {messages.map((message, index) => (
                        <Message key={index} {...message} />
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
              <Tasks tasks={reminders} />
            </div>
          )}
        </main>
      </div>
    </Sidebar>
  );
};

export default ChatInterface; 