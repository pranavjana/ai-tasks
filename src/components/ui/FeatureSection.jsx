import { cn } from "../../lib/utils";
import { motion } from "framer-motion";
import { IconBrandYoutubeFilled } from "@tabler/icons-react";

export function FeatureSection() {
  const features = [
    {
      title: "AI-Powered Task Management",
      description: "Experience the future of productivity with our advanced AI that learns your work patterns and adapts to your style.",
      skeleton: <SkeletonOne />,
      className: "col-span-1 lg:col-span-3 border-b lg:border-r dark:border-neutral-800",
    },
    {
      title: "Natural Language Input",
      description: "Add tasks as naturally as having a conversation. Our AI understands context and helps organize your thoughts.",
      skeleton: <SkeletonFour />,
      className: "col-span-1 lg:col-span-3 border-b dark:border-neutral-800",
    },
    {
      title: "Smart Suggestions",
      description: "Get intelligent task recommendations and scheduling suggestions based on your habits and priorities.",
      skeleton: <SkeletonTwo />,
      className: "border-b col-span-1 lg:col-span-3 lg:border-r dark:border-neutral-800",
    },
    {
      title: "Real-time Collaboration",
      description: "Work seamlessly with your team in real-time. Share tasks and stay in sync effortlessly.",
      skeleton: <SkeletonThree />,
      className: "col-span-1 lg:col-span-3 dark:border-neutral-800",
    },
  ];

  return (
    <div className="relative z-20 py-10 lg:py-20 max-w-7xl mx-auto">
      <div className="px-8">
        <h4 className="text-3xl lg:text-5xl lg:leading-tight max-w-5xl mx-auto text-center tracking-tight font-medium text-white">
          Everything you need to stay productive
        </h4>
        <p className="text-sm lg:text-base max-w-2xl my-4 mx-auto text-neutral-400 text-center font-normal">
          Powerful features that help you take control of your tasks and achieve more every day.
        </p>
      </div>
      <div className="relative">
        <div className="grid grid-cols-1 lg:grid-cols-6 mt-12 xl:border rounded-md dark:border-neutral-800">
          {features.map((feature) => (
            <FeatureCard key={feature.title} className={feature.className}>
              <FeatureTitle>{feature.title}</FeatureTitle>
              <FeatureDescription>{feature.description}</FeatureDescription>
              <div className="h-full w-full">{feature.skeleton}</div>
            </FeatureCard>
          ))}
        </div>
      </div>
    </div>
  );
}

const FeatureCard = ({ children, className }) => {
  return (
    <div className={cn(`p-4 sm:p-8 relative overflow-hidden`, className)}>
      {children}
    </div>
  );
};

const FeatureTitle = ({ children }) => {
  return (
    <p className="max-w-5xl mx-auto text-left tracking-tight text-white text-xl md:text-2xl md:leading-snug">
      {children}
    </p>
  );
};

const FeatureDescription = ({ children }) => {
  return (
    <p className={cn(
      "text-sm md:text-base max-w-4xl text-left mx-auto",
      "text-neutral-400 text-center font-normal",
      "text-left max-w-sm mx-0 md:text-sm my-2"
    )}>
      {children}
    </p>
  );
};

