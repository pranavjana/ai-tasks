import { Calendar, Clock, CheckCircle2, Trash2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { cn } from '../lib/utils';

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

const TaskCard = ({ task, onDelete }) => {
  const handleDelete = async () => {
    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', task.id);

      if (error) throw error;
      
      // Notify parent component to update UI
      onDelete?.(task.id);
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  };

  return (
    <div className={cn(
      "relative bg-neutral-800/50 backdrop-blur-sm rounded-lg p-4 space-y-3 w-full overflow-hidden",
      "before:absolute before:left-0 before:top-0 before:bottom-0 before:w-1",
      getCategoryColor(task.category).replace('bg-', 'before:bg-')
    )}>
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-white font-medium text-sm break-words">{task.title}</h3>
        <div className="flex items-center gap-2">
          <button 
            className="p-1 rounded-md transition-colors flex-shrink-0 text-red-400 hover:text-red-300 hover:bg-red-400/10"
            onClick={handleDelete}
          >
            <Trash2 className="w-5 h-5" />
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
      
      <div className="flex flex-wrap items-center gap-3 text-xs text-neutral-500">
        {task.schedule && formatDate(task.schedule) && (
          <div className="flex items-center gap-1 min-w-0">
            <Calendar className="w-4 h-4 flex-shrink-0" />
            <span className="truncate">{formatDate(task.schedule)}</span>
          </div>
        )}
        {task.time && formatTime(task.time) && (
          <div className="flex items-center gap-1 min-w-0">
            <Clock className="w-4 h-4 flex-shrink-0" />
            <span className="truncate">{formatTime(task.time)}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default TaskCard; 