import { supabase } from '../lib/supabase';

class TaskRankingService {
  constructor(metricsService, userPreferencesService) {
    this.metricsService = metricsService;
    this.userPreferencesService = userPreferencesService;
    
    this.rankingCache = new Map();
    this.cacheTTL = 5 * 60 * 1000; // 5 minutes
    
    // Weights for busyness calculation
    this.weights = {
      taskCount: 0.4,
      totalDuration: 0.3,
      averageDifficulty: 0.3
    };
    
    if (this.metricsService) {
      this.metricsService.info('initialization', 'TaskRankingService initialized');
    }
  }
  
  /**
   * Get a summary of day rankings for a date range
   * @param {string} startDate - Start date in ISO format (YYYY-MM-DD)
   * @param {string} endDate - End date in ISO format (YYYY-MM-DD)
   * @param {string} userId - User ID
   * @returns {Promise<Array>} - Ranked days with task details
   */
  async getDayRankingSummary(startDate, endDate, userId) {
    const timerId = this.metricsService.startTimer('day_ranking_summary');
    
    try {
      // Check cache first
      const cacheKey = `${userId}_${startDate}_${endDate}`;
      const cachedResult = this.rankingCache.get(cacheKey);
      
      if (cachedResult && (Date.now() - cachedResult.timestamp < this.cacheTTL)) {
        this.metricsService.info('cache', 'Ranking cache hit', { userId, startDate, endDate });
        this.metricsService.trackCacheHit('rankingCache');
        this.metricsService.endTimer(timerId, { cache_hit: true });
        return cachedResult.data;
      }
      
      // Get user authentication if userId not provided
      if (!userId) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          throw new Error('User not authenticated');
        }
        userId = user.id;
      }
      
      this.metricsService.checkpoint(timerId, 'user_authenticated');
      
      // Fetch tasks for the date range
      const { data: tasks, error: tasksError } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', userId)
        .gte('schedule', startDate)
        .lte('schedule', endDate)
        .order('schedule', { ascending: true });
        
      if (tasksError) throw tasksError;
      
      this.metricsService.checkpoint(timerId, 'tasks_fetched');
      this.metricsService.info('ranking', 'Tasks fetched for ranking', { 
        taskCount: tasks?.length || 0,
        startDate,
        endDate
      });
      
      // Group tasks by day
      const tasksByDay = this.groupTasksByDay(tasks || []);
      
      // Calculate metrics for each day
      const dayMetrics = this.calculateDayMetrics(tasksByDay, startDate, endDate);
      
      // Rank days by busyness (total duration)
      const rankedDays = this.rankDaysByBusyness(dayMetrics);
      
      this.metricsService.checkpoint(timerId, 'days_ranked');
      
      // Cache the result
      this.rankingCache.set(cacheKey, {
        timestamp: Date.now(),
        data: rankedDays
      });
      
      this.metricsService.endTimer(timerId, { 
        dayCount: rankedDays.length,
        busiestDay: rankedDays.length > 0 ? rankedDays[0].formattedDate : null
      });
      
