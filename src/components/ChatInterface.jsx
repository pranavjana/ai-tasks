import SearchBar from './SearchBar';
import Timeline from './Timeline';
import { Sidebar, SidebarBody, SidebarLink } from './ui/Sidebar';
import { MessageSquare, ListTodo, Calendar } from 'lucide-react';
import { useState } from 'react';

const ChatInterface = () => {
  const [activeSection, setActiveSection] = useState('chat');

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
          <div className="flex-1 w-full flex flex-col items-center justify-center px-4">
            {activeSection === 'chat' && (
              <div className="text-center space-y-6 w-full max-w-2xl">
                <h1 className="text-4xl font-semibold text-white">
                  What can I help with?
                </h1>
                <SearchBar />
              </div>
            )}
            {activeSection === 'timeline' && (
              <Timeline />
            )}
            {activeSection === 'tasks' && (
              <div className="text-center space-y-6 w-full max-w-2xl">
                <h1 className="text-2xl font-semibold text-white">
                  Tasks Coming Soon
                </h1>
              </div>
            )}
          </div>
        </div>
      </div>
    </Sidebar>
  );
};

export default ChatInterface; 