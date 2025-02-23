import { useState, useMemo } from 'react';
import TaskCard from './TaskCard';
import Todos from './Todos';
import { cn } from '../lib/utils';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const DaySelector = ({ selectedDate, onDateChange }) => {
  const dates = useMemo(() => {
    const today = new Date();
    return Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(today.getDate() + i);
      return date;
    });
  }, []);

  const formatDate = (date) => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return 'Tomorrow';
    } else {
      return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    }
  };

  const isSelected = (date) => 
    date.toDateString() === selectedDate.toDateString();

  const isToday = (date) =>
    date.toDateString() === new Date().toDateString();

  return (
    <div className="flex items-center gap-2 px-4 py-3 overflow-x-auto hide-scrollbar">
      {dates.map((date) => (
        <button
          key={date.toISOString()}
          onClick={() => onDateChange(date)}
          className={cn(
            "flex-shrink-0 px-4 py-2 rounded-lg transition-colors text-sm font-medium",
            isSelected(date) 
              ? "bg-neutral-800 text-white" 
              : "text-neutral-400 hover:text-white hover:bg-neutral-800/50",
            isToday(date) && !isSelected(date) && "ring-1 ring-neutral-700"
          )}
        >
          {formatDate(date)}
        </button>
      ))}
    </div>
  );
};

const ToggleButton = ({ active, children, onClick }) => (
  <button
    onClick={onClick}
    className={cn(
      "px-4 py-2 text-sm font-medium rounded-lg transition-colors",
      active ? "bg-neutral-800 text-white" : "text-neutral-400 hover:text-white hover:bg-neutral-800/50"
    )}
  >
    {children}
  </button>
);

const CategorySection = ({ category, tasks, onTaskDelete }) => (
  <div className="space-y-3">
    <h2 className="text-lg font-semibold text-white flex items-center gap-2">
      <span className={`w-2 h-2 rounded-full ${
        category === 'Work' ? 'bg-blue-400' :
        category === 'Personal' ? 'bg-purple-400' :
        category === 'Health' ? 'bg-green-400' :
        category === 'Shopping' ? 'bg-yellow-400' :
        category === 'Home' ? 'bg-orange-400' :
        category === 'Study' ? 'bg-pink-400' :
        category === 'Social' ? 'bg-indigo-400' :
        'bg-neutral-400'
      }`} />
      {category}
    </h2>
    <div className="space-y-3">
      {tasks.map((task) => (
        <TaskCard 
          key={task.id} 
          task={task} 
          onDelete={onTaskDelete}
        />
      ))}
    </div>
  </div>
);

const Tasks = ({ 
  tasks = [], 
  todos = [], 
  onTaskDelete, 
  onSubtaskToggle, 
  onTodoDelete 
}) => {
  const [activeView, setActiveView] = useState('tasks');
  const [selectedDate, setSelectedDate] = useState(new Date());

  // Filter tasks for the selected date
  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      // Return early if schedule is empty, null, or undefined
      if (!task.schedule || task.schedule.trim() === '') return false;
      
      try {
        // Parse the schedule date from Supabase (ISO string)
        const taskDate = new Date(task.schedule);

        if (isNaN(taskDate.getTime())) {
          console.warn('Invalid date:', task.schedule);
          return false;
        }

        // Set both dates to start of day for comparison
        const taskDateStart = new Date(
          taskDate.getFullYear(),
          taskDate.getMonth(),
          taskDate.getDate()
        );
        const selectedDateStart = new Date(
          selectedDate.getFullYear(),
          selectedDate.getMonth(),
          selectedDate.getDate()
        );
        
        return taskDateStart.getTime() === selectedDateStart.getTime();
      } catch (error) {
        console.error('Error comparing dates:', error, 'schedule:', task.schedule);
        return false;
      }
    });
  }, [tasks, selectedDate]);

  // Sort tasks by time
  const sortedTasks = useMemo(() => {
    return [...filteredTasks].sort((a, b) => {
      if (!a.time && !b.time) return 0;
      if (!a.time) return 1;
      if (!b.time) return -1;
      
      try {
        // Validate time format
        if (!/^\d{2}:\d{2}(:\d{2})?$/.test(a.time) || !/^\d{2}:\d{2}(:\d{2})?$/.test(b.time)) {
          console.warn('Invalid time format:', { timeA: a.time, timeB: b.time });
          return 0;
        }
        
        // Parse time strings and compare
        const [hoursA, minutesA] = a.time.split(':');
        const [hoursB, minutesB] = b.time.split(':');
        
        const parsedHoursA = parseInt(hoursA, 10);
        const parsedMinutesA = parseInt(minutesA, 10);
        const parsedHoursB = parseInt(hoursB, 10);
        const parsedMinutesB = parseInt(minutesB, 10);

        // Validate hours and minutes
        if (
          parsedHoursA < 0 || parsedHoursA > 23 || parsedMinutesA < 0 || parsedMinutesA > 59 ||
          parsedHoursB < 0 || parsedHoursB > 23 || parsedMinutesB < 0 || parsedMinutesB > 59
        ) {
          console.warn('Invalid hours or minutes:', { timeA: a.time, timeB: b.time });
          return 0;
        }

        const timeA = new Date(1970, 0, 1, parsedHoursA, parsedMinutesA);
        const timeB = new Date(1970, 0, 1, parsedHoursB, parsedMinutesB);
        
        return timeA.getTime() - timeB.getTime();
      } catch (error) {
        console.error('Error comparing times:', error, { timeA: a.time, timeB: b.time });
        return 0;
      }
    });
  }, [filteredTasks]);

  // Group tasks by category
  const groupedTasks = sortedTasks.reduce((acc, task) => {
    const category = task.category || 'Other';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(task);
    return acc;
  }, {});

  // Sort categories to ensure consistent order
  const categories = [
    'Work',
    'Personal',
    'Health',
    'Shopping',
    'Home',
    'Study',
    'Social',
    'Other'
  ].filter(category => groupedTasks[category]?.length > 0);

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* View Toggle */}
      <div className="sticky top-0 z-10 bg-neutral-900 border-b border-neutral-800">
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ToggleButton
              active={activeView === 'tasks'}
              onClick={() => setActiveView('tasks')}
            >
              Tasks
            </ToggleButton>
            <ToggleButton
              active={activeView === 'todos'}
              onClick={() => setActiveView('todos')}
            >
              To-Dos
            </ToggleButton>
          </div>
        </div>
        
        {/* Day Selector - Only show for tasks view */}
        {activeView === 'tasks' && (
          <DaySelector 
            selectedDate={selectedDate}
            onDateChange={setSelectedDate}
          />
        )}
      </div>

      {/* Content */}
      {activeView === 'tasks' ? (
        <div className="p-4">
          {filteredTasks.length === 0 ? (
            <div className="text-center text-neutral-500">
              No tasks for {selectedDate.toLocaleDateString('en-US', { 
                weekday: 'long',
                month: 'long',
                day: 'numeric'
              })}
            </div>
          ) : (
            <div className="space-y-8">
              {categories.map((category) => (
                <CategorySection
                  key={category}
                  category={category}
                  tasks={groupedTasks[category]}
                  onTaskDelete={onTaskDelete}
                />
              ))}
            </div>
          )}
        </div>
      ) : (
        <Todos
          todos={todos}
          onDelete={onTodoDelete}
          onSubtaskToggle={onSubtaskToggle}
        />
      )}
    </div>
  );
};

export default Tasks; 