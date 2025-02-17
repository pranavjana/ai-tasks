import { Calendar, Clock, CheckCircle2 } from 'lucide-react';

const TaskCard = ({ task }) => {
  return (
    <div className="bg-neutral-800 rounded-lg p-4 space-y-3">
      <div className="flex items-start justify-between">
        <h3 className="text-white font-medium">{task.title}</h3>
        <button 
          className={`p-1 rounded-md transition-colors ${
            task.completed 
              ? 'text-green-400 hover:text-green-300' 
              : 'text-neutral-400 hover:text-white'
          }`}
        >
          <CheckCircle2 className="w-5 h-5" />
        </button>
      </div>
      
      {task.description && (
        <p className="text-sm text-neutral-400">{task.description}</p>
      )}
      
      <div className="flex items-center gap-4 text-xs text-neutral-500">
        {task.schedule && (
          <div className="flex items-center gap-1">
            <Calendar className="w-4 h-4" />
            <span>{task.schedule}</span>
          </div>
        )}
        {task.time && (
          <div className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            <span>{task.time}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default TaskCard; 