import SearchBar from './SearchBar';
import Timeline from './Timeline';
import Tasks from './Tasks';
import TaskCard from './TaskCard';
import { Sidebar, SidebarBody, SidebarLink } from './ui/Sidebar';
import { MessageSquare, ListTodo, Calendar, ArrowRight } from 'lucide-react';
import { useState } from 'react';
import geminiService from '../services/gemini';
import Button from './Button';

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
              onClick={() => window.dispatchEvent(new CustomEvent('viewTasks'))}
            >
              View in Tasks <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      )}
    </div>
  </div>
);

const ChatInterface = () => {
  const [activeSection, setActiveSection] = useState('chat');
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState([]);

  const handleTaskCreation = async (input) => {
    setLoading(true);
    // Add user message
    setMessages(prev => [...prev, { content: input, type: 'user' }]);
    
    try {
      const taskJson = await geminiService.createTask(input);
      setTasks(prevTasks => [...prevTasks, taskJson]);
      
      // Add AI response with task card
      setMessages(prev => [...prev, {
        content: `I've created a task based on your request. Here's what I've set up:`,
        type: 'ai',
        task: taskJson
      }]);
    } catch (error) {
      console.error('Error creating task:', error);
      setMessages(prev => [...prev, {
        content: "I'm sorry, I couldn't create the task. Please try again.",
        type: 'ai'
      }]);
    } finally {
      setLoading(false);
    }
  };

  // Listen for viewTasks event
  useState(() => {
    const handleViewTasks = () => setActiveSection('tasks');
    window.addEventListener('viewTasks', handleViewTasks);
    return () => window.removeEventListener('viewTasks', handleViewTasks);
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
      label: "Tasks", 
      icon: <ListTodo className="w-4 h-4" />,
      onClick: () => setActiveSection('tasks')
    },
    { 
      href: "#", 
      label: "Timeline", 
      icon: <Calendar className="w-4 h-4" />,
      onClick: () => setActiveSection('timeline')
    },
  ];

  return (
    <Sidebar>
      <div className="flex h-screen">
        <SidebarBody>
          <div className="flex flex-col h-full">
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
          </div>
        </SidebarBody>

        <div className="flex-1 flex flex-col bg-neutral-900">
          <div className="flex-1 w-full flex flex-col px-4">
            {activeSection === 'chat' && (
              <div className="flex flex-col h-full">
                {messages.length === 0 ? (
                  <div className="flex-1 flex items-center justify-center">
                    <div className="text-center space-y-6 w-full max-w-2xl">
                      <h1 className="text-4xl font-semibold text-white">
                        What can I help with?
                      </h1>
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 overflow-y-auto py-4 custom-scrollbar">
                    <div className="max-w-2xl mx-auto">
                      {messages.map((message, index) => (
                        <Message key={index} {...message} />
                      ))}
                    </div>
                  </div>
                )}
                <div className="py-4 max-w-2xl mx-auto w-full">
                  <SearchBar onSearch={handleTaskCreation} loading={loading} />
                </div>
              </div>
            )}
            {activeSection === 'timeline' && (
              <div className="flex-1 flex items-center justify-center">
                <Timeline />
              </div>
            )}
            {activeSection === 'tasks' && (
              <Tasks tasks={tasks} />
            )}
          </div>
        </div>
      </div>
    </Sidebar>
  );
};

export default ChatInterface; 