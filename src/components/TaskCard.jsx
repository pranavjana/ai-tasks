import { Calendar, Clock, CheckCircle2 } from 'lucide-react';

const TaskCard = ({ task }) => {
  return (
    <div className="bg-neutral-800/50 backdrop-blur-sm rounded-lg p-4 space-y-3 w-full overflow-hidden">
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-white font-medium text-sm break-words">{task.title}</h3>
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