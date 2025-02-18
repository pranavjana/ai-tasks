import TaskCard from './TaskCard';

const CategorySection = ({ category, tasks, onTaskDelete }) => (
  <div className="space-y-3">
    <h2 className="text-lg font-semibold text-white flex items-center gap-2">
      <span className={`w-2 h-2 rounded-full ${
        category === 'Work' ? 'bg-blue-400' :
        category === 'Personal' ? 'bg-purple-400' :
        category === 'Health' ? 'bg-green-400' :
        category === 'Shopping' ? 'bg-yellow-400' :
        category === 'Home' ? 'bg-orange-400' :
        category === 'Study' ? 'bg-pink-400' :
        category === 'Social' ? 'bg-indigo-400' :
        'bg-neutral-400'
      }`} />
      {category}
    </h2>
    <div className="space-y-3">
      {tasks.map((task) => (
        <TaskCard 
          key={task.id} 
          task={task} 
          onDelete={onTaskDelete}
        />
      ))}
    </div>
  </div>
);

const Tasks = ({ tasks = [], onTaskDelete }) => {
  // Group tasks by category
  const groupedTasks = tasks.reduce((acc, task) => {
    const category = task.category || 'Other';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(task);
    return acc;
  }, {});

  // Sort categories to ensure consistent order
  const categories = [
    'Work',
    'Personal',
    'Health',
    'Shopping',
    'Home',
    'Study',
    'Social',
    'Other'
  ].filter(category => groupedTasks[category]?.length > 0);

  return (
    <div className="w-full max-w-2xl mx-auto p-4">
      {tasks.length === 0 ? (
        <div className="text-center text-neutral-500">
          No tasks yet. Try asking me to create one!
        </div>
      ) : (
        <div className="space-y-8">
          {categories.map((category) => (
            <CategorySection
              key={category}
              category={category}
              tasks={groupedTasks[category]}
              onTaskDelete={onTaskDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default Tasks; 