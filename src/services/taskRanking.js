import { supabase } from '../lib/supabase';

class TaskRankingService {
  // Calculate task difficulty score
  calculateTaskScore(task) {
    let score = task.difficulty || 1; // Base score is the difficulty (1-5)
    
    // Add weight for duration if available (1 point per hour, max 8)
    if (task.duration) {
      const durationHours = task.duration / 60; // Convert minutes to hours
      score += Math.min(durationHours, 8);
    }
    
    return score;
  }

  // Calculate day score based on tasks
  calculateDayScore(tasks) {
    return tasks.reduce((total, task) => total + this.calculateTaskScore(task), 0);
  }

  // Group tasks by day
  groupTasksByDay(tasks) {
    const grouped = {};
    
    for (const task of tasks) {
      // Handle both ISO format and YYYY-MM-DD format
      const date = task.schedule.includes('T') 
        ? task.schedule.split('T')[0] 
        : task.schedule;
        
      if (!grouped[date]) {
        grouped[date] = [];
      }
      grouped[date].push(task);
    }
    
    return grouped;
  }

  // Rank days by difficulty
  async rankDays(startDate, endDate) {
    try {
      // Fetch tasks for the date range
      const { data: tasks, error } = await supabase
        .from('tasks')
        .select('*')
        .gte('schedule', startDate)
        .lte('schedule', endDate)
        .order('schedule', { ascending: true });

      if (error) throw error;
      if (!tasks?.length) return [];

      // Group tasks by day
      const groupedTasks = this.groupTasksByDay(tasks);

      // Calculate scores for each day
      const dayScores = Object.entries(groupedTasks).map(([date, dayTasks]) => ({
        date,
        tasks: dayTasks,
        score: this.calculateDayScore(dayTasks),
        totalTasks: dayTasks.length,
        totalDuration: dayTasks.reduce((sum, task) => sum + (task.duration || 0), 0)
      }));

      // Sort days by score (descending)
      return dayScores.sort((a, b) => b.score - a.score);
    } catch (error) {
      console.error('Error ranking days:', error);
      return [];
    }
  }

  // Find the least busy day in a range
  async findLeastBusyDay(startDate, endDate) {
    const rankedDays = await this.rankDays(startDate, endDate);
    return rankedDays[rankedDays.length - 1] || null;
  }

  // Find the busiest day in a range
  async findBusiestDay(startDate, endDate) {
    const rankedDays = await this.rankDays(startDate, endDate);
    return rankedDays[0] || null;
  }

  // Get day ranking summary
  async getDayRankingSummary(startDate, endDate) {
    const rankedDays = await this.rankDays(startDate, endDate);
    
    return rankedDays.map(day => ({
      date: day.date,
      formattedDate: new Date(day.date).toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric'
      }),
      difficulty: day.score.toFixed(1),
      taskCount: day.totalTasks,
      totalDuration: day.totalDuration,
      tasks: day.tasks.map(task => ({
        title: task.title,
        difficulty: task.difficulty,
        duration: task.duration
      }))
    }));
  }
}

export const taskRankingService = new TaskRankingService(); 