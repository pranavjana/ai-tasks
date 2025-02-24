import { CheckCircle2, Circle, Trash2, ChevronRight, Calendar, FileText } from 'lucide-react';
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
import { AnimatePresence } from 'framer-motion';

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

    console.log('Formatting date:', date, 'Day of week:', format(date, 'EEEE'));

    if (isToday(date)) {
      return 'Today';
    } else if (isTomorrow(date)) {
      return 'Tomorrow';
    } else {
      // Use full weekday name to debug
      return format(date, 'EEEE, MMM d');
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
      <div className={cn(
        "group flex items-start gap-3 pl-8 py-2",
        "hover:bg-neutral-800/30"
      )}>
        <button 
          onClick={() => onToggle(parentId, subtask.id)}
          className="flex-shrink-0 mt-0.5"
        >
          {subtask.completed ? (
            <CheckCircle2 className="w-4 h-4 text-green-400" />
          ) : (
            <Circle className="w-4 h-4 text-neutral-400 group-hover:text-white" />
          )}
        </button>
        
        <button 
          onClick={() => setShowNotes(true)}
          className={cn(
            "text-sm break-words flex-1 text-left",
            subtask.completed ? "text-neutral-400 line-through" : "text-white"
          )}
        >
          {subtask.content}
        </button>

        <button
          onClick={() => setShowNotes(true)}
          className="flex-shrink-0 p-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity text-neutral-400 hover:text-white"
        >
          <FileText className="w-4 h-4" />
        </button>
      </div>

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

  return (
    <div className={cn(
      "group rounded-lg transition-colors",
      "hover:bg-neutral-800/50"
    )}>
      <div className="flex items-start gap-3 p-4">
        {hasSubtasks ? (
          <button 
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex-shrink-0 mt-1 p-0.5 rounded-md text-neutral-400 hover:text-white hover:bg-neutral-800"
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
          <div className="flex items-center gap-2">
            <p className={cn(
              "text-sm font-medium break-words",
              allSubtasksCompleted ? "text-neutral-400" : "text-white"
            )}>
              {todo.title}
            </p>
            {formattedDueDate && (
              <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-neutral-800 text-xs text-neutral-400">
                <Calendar className="w-3 h-3" />
                <span>{formattedDueDate}</span>
              </div>
            )}
          </div>
        </div>

        <button 
          onClick={() => onDelete(todo.id)}
          className="flex-shrink-0 p-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity text-red-400 hover:text-red-300 hover:bg-red-400/10"
        >
          <Trash2 className="w-4 h-4" />
        </button>
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
    </div>
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
    <div className="w-full max-w-2xl mx-auto p-4">
      {todos.length === 0 ? (
        <div className="text-center text-neutral-500">
          No to-dos yet. Try asking me to create one!
        </div>
      ) : (
        <div className="space-y-8">
          {/* Incomplete To-dos */}
          {incompleteTodos.length > 0 && (
            <div className="space-y-1">
              <h2 className="text-lg font-semibold text-white px-4">
                To Do
              </h2>
              <div className="space-y-1">
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
            <div className="space-y-1">
              <h2 className="text-lg font-semibold text-neutral-400 px-4">
                Completed
              </h2>
              <div className="space-y-1">
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