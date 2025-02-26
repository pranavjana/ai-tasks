import { CheckCircle2, Circle, Trash2, ChevronRight, Calendar, FileText, Plus } from 'lucide-react';
import { cn } from '../lib/utils';
import { useState } from 'react';
import { 
  parseISO, 
  isValid, 
  format, 
  isToday, 
  isTomorrow, 
  startOfDay,
  setDefaultOptions
} from 'date-fns';
import NotePage from './NotePage';
import { AnimatePresence, motion } from 'framer-motion';

// Set default options for date-fns
setDefaultOptions({ weekStartsOn: 1 }); // Monday as week start

const formatDueDate = (dateString) => {
  if (!dateString) return null;
  
  try {
    const date = parseISO(dateString);
    if (!isValid(date)) {
      console.log('Invalid date:', dateString);
      return null;
    }

    if (isToday(date)) {
      return 'Today';
    } else if (isTomorrow(date)) {
      return 'Tomorrow';
    } else {
      return format(date, 'MMM d');
    }
  } catch (error) {
    console.error('Error formatting date:', error);
    return null;
  }
};

const SubtaskItem = ({ subtask, onToggle, parentId }) => {
  const [showNotes, setShowNotes] = useState(false);

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          "group flex items-start gap-3 pl-8 py-2",
          "hover:bg-neutral-800/30 rounded-lg transition-colors"
        )}
      >
        <button 
          onClick={() => onToggle(parentId, subtask.id)}
          className="flex-shrink-0 mt-0.5"
        >
          {subtask.completed ? (
            <CheckCircle2 className="w-4 h-4 text-purple-400" />
          ) : (
            <Circle className="w-4 h-4 text-neutral-400 group-hover:text-white" />
          )}
        </button>
        
        <button 
          onClick={() => setShowNotes(true)}
          className={cn(
            "text-sm break-words flex-1 text-left transition-colors",
            subtask.completed ? "text-neutral-400 line-through" : "text-white"
          )}
        >
          {subtask.content}
        </button>

        {subtask.notes && (
          <button
            onClick={() => setShowNotes(true)}
            className="flex-shrink-0 p-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity text-neutral-400 hover:text-white hover:bg-neutral-800"
          >
            <FileText className="w-4 h-4" />
          </button>
        )}
      </motion.div>

      <AnimatePresence>
        {showNotes && (
          <NotePage 
            subtask={subtask} 
            onClose={() => setShowNotes(false)} 
          />
        )}
      </AnimatePresence>
    </>
  );
};

const TodoItem = ({ todo, onDelete, onSubtaskToggle }) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const hasSubtasks = todo.subtasks && todo.subtasks.length > 0;
  const formattedDueDate = formatDueDate(todo.due_date);

  // Calculate if all subtasks are completed
  const allSubtasksCompleted = hasSubtasks && 
    todo.subtasks.every(subtask => subtask.completed);
  
  // Calculate completion percentage
  const completionPercentage = hasSubtasks
    ? Math.round((todo.subtasks.filter(s => s.completed).length / todo.subtasks.length) * 100)
    : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "group rounded-xl transition-all",
        "bg-neutral-800/30 backdrop-blur-sm border border-neutral-700/50",
        "hover:border-neutral-600/50"
      )}
    >
      <div className="flex items-start gap-3 p-4">
        {hasSubtasks ? (
          <button 
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex-shrink-0 mt-1 p-0.5 rounded-md text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
          >
            <ChevronRight className={cn(
              "w-4 h-4 transition-transform",
              isExpanded && "rotate-90"
            )} />
          </button>
        ) : (
          <div className="w-5" /> /* Spacer for alignment */
        )}
        
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className={cn(
                  "text-sm font-medium break-words",
                  allSubtasksCompleted ? "text-neutral-400" : "text-white"
                )}>
                  {todo.title}
                </h3>
                {formattedDueDate && (
                  <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-neutral-700/50 text-xs text-neutral-300">
                    <Calendar className="w-3 h-3" />
                    <span>{formattedDueDate}</span>
                  </div>
                )}
              </div>
              
              {hasSubtasks && (
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-1 bg-neutral-700/50 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-purple-400 rounded-full transition-all duration-500"
                      style={{ width: `${completionPercentage}%` }}
                    />
                  </div>
                  <span className="text-xs text-neutral-400">
                    {completionPercentage}%
                  </span>
                </div>
              )}
            </div>

            <button 
              onClick={() => onDelete(todo.id)}
              className="flex-shrink-0 p-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity text-red-400 hover:text-red-300 hover:bg-red-400/10"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Subtasks */}
      {hasSubtasks && isExpanded && (
        <div className="pb-2">
          {todo.subtasks.map((subtask) => (
            <SubtaskItem
              key={subtask.id}
              subtask={subtask}
              parentId={todo.id}
              onToggle={onSubtaskToggle}
            />
          ))}
        </div>
      )}
    </motion.div>
  );
};

const Todos = ({ todos = [], onDelete, onSubtaskToggle }) => {
  // Group todos by whether all their subtasks are completed
  const completedTodos = todos.filter(todo => 
    todo.subtasks && 
    todo.subtasks.length > 0 && 
    todo.subtasks.every(subtask => subtask.completed)
  );
  const incompleteTodos = todos.filter(todo => 
    !todo.subtasks || 
    todo.subtasks.length === 0 || 
    !todo.subtasks.every(subtask => subtask.completed)
  );

  return (
    <div className="w-full max-w-2xl mx-auto">
      {todos.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-4 py-12">
          <div className="p-4 rounded-full bg-neutral-800/50">
            <Plus className="w-6 h-6 text-neutral-400" />
          </div>
          <div className="text-center">
            <p className="text-neutral-400">No to-dos yet</p>
            <p className="text-sm text-neutral-500">Try asking me to create one!</p>
          </div>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Incomplete To-dos */}
          {incompleteTodos.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <h2 className="text-sm font-medium text-white">
                  In Progress
                </h2>
                <span className="text-xs text-neutral-500">
                  {incompleteTodos.length} {incompleteTodos.length === 1 ? 'task' : 'tasks'}
                </span>
              </div>
              <div className="space-y-3">
                {incompleteTodos.map((todo) => (
                  <TodoItem
                    key={todo.id}
                    todo={todo}
                    onDelete={onDelete}
                    onSubtaskToggle={onSubtaskToggle}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Completed To-dos */}
          {completedTodos.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <h2 className="text-sm font-medium text-neutral-400">
                  Completed
                </h2>
                <span className="text-xs text-neutral-500">
                  {completedTodos.length} {completedTodos.length === 1 ? 'task' : 'tasks'}
                </span>
              </div>
              <div className="space-y-3">
                {completedTodos.map((todo) => (
                  <TodoItem
                    key={todo.id}
                    todo={todo}
                    onDelete={onDelete}
                    onSubtaskToggle={onSubtaskToggle}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Todos; 