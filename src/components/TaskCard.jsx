import { Calendar, Clock, CheckCircle2, Trash2, Zap } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { cn } from '../lib/utils';
import { useState } from 'react';

const PRIORITY_OPTIONS = [
  { value: 'high', label: 'High' },
  { value: 'medium', label: 'Medium' },
  { value: 'low', label: 'Low' },
];

const getPriorityStyles = (priority) => {
  switch (priority?.toLowerCase()) {
    case 'high':
      return {
        badge: 'bg-red-500/10 text-red-500',
        text: 'text-red-500',
        border: 'border-red-500/20'
      };
    case 'medium':
      return {
        badge: 'bg-yellow-500/10 text-yellow-500',
        text: 'text-yellow-500',
        border: 'border-yellow-500/20'
      };
    case 'low':
      return {
        badge: 'bg-blue-500/10 text-blue-500',
        text: 'text-blue-500',
        border: 'border-blue-500/20'
      };
    default:
      return {
        badge: 'bg-neutral-500/10 text-neutral-500',
        text: 'text-neutral-500',
        border: 'border-neutral-500/20'
      };
  }
};

const getCategoryColor = (category) => {
  switch (category) {
    case 'Work': return 'bg-blue-400';
    case 'Personal': return 'bg-purple-400';
    case 'Health': return 'bg-green-400';
    case 'Shopping': return 'bg-yellow-400';
    case 'Home': return 'bg-orange-400';
    case 'Study': return 'bg-pink-400';
    case 'Social': return 'bg-indigo-400';
    default: return 'bg-neutral-400';
  }
};

const formatDate = (dateString) => {
  // Return early if dateString is empty, null, or undefined
  if (!dateString || dateString.trim() === '') return null;
  
  try {
    // Try to parse the date - handle both ISO strings and date objects
    let date;
    if (dateString instanceof Date) {
      date = dateString;
    } else {
      // For ISO date strings from Supabase
      date = new Date(dateString);
    }

    // Validate the parsed date
    if (isNaN(date.getTime())) {
      console.warn('Invalid date:', dateString);
      return null;
    }

    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    // Set all dates to start of day for comparison
    const dateToCompare = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const todayToCompare = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const tomorrowToCompare = new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate());

    if (dateToCompare.getTime() === todayToCompare.getTime()) {
      return 'Today';
    } else if (dateToCompare.getTime() === tomorrowToCompare.getTime()) {
      return 'Tomorrow';
    } else {
      return date.toLocaleDateString('en-US', { 
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
      });
    }
  } catch (error) {
    console.error('Error formatting date:', error, 'dateString:', dateString);
    return null;
  }
};

const formatTime = (timeString) => {
  // Return early if timeString is empty, null, or undefined
  if (!timeString || timeString.trim() === '') return null;
  
  try {
    // Ensure the timeString is in HH:mm or HH:mm:ss format
    if (!/^\d{2}:\d{2}(:\d{2})?$/.test(timeString)) {
      console.warn('Invalid time format:', timeString);
      return null;
    }
    
    const [hours, minutes] = timeString.split(':');
    const parsedHours = parseInt(hours, 10);
    const parsedMinutes = parseInt(minutes, 10);

    // Validate hours and minutes
    if (parsedHours < 0 || parsedHours > 23 || parsedMinutes < 0 || parsedMinutes > 59) {
      console.warn('Invalid hours or minutes:', timeString);
      return null;
    }

    const date = new Date();
    date.setHours(parsedHours);
    date.setMinutes(parsedMinutes);
    date.setSeconds(0);
    
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  } catch (error) {
    console.error('Error formatting time:', error, 'timeString:', timeString);
    return null;
  }
};

const TaskCard = ({ task, onDelete, onUpdate }) => {
  const [isPriorityOpen, setIsPriorityOpen] = useState(false);
  
  const handleDelete = async () => {
    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', task.id);

      if (error) throw error;
      
      onDelete?.(task.id);
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  };

  const handlePriorityChange = async (newPriority) => {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .update({ priority: newPriority })
        .eq('id', task.id)
        .select()
        .single();

      if (error) throw error;
      
      // Update the UI with the new task data
      onUpdate?.(data);
      setIsPriorityOpen(false);
    } catch (error) {
      console.error('Error updating priority:', error);
    }
  };

  const priorityStyles = getPriorityStyles(task.priority);

  return (
    <div className={cn(
      "group relative bg-neutral-800/50 backdrop-blur-sm rounded-lg p-4 space-y-3",
      "border border-neutral-700/50 hover:border-neutral-600/50 transition-colors",
      priorityStyles.border
    )}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-white font-medium text-sm break-words">{task.title}</h3>
            <div className="flex items-center gap-1.5">
              <div className="relative">
                <button
                  onClick={() => setIsPriorityOpen(!isPriorityOpen)}
                  className={cn(
                    "px-2 py-0.5 text-xs rounded-full whitespace-nowrap",
                    priorityStyles.badge,
                    "hover:ring-2 hover:ring-neutral-600 focus:outline-none focus:ring-2 focus:ring-neutral-600"
                  )}
                >
                  {task.priority || 'medium'}
                </button>
                
                {isPriorityOpen && (
                  <div className="absolute top-full left-0 mt-1 w-24 py-1 bg-neutral-800 rounded-lg shadow-lg border border-neutral-700 z-50">
                    {PRIORITY_OPTIONS.map((option) => {
                      const optionStyles = getPriorityStyles(option.value);
                      return (
                        <button
                          key={option.value}
                          onClick={() => handlePriorityChange(option.value)}
                          className={cn(
                            "w-full px-3 py-1.5 text-xs text-left hover:bg-neutral-700/50",
                            optionStyles.text
                          )}
                        >
                          {option.label}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
              {task.category && (
                <span className={cn(
                  "px-2 py-0.5 text-xs rounded-full bg-neutral-700/50 text-neutral-300 whitespace-nowrap"
                )}>
                  {task.category}
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button 
            className="p-1 rounded-md transition-colors flex-shrink-0 text-red-400 hover:text-red-300 hover:bg-red-400/10 opacity-0 group-hover:opacity-100"
            onClick={handleDelete}
          >
            <Trash2 className="w-4 h-4" />
          </button>
          <button 
            className={`p-1 rounded-md transition-colors flex-shrink-0 ${
              task.completed 
                ? 'text-green-400 hover:text-green-300' 
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <CheckCircle2 className="w-5 h-5" />
          </button>
        </div>
      </div>
      
      {task.description && (
        <p className="text-sm text-neutral-400 break-words line-clamp-2 hover:line-clamp-none transition-all">
          {task.description}
        </p>
      )}
      
      <div className="flex flex-wrap items-center gap-3 text-xs text-neutral-400">
        {task.schedule && formatDate(task.schedule) && (
          <div className="flex items-center gap-1 min-w-0">
            <Calendar className="w-3.5 h-3.5" />
            <span className="truncate">{formatDate(task.schedule)}</span>
          </div>
        )}
        {task.time && formatTime(task.time) && (
          <div className="flex items-center gap-1 min-w-0">
            <Clock className="w-3.5 h-3.5" />
            <span className="truncate">{formatTime(task.time)}</span>
          </div>
        )}
      </div>

      {task.ai_suggestion && (
        <div className="mt-2 text-xs flex items-center gap-1.5 text-purple-400">
          <Zap className="w-3.5 h-3.5" />
          <span>{task.ai_suggestion}</span>
        </div>
      )}
    </div>
  );
};

export default TaskCard; 