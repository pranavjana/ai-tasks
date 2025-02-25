import { useState, useMemo } from 'react';
import TaskCard from './TaskCard';
import Todos from './Todos';
import { cn } from '../lib/utils';
import { format, isToday, isTomorrow, addDays, startOfWeek, addWeeks, subWeeks } from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const ToggleGroup = ({ activeView, onViewChange }) => (
  <div className="flex items-center gap-2 p-2 bg-neutral-800/50 rounded-lg">
    <button
      onClick={() => onViewChange('tasks')}
      className={cn(
        "px-4 py-2 rounded-md text-sm font-medium transition-all",
        activeView === 'tasks' 
          ? "bg-neutral-800 text-white shadow-sm" 
          : "text-neutral-400 hover:text-white"
      )}
    >
      Tasks
    </button>
    <button
      onClick={() => onViewChange('todos')}
      className={cn(
        "px-4 py-2 rounded-md text-sm font-medium transition-all",
        activeView === 'todos' 
          ? "bg-neutral-800 text-white shadow-sm" 
          : "text-neutral-400 hover:text-white"
      )}
    >
      Todo
    </button>
  </div>
);

const DayColumn = ({ date, tasks = [], onTaskDelete, onTaskUpdate }) => {
  const dayLabel = useMemo(() => {
    if (isToday(date)) return 'Today';
    if (isTomorrow(date)) return 'Tomorrow';
    return format(date, 'EEEE');
  }, [date]);

  const dateLabel = format(date, 'MMM d');

  return (
    <div className="flex-1 min-w-[200px] border-r border-neutral-800 last:border-r-0">
      <div className="p-3 border-b border-neutral-800 text-center">
        <h3 className="text-sm font-medium text-white">{dayLabel}</h3>
        <p className="text-xs text-neutral-400">{dateLabel}</p>
      </div>
      <div className="p-2 space-y-2 min-h-[calc(100vh-13rem)]">
        {tasks.map((task) => (
          <TaskCard 
            key={task.id} 
            task={task} 
            onDelete={onTaskDelete}
            onUpdate={onTaskUpdate}
          />
        ))}
      </div>
    </div>
  );
};

const Tasks = ({ 
  tasks = [], 
  todos = [], 
  onTaskDelete, 
  onSubtaskToggle, 
  onTodoDelete 
}) => {
  const [activeView, setActiveView] = useState('tasks');
  const [currentWeekStart, setCurrentWeekStart] = useState(new Date());

  // Add handler for task updates
  const handleTaskUpdate = (updatedTask) => {
    const updatedTasks = tasks.map(task => 
      task.id === updatedTask.id ? updatedTask : task
    );
    // Update the tasks array in the parent component
    if (typeof window !== 'undefined') {
      const event = new CustomEvent('tasksUpdated', { detail: updatedTasks });
      window.dispatchEvent(event);
    }
  };

  // Navigation functions
  const handlePreviousWeek = () => {
    setCurrentWeekStart(prev => subWeeks(prev, 1));
  };

  const handleNextWeek = () => {
    setCurrentWeekStart(prev => addWeeks(prev, 1));
  };

  const handleCurrentWeek = () => {
    setCurrentWeekStart(new Date());
  };

  // Generate dates for the current week view
  const weekDates = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => addDays(currentWeekStart, i));
  }, [currentWeekStart]);

  // Group tasks by date
  const tasksByDate = useMemo(() => {
    return weekDates.reduce((acc, date) => {
      const tasksForDate = tasks.filter(task => {
        if (!task.schedule) return false;
        const taskDate = new Date(task.schedule);
        return (
          taskDate.getFullYear() === date.getFullYear() &&
          taskDate.getMonth() === date.getMonth() &&
          taskDate.getDate() === date.getDate()
        );
      }).sort((a, b) => {
        if (!a.time || !b.time) return 0;
        return a.time.localeCompare(b.time);
      });

      acc[date.toISOString()] = tasksForDate;
      return acc;
    }, {});
  }, [tasks, weekDates]);

  // Check if current view is the current week
  const isCurrentWeek = useMemo(() => {
    const today = new Date();
    return (
      today.getFullYear() === currentWeekStart.getFullYear() &&
      today.getMonth() === currentWeekStart.getMonth() &&
      today.getDate() >= currentWeekStart.getDate() &&
      today.getDate() < addDays(currentWeekStart, 7).getDate()
    );
  }, [currentWeekStart]);

  return (
    <div className="h-full flex flex-col bg-neutral-900">
      {/* Header with toggle buttons and navigation */}
      <div className="sticky top-0 z-10 bg-neutral-900 border-b border-neutral-800 p-4">
        <div className="max-w-7xl mx-auto space-y-4">
          <div className="flex items-center justify-between">
            <ToggleGroup activeView={activeView} onViewChange={setActiveView} />
            {activeView === 'tasks' && (
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePreviousWeek}
                  className="p-2 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-lg transition-colors"
                  aria-label="Previous week"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                {!isCurrentWeek && (
                  <button
                    onClick={handleCurrentWeek}
                    className="px-3 py-1.5 text-sm text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-lg transition-colors"
                  >
                    Today
                  </button>
                )}
                <button
                  onClick={handleNextWeek}
                  className="p-2 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-lg transition-colors"
                  aria-label="Next week"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>
          {activeView === 'tasks' && (
            <div className="text-center">
              <span className="text-sm text-neutral-400">
                {format(currentWeekStart, 'MMMM d')} - {format(addDays(currentWeekStart, 6), 'MMMM d, yyyy')}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-hidden">
        {activeView === 'tasks' ? (
          <div className="h-full overflow-x-auto">
            <div className="flex min-w-full h-full">
              {weekDates.map((date) => (
                <DayColumn
                  key={date.toISOString()}
                  date={date}
                  tasks={tasksByDate[date.toISOString()] || []}
                  onTaskDelete={onTaskDelete}
                  onTaskUpdate={handleTaskUpdate}
                />
              ))}
            </div>
          </div>
        ) : (
          <div className="h-full overflow-y-auto p-4">
            <Todos
              todos={todos}
              onSubtaskToggle={onSubtaskToggle}
              onDelete={onTodoDelete}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default Tasks; 