const SkeletonOne = () => {
  // Sample tasks for the animation with AI insights
  const tasks = [
    {
      id: 1,
      title: "Quarterly report preparation",
      description: "Compile data and create presentation",
      category: "Work",
      priority: "High",
      schedule: "2025-06-15",
      time: "09:00",
      completed: false,
      aiInsight: "Based on your work patterns, you're most productive with analytical tasks in the morning."
    },
    {
      id: 2,
      title: "Team sync meeting",
      description: "Weekly progress update with engineering",
      category: "Work",
      priority: "Medium",
      schedule: "2025-06-15",
      time: "14:00",
      completed: false,
      aiInsight: null
    },
    {
      id: 3,
      title: "Review project proposal",
      description: "Provide feedback on marketing campaign",
      category: "Work",
      priority: "Medium",
      schedule: "2025-06-16",
      time: "11:00",
      completed: false,
      aiInsight: "This task has been rescheduled twice. Consider prioritizing it today."
    }
  ];

  // Animation variants for tasks
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const taskVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { 
      y: 0, 
      opacity: 1,
      transition: { duration: 0.2 }
    }
  };

  // Animation for AI insights
  const insightVariants = {
    hidden: { opacity: 0, height: 0 },
    visible: { 
      opacity: 1,
      height: "auto",
      transition: { duration: 0.2, delay: 0.1 }
    }
  };

  // Animation for the priority badges
  const priorityVariants = {
    hidden: { scale: 0.8, opacity: 0 },
    visible: { 
      scale: 1, 
      opacity: 1,
      transition: { duration: 0.2 }
    }
  };

  // Animation for the productivity chart
  const chartVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.3, delay: 0.8 }
    }
  };

  // Productivity data for the chart
  const productivityData = [
    { time: "8am", level: 60 },
    { time: "10am", level: 90 },
    { time: "12pm", level: 70 },
    { time: "2pm", level: 50 },
    { time: "4pm", level: 75 },
    { time: "6pm", level: 60 }
  ];

  return (
    <div className="relative flex py-8 px-2 gap-10 h-full">
      <div className="w-full p-5 mx-auto bg-neutral-900 shadow-2xl group h-full rounded-xl overflow-hidden">
        <div className="flex flex-1 w-full h-full flex-col space-y-4">
          {/* AI Dashboard Header */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-purple-400">
                  <path d="M12 8V4H8"></path>
                  <rect width="16" height="12" x="4" y="8" rx="2"></rect>
                  <path d="M2 14h2"></path>
                  <path d="M20 14h2"></path>
                  <path d="M15 13v2"></path>
                  <path d="M9 13v2"></path>
                </svg>
              </div>
              <h3 className="text-white font-medium">AI Task Assistant</h3>
            </div>
            <div className="text-xs text-neutral-400">
              Tuesday, June 15
            </div>
          </div>

          {/* AI Insight Banner */}
          <motion.div 
            className="bg-gradient-to-r from-purple-500/20 to-blue-500/20 backdrop-blur-sm rounded-lg p-3 border border-purple-500/20"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex items-start gap-2">
              <div className="p-1 rounded-full bg-purple-500/20 text-purple-400 mt-0.5">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"></circle>
                  <path d="M12 16v-4"></path>
                  <path d="M12 8h.01"></path>
                </svg>
              </div>
              <div>
                <p className="text-xs text-white font-medium">AI Productivity Insight</p>
                <p className="text-xs text-neutral-300">Your focus peaks between 9-11am. I've prioritized your analytical tasks during this window.</p>
              </div>
            </div>
          </motion.div>

          {/* Task cards with AI insights */}
          <motion.div 
            className="space-y-3"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {tasks.map((task) => (
              <motion.div 
                key={task.id}
                variants={taskVariants}
                className={`
                  relative bg-neutral-800/50 backdrop-blur-sm rounded-lg p-3 space-y-2 w-full overflow-hidden
                  before:absolute before:left-0 before:top-0 before:bottom-0 before:w-1
                  ${task.category === 'Work' ? 'before:bg-blue-400' : 'before:bg-green-400'}
                `}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-white font-medium text-sm break-words">{task.title}</h3>
                      <motion.span 
                        variants={priorityVariants}
                        className={`text-xs px-1.5 py-0.5 rounded-full ${
                          task.priority === 'High' 
                            ? 'bg-red-500/20 text-red-400' 
                            : 'bg-yellow-500/20 text-yellow-400'
                        }`}
                      >
                        {task.priority}
                      </motion.span>
                    </div>
                    
                    {task.description && (
                      <p className="text-xs text-neutral-400 break-words line-clamp-1 mt-1">
                        {task.description}
                      </p>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-1">
                    <button className="p-1 rounded-md transition-colors flex-shrink-0 text-neutral-400 hover:text-white hover:bg-neutral-700/50">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 20h9"></path>
                        <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
                      </svg>
                    </button>
                    <button className="p-1 rounded-md transition-colors flex-shrink-0 text-neutral-400 hover:text-white hover:bg-neutral-700/50">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10"></circle>
                        <polyline points="12 6 12 12 16 14"></polyline>
                      </svg>
                    </button>
                  </div>
                </div>
                
                <div className="flex flex-wrap items-center gap-2 text-xs text-neutral-500">
                  <div className="flex items-center gap-1 min-w-0">
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
                      <line x1="16" x2="16" y1="2" y2="6" />
                      <line x1="8" x2="8" y1="2" y2="6" />
                      <line x1="3" x2="21" y1="10" y2="10" />
                    </svg>
                    <span className="truncate">Today</span>
                  </div>
                  <div className="flex items-center gap-1 min-w-0">
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10" />
                      <polyline points="12 6 12 12 16 14" />
                    </svg>
                    <span className="truncate">{task.time}</span>
                  </div>
                </div>

                {/* AI Insight for task */}
                {task.aiInsight && (
                  <motion.div 
                    variants={insightVariants}
                    className="mt-2 bg-purple-500/10 rounded-md p-2 text-xs"
                  >
                    <div className="flex items-start gap-1.5">
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-purple-400 mt-0.5">
                        <path d="M21.2 8.4c.5.38.8.97.8 1.6 0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2 0-.63.3-1.22.8-1.6"></path>
                        <path d="m21.2 15.6c.5-.38.8-.97.8-1.6 0-1.1-.9-2-2-2H4c-1.1 0-2 .9-2 2 0 .63.3 1.22.8 1.6"></path>
                        <path d="M3 3v18"></path>
                        <path d="M21 3v18"></path>
                      </svg>
                      <span className="text-purple-300">{task.aiInsight}</span>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            ))}
          </motion.div>

          {/* Productivity Chart */}
          <motion.div 
            className="mt-4 bg-neutral-800/30 rounded-lg overflow-hidden p-3"
            variants={chartVariants}
            initial="hidden"
            animate="visible"
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-white">Your Productivity Pattern</h3>
              <span className="text-xs text-purple-400">AI analyzed</span>
            </div>
            
            {/* Productivity Timeline */}
            <div className="flex flex-col space-y-4">
              {/* Productivity Heatmap */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-neutral-400">Weekly productivity heatmap</p>
                  <p className="text-xs text-white">Last 7 days</p>
                </div>
                <div className="grid grid-cols-7 gap-1 h-16">
                  {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, dayIndex) => (
                    <div key={day} className="flex flex-col space-y-1">
                      <div className="flex flex-col space-y-1">
                        {[0, 1, 2, 3].map((timeSlot) => {
                          // Generate random productivity levels for the demo
                          const productivityLevels = [
                            [30, 80, 40, 20], // Monday
                            [50, 90, 70, 40], // Tuesday
                            [20, 60, 90, 50], // Wednesday
                            [10, 40, 60, 30], // Thursday
                            [60, 70, 40, 20], // Friday
                            [20, 30, 20, 10], // Saturday
                            [10, 20, 10, 5],  // Sunday
                          ];
                          
                          const level = productivityLevels[dayIndex][timeSlot];
                          
                          // Color based on productivity level
                          let bgColor = "bg-purple-900/20";
                          if (level > 70) bgColor = "bg-purple-500";
                          else if (level > 50) bgColor = "bg-purple-500/70";
                          else if (level > 30) bgColor = "bg-purple-500/40";
                          
                          return (
                            <motion.div
                              key={timeSlot}
                              className={`w-full h-3 rounded-sm ${bgColor}`}
                              initial={{ opacity: 0, scale: 0.8 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ 
                                duration: 0.2, 
                                delay: 1.2 + (dayIndex * 0.05) + (timeSlot * 0.05) 
                              }}
                            />
                          );
                        })}
                      </div>
                      <span className="text-[10px] text-neutral-500 text-center">{day}</span>
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-between text-[10px] text-neutral-500">
                  <span>Morning</span>
                  <span>Afternoon</span>
                  <span>Evening</span>
                  <span>Night</span>
                </div>
              </div>
              
              {/* Daily Productivity Chart */}
              <div className="pt-2 border-t border-neutral-700/50">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs text-neutral-400">Daily productivity trend</p>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-blue-400"></div>
                    <span className="text-[10px] text-neutral-400">Tasks completed</span>
                  </div>
                </div>
                
                <div className="flex items-end h-24 gap-1 pt-2 relative">
                  {/* Background grid lines */}
                  <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
                    {[0, 1, 2, 3].map((line) => (
                      <div 
                        key={line} 
                        className="w-full h-px bg-neutral-800"
                      />
                    ))}
                  </div>
                  
                  {productivityData.map((item, index) => (
                    <div key={index} className="flex-1 flex flex-col items-center gap-1 relative z-10">
                      <div className="relative w-full flex justify-center">
                        <motion.div 
                          className="w-full max-w-[10px] bg-blue-400/30 rounded-t-sm"
                          style={{ height: `${item.level}%` }}
                          initial={{ height: 0 }}
                          animate={{ height: `${item.level}%` }}
                          transition={{ duration: 0.2, delay: 1.3 + (index * 0.05) }}
                        >
                          <motion.div 
                            className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-2 h-2 rounded-full bg-blue-400"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.2, delay: 1.5 + (index * 0.05) }}
                          />
                        </motion.div>
                      </div>
                      <span className="text-[10px] text-neutral-500">{item.time}</span>
                    </div>
                  ))}
                  
                  {/* Trend line */}
                  <svg className="absolute inset-0 h-full w-full overflow-visible" preserveAspectRatio="none">
                    <motion.path
                      d={`M 0,${100 - productivityData[0].level * 0.8} 
                          C ${100/6},${100 - productivityData[1].level * 0.8} 
                            ${100/6*2},${100 - productivityData[2].level * 0.8} 
                            ${100/6*3},${100 - productivityData[3].level * 0.8}
                            ${100/6*4},${100 - productivityData[4].level * 0.8}
                            ${100/6*5},${100 - productivityData[5].level * 0.8}
                            ${100},${100 - productivityData[5].level * 0.8}`}
                      fill="none"
                      stroke="rgba(96, 165, 250, 0.5)"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      initial={{ pathLength: 0, opacity: 0 }}
                      animate={{ pathLength: 1, opacity: 1 }}
                      transition={{ duration: 0.8, delay: 1.5 }}
                    />
                  </svg>
                </div>
              </div>
              
              {/* Insights */}
              <motion.div 
                className="pt-2 border-t border-neutral-700/50"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3, delay: 1.7 }}
              >
                <div className="flex flex-col space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-neutral-400">Optimal focus time: <span className="text-white">9-11am</span></span>
                    <span className="text-purple-400 cursor-pointer">View detailed analysis</span>
                  </div>
                  
                  <div className="flex items-start gap-2 bg-purple-500/10 rounded-md p-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-purple-400 mt-0.5">
                      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path>
                      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>
                    </svg>
                    <div className="text-[10px] text-purple-300">
                      <p>You complete 64% more tasks when you work in the morning compared to afternoon sessions.</p>
                    </div>
                  </div>
                  
                  <div className="flex justify-between text-[10px] text-neutral-400">
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full bg-green-400"></div>
                      <span>Most productive: Tuesday</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full bg-red-400"></div>
                      <span>Least productive: Sunday</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
      <div className="absolute bottom-0 z-40 inset-x-0 h-60 bg-gradient-to-t from-neutral-900 via-neutral-900 to-transparent w-full pointer-events-none" />
      <div className="absolute top-0 z-40 inset-x-0 h-60 bg-gradient-to-b from-neutral-900 via-transparent to-transparent w-full pointer-events-none" />
    </div>
  );
};

const SkeletonTwo = () => {
  const images = [
    "https://images.unsplash.com/photo-1611224923853-80b023f02d71?q=80&w=2940&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1606857521015-7f9fcf423740?q=80&w=2940&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?q=80&w=2944&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1554415707-6e8cfc93fe23?q=80&w=2940&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=2815&auto=format&fit=crop"
  ];

  const imageVariants = {
    whileHover: {
      scale: 1.1,
      rotate: 0,
      zIndex: 100,
    },
    whileTap: {
      scale: 1.1,
      rotate: 0,
      zIndex: 100,
    },
  };

  return (
    <div className="relative flex flex-col items-start p-8 gap-10 h-full overflow-hidden">
      <div className="flex flex-row -ml-20">
        {images.map((image, idx) => (
          <motion.div
            variants={imageVariants}
            key={"images-first" + idx}
            style={{
              rotate: Math.random() * 20 - 10,
            }}
            whileHover="whileHover"
            whileTap="whileTap"
            className="rounded-xl -mr-4 mt-4 p-1 bg-neutral-800 border-neutral-700 border flex-shrink-0 overflow-hidden"
          >
            <img
              src={image}
              alt="task preview"
              className="rounded-lg h-20 w-20 md:h-40 md:w-40 object-cover flex-shrink-0"
            />
          </motion.div>
        ))}
      </div>
      <div className="flex flex-row">
        {images.map((image, idx) => (
          <motion.div
            key={"images-second" + idx}
            style={{
              rotate: Math.random() * 20 - 10,
            }}
            variants={imageVariants}
            whileHover="whileHover"
            whileTap="whileTap"
            className="rounded-xl -mr-4 mt-4 p-1 bg-neutral-800 border-neutral-700 border flex-shrink-0 overflow-hidden"
          >
            <img
              src={image}
              alt="task preview"
              className="rounded-lg h-20 w-20 md:h-40 md:w-40 object-cover flex-shrink-0"
            />
          </motion.div>
        ))}
      </div>
      <div className="absolute left-0 z-[100] inset-y-0 w-20 bg-gradient-to-r from-neutral-900 to-transparent h-full pointer-events-none" />
      <div className="absolute right-0 z-[100] inset-y-0 w-20 bg-gradient-to-l from-neutral-900 to-transparent h-full pointer-events-none" />
    </div>
  );
};

const SkeletonThree = () => {
  return (
    <a
      href="https://www.youtube.com/watch?v=demo"
      target="_blank"
      rel="noopener noreferrer"
      className="relative flex gap-10 h-full group/image"
    >
      <div className="w-full mx-auto bg-transparent group h-full">
        <div className="flex flex-1 w-full h-full flex-col space-y-2 relative">
          <IconBrandYoutubeFilled className="h-20 w-20 absolute z-10 inset-0 text-red-500 m-auto" />
          <img
            src="https://images.unsplash.com/photo-1600880292203-757bb62b4baf?q=80&w=2940&auto=format&fit=crop"
            alt="Collaboration Demo"
            className="h-full w-full aspect-square object-cover object-center rounded-sm blur-none group-hover/image:blur-md transition-all duration-100"
          />
        </div>
      </div>
    </a>
  );
};

const SkeletonFour = () => {
  // The text to be typed character by character
  const textToType = "When is the best time to work on my presentation?";
  
  // Animation variants for character-by-character typing
  const containerVariants = {
    hidden: { opacity: 1 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.02
      }
    }
  };
  
  const letterVariants = {
    hidden: { opacity: 0, y: 5 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.1 }
    }
  };

  // Animation for the send button
  const sendButtonVariants = {
    initial: { scale: 0.8, opacity: 0 },
    typing: { scale: 0.8, opacity: 0 },
    ready: { 
      scale: 1, 
      opacity: 1,
      transition: { duration: 0.3 }
    },
    sent: {
      scale: 0.9,
      opacity: 0.7,
      transition: { duration: 0.2 }
    }
  };

  // Animation for the response container
  const responseVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.3 }
    }
  };

  // Mock AI response
  const mockResponse = {
    text: "I've analyzed your schedule and found the best time to work on your presentation would be tomorrow between 10:00 AM and 12:00 PM. You have no meetings scheduled during that time, and it aligns with your peak productivity hours based on your past work patterns. Would you like me to block this time on your calendar?",
    suggestions: [
      "Yes, block that time",
      "Show me other options",
      "Remind me 30 minutes before"
    ]
  };

  return (
    <div className="relative flex py-8 px-2 gap-10 h-full">
      <div className="w-full p-5 mx-auto bg-neutral-900 shadow-2xl group h-full rounded-xl overflow-hidden">
        <div className="flex flex-1 w-full h-full flex-col space-y-4">
          {/* Search input with character-by-character typing animation */}
          <div className="relative bg-neutral-800 rounded-lg p-3 mb-4">
            <div className="flex items-center">
              <div className="flex-1 overflow-hidden">
                <motion.div 
                  className="text-white text-sm flex flex-wrap"
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                >
                  {textToType.split("").map((char, index) => (
                    <motion.span
                      key={index}
                      variants={letterVariants}
                      className={`inline-block ${char === " " ? "w-[0.25em]" : ""}`}
                    >
                      {char}
                    </motion.span>
                  ))}
                  <motion.span
                    initial={{ opacity: 1 }}
                    animate={{ opacity: 0 }}
                    transition={{ 
                      repeat: Infinity, 
                      repeatType: "reverse", 
                      duration: 0.5,
                      delay: textToType.length * 0.02 + 0.3
                    }}
                    className="inline-block w-1 h-4 bg-purple-400 ml-0.5"
                  />
                </motion.div>
              </div>
              <motion.div 
                className="ml-2 p-1.5 rounded-full bg-purple-500/10 text-purple-400"
                variants={sendButtonVariants}
                initial="initial"
                animate={[
                  "typing",
                  "ready",
                  "sent"
                ]}
                transition={{
                  times: [0, 0.8, 1],
                  duration: textToType.length * 0.02 + 2.5
                }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14" />
                  <path d="m12 5 7 7-7 7" />
                </svg>
              </motion.div>
            </div>
          </div>

          {/* AI Response */}
          <motion.div 
            className="bg-neutral-800/50 backdrop-blur-sm rounded-lg p-4"
            variants={responseVariants}
            initial="hidden"
            animate="visible"
            transition={{ delay: textToType.length * 0.02 + 1.5 }}
          >
            <div className="flex items-start gap-3 mb-4">
              <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-purple-400">
                  <path d="M12 8V4H8"></path>
                  <rect width="16" height="12" x="4" y="8" rx="2"></rect>
                  <path d="M2 14h2"></path>
                  <path d="M20 14h2"></path>
                  <path d="M15 13v2"></path>
                  <path d="M9 13v2"></path>
                </svg>
              </div>
              <div className="flex-1">
                <motion.p 
                  className="text-white text-sm leading-relaxed"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ 
                    delay: textToType.length * 0.02 + 1.6,
                    duration: 0.3
                  }}
                >
                  {mockResponse.text}
                </motion.p>
              </div>
            </div>

            {/* Suggestion chips */}
            <div className="flex flex-wrap gap-2 mt-3">
              {mockResponse.suggestions.map((suggestion, index) => (
                <motion.button
                  key={index}
                  className="px-3 py-1.5 bg-neutral-700/50 hover:bg-neutral-700 text-white text-xs rounded-full transition-colors"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ 
                    delay: textToType.length * 0.02 + 1.8 + (index * 0.1),
                    duration: 0.2
                  }}
                >
                  {suggestion}
                </motion.button>
              ))}
            </div>
          </motion.div>

          {/* Calendar visualization */}
          <motion.div 
            className="mt-4 bg-neutral-800/30 rounded-lg overflow-hidden"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ 
              delay: textToType.length * 0.02 + 2.0,
              duration: 0.3
            }}
          >
            <div className="p-3 border-b border-neutral-700">
              <h3 className="text-sm font-medium text-white">Tomorrow's Schedule</h3>
            </div>
            <div className="p-3 space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-1 h-12 bg-green-400 rounded-full"></div>
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <p className="text-xs font-medium text-white">Available Time</p>
                    <p className="text-xs text-neutral-400">10:00 - 12:00</p>
                  </div>
                  <p className="text-xs text-neutral-500 mt-1">Suggested for presentation work</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-1 h-12 bg-blue-400 rounded-full"></div>
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <p className="text-xs font-medium text-white">Team Standup</p>
                    <p className="text-xs text-neutral-400">13:00 - 13:30</p>
                  </div>
                  <p className="text-xs text-neutral-500 mt-1">Daily check-in with the team</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-1 h-12 bg-purple-400 rounded-full"></div>
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <p className="text-xs font-medium text-white">Client Meeting</p>
                    <p className="text-xs text-neutral-400">15:00 - 16:00</p>
                  </div>
                  <p className="text-xs text-neutral-500 mt-1">Project status update</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
      <div className="absolute bottom-0 z-40 inset-x-0 h-60 bg-gradient-to-t from-neutral-900 via-neutral-900 to-transparent w-full pointer-events-none" />
      <div className="absolute top-0 z-40 inset-x-0 h-60 bg-gradient-to-b from-neutral-900 via-transparent to-transparent w-full pointer-events-none" />
    </div>
  );
}; 