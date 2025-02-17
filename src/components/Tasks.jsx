import TaskCard from './TaskCard';

const Tasks = ({ tasks = [] }) => {
  return (
    <div className="w-full max-w-2xl mx-auto p-4">
      <div className="space-y-4">
        {tasks.length === 0 ? (
          <div className="text-center text-neutral-500">
            No tasks yet. Try asking me to create one!
          </div>
        ) : (
          tasks.map((task, index) => (
            <TaskCard key={index} task={task} />
          ))
        )}
      </div>
    </div>
  );
};

export default Tasks; 