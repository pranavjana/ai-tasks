import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { 
  BarChart, 
  Calendar, 
  TrendingUp, 
  Clock, 
  Zap, 
  ArrowUp, 
  ArrowDown,
  Info,
  CheckCircle,
  AlertCircle,
  Database
} from 'lucide-react';
import { cn } from '../lib/utils';
import { format, isToday } from 'date-fns';
import CompletionGraph from './graphs/CompletionGraph';

const Timeline = () => {
  const [tasks, setTasks] = useState([]);
  const [todos, setTodos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [todayDate, setTodayDate] = useState(format(new Date(), 'EEEE, MMMM d, yyyy'));
  const [completionData, setCompletionData] = useState([]);
  const [todayCompletionCount, setTodayCompletionCount] = useState(0);
  const [productivityData, setProductivityData] = useState({
    weeklyHeatmap: [],
    dailyTrend: [],
    insights: []
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Check if Supabase client is available
      if (!supabase) {
        throw new Error('Supabase client is not initialized');
      }
      
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError) {
        throw new Error(`Authentication error: ${userError.message}`);
      }
      
      if (!user) {
        setError('No authenticated user found. Please log in to view your productivity data.');
        setLoading(false);
        return;
      }

      // Fetch completed tasks with timestamps
      const { data: tasksData, error: tasksError } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', user.id)
        .eq('completed', true)
        .order('completed_at', { ascending: false });

      if (tasksError) {
        throw new Error(`Error fetching tasks: ${tasksError.message}`);
      }

      // Fetch todos with subtasks
      const { data: todosData, error: todosError } = await supabase
        .from('todos')
        .select('*, subtasks(*)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (todosError) {
        throw new Error(`Error fetching todos: ${todosError.message}`);
      }

      // Extract all subtasks from todos
      const allSubtasks = todosData.flatMap(todo => todo.subtasks || []);
      
      // Filter completed subtasks
      const completedSubtasks = allSubtasks.filter(subtask => subtask.completed);
      
      // Filter completed todos
      const completedTodos = todosData.filter(todo => todo.completed);

      // Check if we have any data
      const hasData = (tasksData && tasksData.length > 0) || 
                      (completedTodos && completedTodos.length > 0) || 
                      (completedSubtasks && completedSubtasks.length > 0);
      
      if (!hasData) {
        console.log('No task data available from Supabase');
      }

      setTasks(tasksData || []);
      setTodos(completedTodos || []);
      
      // Generate completion data for today's graph - prioritizing subtasks
      generateCompletionData(tasksData || [], completedTodos || [], completedSubtasks || []);
      
      // Generate productivity insights from all completed items
      generateProductivityInsights([
        ...(tasksData || []), 
        ...(completedTodos || []),
        ...(completedSubtasks || [])
      ]);
      
      console.log('Successfully fetched data from Supabase:', {
        tasks: tasksData?.length || 0,
        completedTodos: completedTodos?.length || 0,
        completedSubtasks: completedSubtasks?.length || 0
      });
    } catch (error) {
      console.error('Error fetching data:', error);
      setError(`${error.message || 'Unknown error'}`);
      
      // Initialize empty data instead of mock data
      initializeEmptyData();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    // Update today's date every minute
    const dateInterval = setInterval(() => {
      setTodayDate(format(new Date(), 'EEEE, MMMM d, yyyy'));
    }, 60000);

    return () => clearInterval(dateInterval);
  }, []);

  // Handle retry when there's an error
  const handleRetry = () => {
    fetchData();
  };

  // Initialize empty data structures when no data is available
  const initializeEmptyData = () => {
    // Empty completion data (24 hours with 0 counts)
    const emptyCompletionData = Array.from({ length: 24 }, (_, i) => ({
      hour: i,
      count: 0,
      items: []
    }));
    
    setCompletionData(emptyCompletionData);
    setTodayCompletionCount(0);
    
    // Empty productivity data
    setProductivityData({
      weeklyHeatmap: [
        { day: 'Monday', morning: 0, afternoon: 0, evening: 0, night: 0 },
        { day: 'Tuesday', morning: 0, afternoon: 0, evening: 0, night: 0 },
        { day: 'Wednesday', morning: 0, afternoon: 0, evening: 0, night: 0 },
        { day: 'Thursday', morning: 0, afternoon: 0, evening: 0, night: 0 },
        { day: 'Friday', morning: 0, afternoon: 0, evening: 0, night: 0 },
        { day: 'Saturday', morning: 0, afternoon: 0, evening: 0, night: 0 },
        { day: 'Sunday', morning: 0, afternoon: 0, evening: 0, night: 0 }
      ],
      dailyTrend: [],
      insights: []
    });
  };

  // Generate completion data for today's graph
  const generateCompletionData = (tasksData, todosData, subtasksData) => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      // Filter tasks completed today
      const todayTasks = tasksData.filter(task => {
        if (!task.completed_at) return false;
        const completedDate = new Date(task.completed_at);
        return isToday(completedDate);
      });
      
      // Filter todos completed today
      const todayTodos = todosData.filter(todo => {
        if (!todo.completed_at) return false;
        const completedDate = new Date(todo.completed_at);
        return isToday(completedDate);
      });
      
      // Filter subtasks completed today
      const todaySubtasks = subtasksData.filter(subtask => {
        if (!subtask.completed_at) return false;
        const completedDate = new Date(subtask.completed_at);
        return isToday(completedDate);
      });
      
      // Combine all completed items - prioritizing subtasks for the graph
      const allCompletedItems = [
        ...todaySubtasks.map(subtask => ({ 
          type: 'subtask', 
          time: new Date(subtask.completed_at).getHours(),
          title: subtask.content,
          completedAt: subtask.completed_at,
          todoId: subtask.todo_id
        })),
        ...todayTodos.map(todo => ({ 
          type: 'todo', 
          time: new Date(todo.completed_at).getHours(),
          title: todo.title,
          completedAt: todo.completed_at,
          id: todo.id
        })),
        ...todayTasks.map(task => ({ 
          type: 'task', 
          time: new Date(task.completed_at).getHours(),
          title: task.title,
          completedAt: task.completed_at
        }))
      ];
      
      // Set today's total completion count - focus on subtasks for the count
      setTodayCompletionCount(todaySubtasks.length);
      
      // Group by hour
      const hourlyCompletions = {};
      
      // Initialize all hours from 0-23
      for (let i = 0; i < 24; i++) {
        hourlyCompletions[i] = {
          hour: i,
          count: 0,
          items: []
        };
      }
      
      // Count completions by hour
      allCompletedItems.forEach(item => {
        const hour = item.time;
        hourlyCompletions[hour].count += 1;
        hourlyCompletions[hour].items.push(item);
      });
      
      // Convert to array and sort by hour
      const hourlyData = Object.values(hourlyCompletions).sort((a, b) => a.hour - b.hour);
      
      setCompletionData(hourlyData);
    } catch (error) {
      console.error('Error generating completion data:', error);
      // Use empty data instead of mock data
      const emptyCompletionData = Array.from({ length: 24 }, (_, i) => ({
        hour: i,
        count: 0,
        items: []
      }));
      
      setCompletionData(emptyCompletionData);
      setTodayCompletionCount(0);
      setError('Error processing completion data. Showing empty timeline.');
    }
  };

  // Generate productivity insights from completed tasks
  const generateProductivityInsights = (completedTasks) => {
    // If no completed tasks, use empty data
    if (!completedTasks || completedTasks.length === 0) {
      initializeEmptyData();
      return;
    }

    try {
      // Process tasks to extract completion times
      const taskCompletionTimes = completedTasks
        .filter(task => task.completed_at)
        .map(task => {
          const completedAt = new Date(task.completed_at);
          return {
            day: completedAt.getDay(), // 0 = Sunday, 1 = Monday, etc.
            hour: completedAt.getHours(),
            timestamp: completedAt.getTime()
          };
        });

      // Generate weekly heatmap data
      const weeklyHeatmap = generateWeeklyHeatmap(taskCompletionTimes);
      
      // Generate daily trend data
      const dailyTrend = generateDailyTrend(taskCompletionTimes);
      
      // Generate insights
      const insights = generateInsights(taskCompletionTimes, weeklyHeatmap, dailyTrend);

      setProductivityData({
        weeklyHeatmap,
        dailyTrend,
        insights
      });
    } catch (error) {
      console.error('Error generating productivity insights:', error);
      // Fallback to empty data instead of mock data
      initializeEmptyData();
      setError('Error processing productivity data. Showing empty visualizations.');
    }
  };

  // Helper function to generate weekly heatmap from task completion times
  const generateWeeklyHeatmap = (taskCompletionTimes) => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const timeSlots = ['morning', 'afternoon', 'evening', 'night'];
    
    // Initialize heatmap data
    const heatmap = days.map(day => ({
      day,
      morning: 0,
      afternoon: 0,
      evening: 0,
      night: 0
    }));
    
    // If no task completion times, return empty heatmap
    if (!taskCompletionTimes || taskCompletionTimes.length === 0) {
      return heatmap;
    }
    
    // Count tasks completed in each time slot for each day
    taskCompletionTimes.forEach(({ day, hour }) => {
      let timeSlot;
      if (hour >= 5 && hour < 12) timeSlot = 'morning';
      else if (hour >= 12 && hour < 17) timeSlot = 'afternoon';
      else if (hour >= 17 && hour < 21) timeSlot = 'evening';
      else timeSlot = 'night';
      
      heatmap[day][timeSlot] += 1;
    });
    
    // Normalize values to percentages (0-100)
    const maxValue = Math.max(
      ...heatmap.flatMap(day => [day.morning, day.afternoon, day.evening, day.night])
    );
    
    if (maxValue > 0) {
      heatmap.forEach(day => {
        timeSlots.forEach(slot => {
          day[slot] = Math.round((day[slot] / maxValue) * 100);
        });
      });
    }
    
    return heatmap;
  };

  // Helper function to generate daily trend from task completion times
  const generateDailyTrend = (taskCompletionTimes) => {
    // If no task completion times, return empty trend
    if (!taskCompletionTimes || taskCompletionTimes.length === 0) {
      return [];
    }
    
    // Group tasks by hour
    const hourCounts = {};
    
    taskCompletionTimes.forEach(({ hour }) => {
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    });
    
    // Convert to array and sort by hour
    const hourlyData = Object.entries(hourCounts)
      .map(([hour, count]) => ({ hour: parseInt(hour), count }))
      .sort((a, b) => a.hour - b.hour);
    
    // Normalize to percentages (0-100)
    const maxCount = Math.max(...hourlyData.map(item => item.count), 1);
    
    return hourlyData.map(item => ({
      hour: item.hour,
      level: Math.round((item.count / maxCount) * 100)
    }));
  };

  // Helper function to generate insights from productivity data
  const generateInsights = (taskCompletionTimes, weeklyHeatmap, dailyTrend) => {
    // If no task completion times, return empty insights
    if (!taskCompletionTimes || taskCompletionTimes.length === 0) {
      return [];
    }
    
    // Find most productive day
    const mostProductiveDay = weeklyHeatmap.reduce(
      (max, day) => {
        const dayTotal = day.morning + day.afternoon + day.evening + day.night;
        return dayTotal > max.total ? { day: day.day, total: dayTotal } : max;
      },
      { day: '', total: 0 }
    ).day;
    
    // Find least productive day
    const leastProductiveDay = weeklyHeatmap.reduce(
      (min, day) => {
        const dayTotal = day.morning + day.afternoon + day.evening + day.night;
        return dayTotal < min.total && dayTotal > 0 ? { day: day.day, total: dayTotal } : min;
      },
      { day: '', total: Number.MAX_SAFE_INTEGER }
    ).day;
    
    // Find peak productivity time
    const morningTotal = weeklyHeatmap.reduce((sum, day) => sum + day.morning, 0);
    const afternoonTotal = weeklyHeatmap.reduce((sum, day) => sum + day.afternoon, 0);
    
    let productivityIncrease = 0;
    let peakTime = 'morning';
    
    if (morningTotal > 0 && afternoonTotal > 0) {
      if (morningTotal > afternoonTotal) {
        productivityIncrease = Math.round((morningTotal / afternoonTotal - 1) * 100);
        peakTime = 'morning';
      } else {
        productivityIncrease = Math.round((afternoonTotal / morningTotal - 1) * 100);
        peakTime = 'afternoon';
      }
    } else if (morningTotal > 0) {
      peakTime = 'morning';
    } else if (afternoonTotal > 0) {
      peakTime = 'afternoon';
    }
    
    // Find optimal focus time
    const peakHours = dailyTrend
      .sort((a, b) => b.level - a.level)
      .slice(0, 2)
      .map(item => item.hour);
    
    const formatHour = (hour) => {
      return `${hour % 12 === 0 ? 12 : hour % 12}:00 ${hour < 12 ? 'AM' : 'PM'}`;
    };
    
    const optimalTimeRange = peakHours.length >= 2
      ? `${formatHour(peakHours[0])} - ${formatHour(peakHours[1] + 1)}`
      : peakHours.length === 1
        ? `${formatHour(peakHours[0])}`
        : 'Not enough data';
    
    const insights = [];
    
    // Only add insights if we have enough data
    if (productivityIncrease > 0) {
      insights.push({ 
        id: 1, 
        title: 'Peak Productivity Time', 
        description: `You complete ${productivityIncrease}% more tasks in the ${peakTime} compared to ${peakTime === 'morning' ? 'afternoon' : 'morning'}.`,
        icon: <Zap className="w-5 h-5 text-yellow-400" />
      });
    }
    
    if (mostProductiveDay) {
      insights.push({ 
        id: 2, 
        title: 'Most Productive Day', 
        description: `${mostProductiveDay} is your most productive day of the week.`,
        icon: <ArrowUp className="w-5 h-5 text-green-400" />
      });
    }
    
    if (leastProductiveDay) {
      insights.push({ 
        id: 3, 
        title: 'Least Productive Day', 
        description: `${leastProductiveDay} has the lowest task completion rate.`,
        icon: <ArrowDown className="w-5 h-5 text-red-400" />
      });
    }
    
    if (optimalTimeRange !== 'Not enough data') {
      insights.push({ 
        id: 4, 
        title: 'Optimal Focus Time', 
        description: `Schedule important tasks between ${optimalTimeRange} for best results.`,
        icon: <Clock className="w-5 h-5 text-blue-400" />
      });
    }
    
    return insights;
  };

  // Format hour for display
  const formatHour = (hour) => {
    return `${hour % 12 === 0 ? 12 : hour % 12}${hour < 12 ? 'am' : 'pm'}`;
  };

  // Get max count for today's completion graph
  const maxCompletionCount = Math.max(...completionData.map(item => item.count), 1);

  // Generate points for the graph
  const generatePoints = () => {
    if (!completionData || completionData.length === 0) {
      return [];
    }
    
    try {
      // Create an array of points with their x,y coordinates
      const points = [];
      
      // Process each data point
      for (let i = 0; i < completionData.length; i++) {
        // Calculate x as a percentage of the total width
        const x = (i / Math.max(completionData.length - 1, 1)) * 100;
        
        // Calculate y as a percentage of the height (inverted, since SVG y=0 is at the top)
        const y = 100 - (completionData[i].count / (maxCompletionCount || 1)) * 100;
        
        // Ensure values are valid
        const safeX = isNaN(x) || !isFinite(x) ? 0 : x;
        const safeY = isNaN(y) || !isFinite(y) ? 100 : y;
        
        points.push({ x: safeX, y: safeY });
      }
      
      return points;
    } catch (error) {
      console.error('Error generating points:', error);
      return [];
    }
  };

  // Generate SVG path for line graph
  const generateLinePath = () => {
    try {
      const points = generatePoints();
      
      if (points.length === 0) {
        return `M 0 100 L 100 100`;
      }
      
      // Special case for a single data point
      if (points.length === 1) {
        return `M 0 ${points[0].y} L 100 ${points[0].y}`;
      }
      
      // Start with the first point
      let path = `M ${points[0].x} ${points[0].y}`;
      
      // Add line segments to each subsequent point
      for (let i = 1; i < points.length; i++) {
        path += ` L ${points[i].x} ${points[i].y}`;
      }
      
      return path;
    } catch (error) {
      console.error('Error generating line path:', error);
      return `M 0 100 L 100 100`;
    }
  };

  // Generate separate paths for solid and dashed segments of the line
  const generateSolidAndDashedPaths = () => {
    try {
      const points = generatePoints();
      
      if (points.length === 0) {
        return { solid: "", dashed: `M 0 100 L 100 100` };
      }
      
      // Special case for a single data point
      if (points.length === 1) {
        const y = points[0].y;
        return { 
          solid: y < 99 ? `M 0 ${y} L 100 ${y}` : "",
          dashed: y >= 99 ? `M 0 ${y} L 100 ${y}` : ""
        };
      }
      
      let solidPath = "";
      let dashedPath = "";
      let currentSolidPath = "";
      let currentDashedPath = "";
      let inSolidSegment = points[0].y < 99; // Start solid if first point is not at bottom
      
      // Process first point
      if (inSolidSegment) {
        currentSolidPath = `M ${points[0].x} ${points[0].y}`;
      } else {
        currentDashedPath = `M ${points[0].x} ${points[0].y}`;
      }
      
      // Process remaining points
      for (let i = 1; i < points.length; i++) {
        const isBottomPoint = points[i].y >= 99;
        
        if (!isBottomPoint && !inSolidSegment) {
          // Transition from dashed to solid
          if (currentDashedPath) {
            dashedPath += currentDashedPath;
            currentDashedPath = "";
          }
          currentSolidPath = `M ${points[i-1].x} ${points[i-1].y} L ${points[i].x} ${points[i].y}`;
          inSolidSegment = true;
        } else if (isBottomPoint && inSolidSegment) {
          // Transition from solid to dashed
          if (currentSolidPath) {
            solidPath += currentSolidPath;
            currentSolidPath = "";
          }
          currentDashedPath = `M ${points[i-1].x} ${points[i-1].y} L ${points[i].x} ${points[i].y}`;
          inSolidSegment = false;
        } else {
          // Continue current segment
          if (inSolidSegment) {
            currentSolidPath += ` L ${points[i].x} ${points[i].y}`;
          } else {
            currentDashedPath += ` L ${points[i].x} ${points[i].y}`;
          }
        }
      }
      
      // Add any remaining paths
      if (currentSolidPath) solidPath += currentSolidPath;
      if (currentDashedPath) dashedPath += currentDashedPath;
      
      return { solid: solidPath, dashed: dashedPath };
    } catch (error) {
      console.error('Error generating solid and dashed paths:', error);
      return { solid: "", dashed: `M 0 100 L 100 100` };
    }
  };

  // Generate SVG path for area fill
  const generateAreaPath = () => {
    try {
      const points = generatePoints();
      
      if (points.length === 0) {
        return `M 0 100 L 100 100 L 100 100 L 0 100 Z`;
      }
      
      // Special case for a single data point
      if (points.length === 1) {
        return `M 0 ${points[0].y} L 100 ${points[0].y} L 100 100 L 0 100 Z`;
      }
      
      // Start with the first point
      let path = `M ${points[0].x} ${points[0].y}`;
      
      // Add line segments to each subsequent point
      for (let i = 1; i < points.length; i++) {
        path += ` L ${points[i].x} ${points[i].y}`;
      }
      
      // Add the bottom line to close the shape
      path += ` L 100 100 L 0 100 Z`;
      
      return path;
    } catch (error) {
      console.error('Error generating area path:', error);
      return `M 0 100 L 100 100 L 100 100 L 0 100 Z`;
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Productivity Insights</h1>
          <p className="text-sm text-neutral-400 mt-1">
            Track your task completion patterns and optimize your workflow
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm font-medium text-purple-400">{todayDate}</p>
          <p className="text-xs text-neutral-400 mt-1">
            {todayCompletionCount} {todayCompletionCount === 1 ? 'subtask' : 'subtasks'} completed today
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500 mb-4"></div>
          <p className="text-sm text-neutral-400">Loading data from Supabase...</p>
        </div>
      ) : error ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-4 p-8">
          <AlertCircle className="w-8 h-8 text-red-500" />
          <p className="text-neutral-400 text-center">{error}</p>
          <button
            onClick={handleRetry}
            className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg transition-colors"
          >
            Refresh Data
          </button>
        </div>
      ) : tasks.length === 0 && todos.length === 0 && todayCompletionCount === 0 ? (
        <div className="bg-neutral-800/50 backdrop-blur-sm border border-neutral-700/50 rounded-xl p-6 text-center">
          <Database className="w-10 h-10 text-purple-500 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-white mb-2">No Task Data Available</h3>
          <p className="text-neutral-300 mb-4">
            We couldn't find any completed subtasks in your Supabase database.
          </p>
          <div className="space-y-2 text-sm text-neutral-400 max-w-md mx-auto">
            <p>To see productivity insights:</p>
            <ol className="list-decimal list-inside text-left space-y-1">
              <li>Create todos and complete their subtasks</li>
              <li>Ensure todos and subtasks are being saved to Supabase</li>
              <li>Check that your user account has the correct permissions</li>
            </ol>
          </div>
          <button 
            onClick={handleRetry}
            className="mt-4 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-md text-sm transition-colors"
          >
            Refresh Data
          </button>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Data Source Indicator */}
          <div className="flex items-center justify-center gap-2 text-xs text-neutral-400 mb-2">
            <Database className="w-3 h-3" />
            <span>Data sourced from Supabase</span>
          </div>

          {/* Today's Completion Graph */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-neutral-800/50 backdrop-blur-sm border border-neutral-700/50 rounded-xl p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 w-8 h-8 rounded-lg bg-neutral-700/50 flex items-center justify-center">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                </div>
                <h2 className="text-lg font-semibold text-white">Today's Completions</h2>
              </div>
              
              {todayCompletionCount === 0 && (
                <div className="flex items-center gap-1 text-xs text-amber-400">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>No subtasks completed today</span>
                </div>
              )}
            </div>
            
            <CompletionGraph completionData={completionData} />
          </motion.div>

          {/* Weekly Productivity Heatmap */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="bg-neutral-800/50 backdrop-blur-sm border border-neutral-700/50 rounded-xl p-4"
          >
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 w-8 h-8 rounded-lg bg-neutral-700/50 flex items-center justify-center">
                <Calendar className="w-4 h-4 text-purple-400" />
              </div>
              <h2 className="text-lg font-semibold text-white">Weekly Productivity Heatmap</h2>
            </div>
            
            {productivityData.weeklyHeatmap.every(day => 
              day.morning === 0 && day.afternoon === 0 && day.evening === 0 && day.night === 0
            ) ? (
              <div className="flex flex-col items-center justify-center text-center p-8">
                <AlertCircle className="w-6 h-6 text-neutral-500 mb-2" />
                <p className="text-sm text-neutral-400 mb-1">No weekly productivity data available</p>
                <p className="text-xs text-neutral-500">Complete subtasks throughout the week to see your patterns</p>
              </div>
            ) : (
              <div className="space-y-3">
                {productivityData.weeklyHeatmap.map((dayData, index) => (
                  <motion.div 
                    key={dayData.day}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3, delay: 0.2 + index * 0.05 }}
                    className="flex items-center gap-3"
                  >
                    <div className="w-20 text-sm text-neutral-400">{dayData.day}</div>
                    <div className="flex-1 grid grid-cols-4 gap-1">
                      {['morning', 'afternoon', 'evening', 'night'].map((timeSlot) => (
                        <div 
                          key={timeSlot} 
                          className="h-8 rounded-md relative group"
                          style={{ 
                            backgroundColor: `rgba(168, 85, 247, ${dayData[timeSlot] / 100})`,
                            border: '1px solid rgba(168, 85, 247, 0.2)'
                          }}
                        >
                          {dayData[timeSlot] > 0 && (
                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                              <span className="text-xs font-medium text-white bg-purple-500/80 px-1.5 py-0.5 rounded">
                                {Math.round(dayData[timeSlot])}%
                              </span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </motion.div>
                ))}
                <div className="flex items-center justify-between text-xs text-neutral-500 mt-2 px-20">
                  <span>Morning</span>
                  <span>Afternoon</span>
                  <span>Evening</span>
                  <span>Night</span>
                </div>
              </div>
            )}
          </motion.div>

          {/* Insights */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="bg-neutral-800/50 backdrop-blur-sm border border-neutral-700/50 rounded-xl p-4"
          >
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 w-8 h-8 rounded-lg bg-neutral-700/50 flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-green-400" />
              </div>
              <h2 className="text-lg font-semibold text-white">AI-Generated Insights</h2>
            </div>
            
            {productivityData.insights.length === 0 ? (
              <div className="flex flex-col items-center justify-center text-center p-8">
                <AlertCircle className="w-6 h-6 text-neutral-500 mb-2" />
                <p className="text-sm text-neutral-400 mb-1">No insights available yet</p>
                <p className="text-xs text-neutral-500">Complete more subtasks to generate productivity insights</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {productivityData.insights.map((insight, index) => (
                  <motion.div
                    key={insight.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.4 + index * 0.1 }}
                    className="p-3 rounded-lg border border-neutral-700/50 bg-neutral-800/30 hover:bg-neutral-800/50 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-neutral-800 flex-shrink-0">
                        {insight.icon}
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-white">{insight.title}</h3>
                        <p className="text-xs text-neutral-400 mt-1">{insight.description}</p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>

          {/* Note about data */}
          <div className="flex items-start gap-2 text-xs text-neutral-500 px-4">
            <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <p>
              This analysis is based on your subtask completion history from Supabase. 
              The more subtasks you complete in your todos, the more accurate these insights will become.
              No sample or mock data is used.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Timeline;