      return rankedDays;
    } catch (error) {
      this.metricsService.error('ranking', 'Error getting day ranking summary', { error: error.message });
      this.metricsService.endTimer(timerId, { error: error.message });
      throw error;
    }
  }
  
  /**
   * Group tasks by day
   * @param {Array} tasks - Tasks to group
   * @returns {Object} - Tasks grouped by day
   */
  groupTasksByDay(tasks) {
    const tasksByDay = {};
    
    tasks.forEach(task => {
      if (!task.schedule) return;
      
      const dateKey = task.schedule.split('T')[0];
      
      if (!tasksByDay[dateKey]) {
        tasksByDay[dateKey] = [];
      }
      
      tasksByDay[dateKey].push(task);
    });
    
    return tasksByDay;
  }
  
  /**
   * Calculate metrics for each day
   * @param {Object} tasksByDay - Tasks grouped by day
   * @param {string} startDate - Start date in ISO format
   * @param {string} endDate - End date in ISO format
   * @returns {Array} - Day metrics
   */
  calculateDayMetrics(tasksByDay, startDate, endDate) {
    const dayMetrics = [];
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    // Create a day for each date in the range
    for (let day = new Date(start); day <= end; day.setDate(day.getDate() + 1)) {
      const dateKey = day.toISOString().split('T')[0];
      const dayTasks = tasksByDay[dateKey] || [];
      
      // Calculate metrics
      const totalDuration = dayTasks.reduce((sum, task) => sum + (task.duration || 60), 0);
      const averageDifficulty = dayTasks.length > 0 
        ? dayTasks.reduce((sum, task) => sum + (task.difficulty || 3), 0) / dayTasks.length
        : 0;
      const maxDifficulty = dayTasks.length > 0
        ? Math.max(...dayTasks.map(task => task.difficulty || 3))
        : 0;
      
      // Format date for display
      const formattedDate = this.formatDate(day);
      
      dayMetrics.push({
        date: dateKey,
        formattedDate,
        taskCount: dayTasks.length,
        totalDuration,
        averageDifficulty,
        maxDifficulty,
        busynessScore: this.calculateBusynessScore(dayTasks),
        tasks: dayTasks.map(task => ({
          id: task.id,
          title: task.title,
          duration: task.duration || 60,
          difficulty: task.difficulty || 3,
          time: task.time || '09:00'
        }))
      });
    }
    
    return dayMetrics;
  }
  
  /**
   * Calculate busyness score for a set of tasks
   * @param {Array} tasks - Tasks to calculate score for
   * @returns {number} - Busyness score
   */
  calculateBusynessScore(tasks) {
    if (tasks.length === 0) return 0;
    
    // Base score from total duration
    const totalDuration = tasks.reduce((sum, task) => sum + (task.duration || 60), 0);
    let score = totalDuration / 60; // Hours of work
    
    // Add bonus for difficult tasks
    const difficultyBonus = tasks.reduce((sum, task) => sum + (task.difficulty || 3), 0) / tasks.length;
    score += difficultyBonus * 2;
    
    // Add bonus for number of tasks (context switching)
    score += Math.min(10, tasks.length * 0.5);
    
    return Math.round(score * 10) / 10; // Round to 1 decimal place
  }
  
  /**
   * Rank days by busyness
   * @param {Array} dayMetrics - Day metrics
   * @returns {Array} - Ranked days
   */
  rankDaysByBusyness(dayMetrics) {
    // Sort by busyness score (descending)
    return dayMetrics.sort((a, b) => b.busynessScore - a.busynessScore);
  }
  
  /**
   * Format date for display
   * @param {Date} date - Date to format
   * @returns {string} - Formatted date
   */
  formatDate(date) {
    const options = { weekday: 'long', month: 'short', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
  }
  
  /**
   * Get the busiest day in a date range
   * @param {string} startDate - Start date in ISO format
   * @param {string} endDate - End date in ISO format
   * @param {string} userId - User ID
   * @returns {Promise<Object>} - Busiest day details
   */
  async getBusiestDay(startDate, endDate, userId) {
    const rankedDays = await this.getDayRankingSummary(startDate, endDate, userId);
    return rankedDays.length > 0 ? rankedDays[0] : null;
  }
  
  /**
   * Get the least busy day in a date range
   * @param {string} startDate - Start date in ISO format
   * @param {string} endDate - End date in ISO format
   * @param {string} userId - User ID
   * @returns {Promise<Object>} - Least busy day details
   */
  async getLeastBusyDay(startDate, endDate, userId) {
    const rankedDays = await this.getDayRankingSummary(startDate, endDate, userId);
    return rankedDays.length > 0 ? rankedDays[rankedDays.length - 1] : null;
  }
  
  /**
   * Get task completion statistics
   * @param {string} startDate - Start date in ISO format
   * @param {string} endDate - End date in ISO format
   * @param {string} userId - User ID
   * @returns {Promise<Object>} - Task completion statistics
   */
  async getTaskCompletionStats(startDate, endDate, userId) {
    const timerId = this.metricsService.startTimer('task_completion_stats');
    
    try {
      // Get user authentication if userId not provided
      if (!userId) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          throw new Error('User not authenticated');
        }
        userId = user.id;
      }
      
      // Fetch completed tasks
      const { data: completedTasks, error: completedError } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', userId)
        .eq('completed', true)
        .gte('schedule', startDate)
        .lte('schedule', endDate);
        
      if (completedError) throw completedError;
      
      // Fetch all tasks
      const { data: allTasks, error: allError } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', userId)
        .gte('schedule', startDate)
        .lte('schedule', endDate);
        
      if (allError) throw allError;
      
      this.metricsService.checkpoint(timerId, 'tasks_fetched');
      
      // Calculate statistics
      const totalTasks = allTasks?.length || 0;
      const completedCount = completedTasks?.length || 0;
      const completionRate = totalTasks > 0 ? (completedCount / totalTasks) * 100 : 0;
      
      // Calculate average time spent vs. estimated duration
      let timeAccuracy = 0;
      let tasksWithTimeData = 0;
      
      completedTasks?.forEach(task => {
        if (task.time_spent && task.duration) {
          timeAccuracy += task.time_spent / task.duration;
          tasksWithTimeData++;
        }
      });
      
      const averageTimeAccuracy = tasksWithTimeData > 0 ? timeAccuracy / tasksWithTimeData : 0;
      
      const stats = {
        totalTasks,
        completedCount,
        completionRate: Math.round(completionRate),
        averageTimeAccuracy: Math.round(averageTimeAccuracy * 100) / 100,
        startDate,
        endDate
      };
      
      this.metricsService.endTimer(timerId, stats);
      
      return stats;
    } catch (error) {
      this.metricsService.error('stats', 'Error getting task completion stats', { error: error.message });
      this.metricsService.endTimer(timerId, { error: error.message });
      throw error;
    }
  }
  
  /**
   * Get productivity patterns by time of day
   * @param {string} startDate - Start date in ISO format
   * @param {string} endDate - End date in ISO format
   * @param {string} userId - User ID
   * @returns {Promise<Object>} - Productivity patterns
   */
  async getProductivityPatterns(startDate, endDate, userId) {
    const timerId = this.metricsService.startTimer('productivity_patterns');
    
    try {
      // Get user authentication if userId not provided
      if (!userId) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          throw new Error('User not authenticated');
        }
        userId = user.id;
      }
      
      // Fetch completed tasks with productivity scores
      const { data: tasks, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', userId)
        .eq('completed', true)
        .not('productivity_score', 'is', null)
        .gte('schedule', startDate)
        .lte('schedule', endDate);
        
      if (error) throw error;
      
      this.metricsService.checkpoint(timerId, 'tasks_fetched');
      
      // Group by hour of day
      const hourlyPatterns = {};
      
      // Initialize hours
      for (let i = 0; i < 24; i++) {
        hourlyPatterns[i] = {
          hour: i,
          taskCount: 0,
          averageProductivity: 0,
          totalProductivity: 0
        };
      }
      
      // Process tasks
      tasks?.forEach(task => {
        if (!task.time) return;
        
        const [hours] = task.time.split(':').map(Number);
        
        hourlyPatterns[hours].taskCount++;
        hourlyPatterns[hours].totalProductivity += task.productivity_score || 0;
      });
      
      // Calculate averages
      Object.values(hourlyPatterns).forEach(hourData => {
        if (hourData.taskCount > 0) {
          hourData.averageProductivity = hourData.totalProductivity / hourData.taskCount;
        }
      });
      
      // Convert to array and sort by productivity
      const patterns = Object.values(hourlyPatterns)
        .filter(h => h.taskCount > 0)
        .sort((a, b) => b.averageProductivity - a.averageProductivity);
      
      // Find most and least productive hours
      const mostProductiveHours = patterns.slice(0, 3).map(h => h.hour);
      const leastProductiveHours = patterns.slice(-3).map(h => h.hour);
      
      const result = {
        patterns,
        mostProductiveHours,
        leastProductiveHours,
        startDate,
        endDate
      };
      
      this.metricsService.endTimer(timerId, { 
        taskCount: tasks?.length || 0,
        mostProductiveHour: mostProductiveHours[0]
      });
      
      return result;
    } catch (error) {
      this.metricsService.error('productivity', 'Error getting productivity patterns', { error: error.message });
      this.metricsService.endTimer(timerId, { error: error.message });
      throw error;
    }
  }
}

/**
 * Factory function to create a new TaskRankingService
 * @param {Object} metricsService - The metrics service for logging and tracking
 * @param {Object} userPreferencesService - The user preferences service
 * @returns {TaskRankingService} - A new TaskRankingService instance
 */
export function createTaskRankingService(metricsService, userPreferencesService) {
  return new TaskRankingService(metricsService, userPreferencesService);
}

// For backward compatibility - will be deprecated
const taskRankingService = new TaskRankingService();
export default taskRankingService; 