import { motion } from 'framer-motion';
import { CheckCircle2 } from 'lucide-react';
import TaskCard from './TaskCard';
import { cn } from '../lib/utils';

const TaskCreationTimeline = ({ tasks }) => {
  return (
    <div className="space-y-4">
      {tasks.map((task, index) => (
        <motion.div
          key={task.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.2 }}
          className="relative pl-8"
        >
          {/* Timeline line */}
          <div className="absolute left-3 top-0 bottom-0 w-px bg-neutral-800" />
          
          {/* Timeline dot */}
          <div className="absolute left-0 top-4 flex items-center justify-center w-6 h-6 rounded-full bg-neutral-800">
            <CheckCircle2 className="w-4 h-4 text-green-400" />
          </div>

          {/* Task card */}
          <div className={cn(
            "relative",
            index !== tasks.length - 1 && "mb-8" // Add margin except for last item
          )}>
            <TaskCard task={task} />
          </div>
        </motion.div>
      ))}
    </div>
  );
};

export default TaskCreationTimeline; 