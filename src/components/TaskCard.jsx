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
        {task.schedule && (
          <div className="flex items-center gap-1 min-w-0">
            <Calendar className="w-4 h-4 flex-shrink-0" />
            <span className="truncate">{task.schedule}</span>
          </div>
        )}
        {task.time && (
          <div className="flex items-center gap-1 min-w-0">
            <Clock className="w-4 h-4 flex-shrink-0" />
            <span className="truncate">{task.time}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default TaskCard; 