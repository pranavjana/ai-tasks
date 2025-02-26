// scheduleService.js
import { supabase } from '../lib/supabase';
import metricsService from './metrics';
import userPreferencesService from './userPreferences.js';

/**
 * Handle schedule analysis requests
 * @param {string} input - User input
 * @param {string} userId - User ID
 * @param {Object} contextObj - Context object with dependencies
 * @returns {Object} - Response object
 */
export async function handleScheduleAnalysis(input, userId, contextObj) {
  const { chat, conversationHistory, metricsService, taskRankingService } = contextObj;
  const timerId = metricsService.startTimer('schedule_analysis');
  
  try {
    metricsService.checkpoint(timerId, 'task_ranking_service_loaded');
    
    // Get date range for the next 7 days
    const startDate = new Date().toISOString().split('T')[0];
    const endDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    metricsService.info('schedule_analysis', 'Getting day ranking summary', { startDate, endDate });
    const rankedDays = await taskRankingService.getDayRankingSummary(startDate, endDate);
    metricsService.checkpoint(timerId, 'days_ranked');
    
    let response;
    if (input.toLowerCase().includes('least busy') || 
        input.toLowerCase().includes('free') || 
        input.toLowerCase().includes('available')) {
      const leastBusyDay = rankedDays[rankedDays.length - 1];
      response = `Based on your schedule for the next week, you're least busy on ${leastBusyDay.formattedDate}. You have ${leastBusyDay.taskCount} tasks scheduled that day with a total duration of ${leastBusyDay.totalDuration} minutes.`;
      metricsService.info('schedule_analysis', 'Generated least busy day response', {
        day: leastBusyDay.formattedDate,
        taskCount: leastBusyDay.taskCount
      });
    } else {
      const busiestDay = rankedDays[0];
      response = `Based on your schedule for the next week, you're busiest on ${busiestDay.formattedDate}. You have ${busiestDay.taskCount} tasks scheduled that day with a total duration of ${busiestDay.totalDuration} minutes. Here are your tasks for that day:\n` +
        busiestDay.tasks.map(task => `- ${task.title} (${task.duration} minutes${task.difficulty ? `, difficulty: ${task.difficulty}` : ''})`).join('\n');
      metricsService.info('schedule_analysis', 'Generated busiest day response', {
        day: busiestDay.formattedDate,
        taskCount: busiestDay.taskCount
      });
    }
    
    metricsService.checkpoint(timerId, 'response_generated');
    conversationHistory.push({ role: 'user', message: input });
    conversationHistory.push({ role: 'assistant', message: response });
    
    metricsService.endTimer(timerId, { response_length: response.length, days_analyzed: rankedDays.length });
    return { type: 'conversation', data: { response } };
  } catch (error) {
    console.error('Error in schedule analysis:', error);
    metricsService.error('schedule_analysis', 'Error analyzing schedule', { error: error.message });
    metricsService.endTimer(timerId, { error: error.message });
    return contextObj.handleError(error, 'schedule_analysis');
  }
}

export async function handleScheduleQuery(input, userId, contextObj) {
  const { chat, conversationHistory } = contextObj;
  const timerId = metricsService.startTimer('schedule_query');
  
  try {
    metricsService.info('schedule_query', 'Finding optimal schedule time', { input });
    const suggestion = await contextObj.suggestBestScheduleTime(input, userId);
    
    metricsService.checkpoint(timerId, 'suggestion_generated');
    conversationHistory.push({ role: 'user', message: input });
    conversationHistory.push({ role: 'assistant', message: suggestion.suggestion });
    
    metricsService.endTimer(timerId, { 
      is_fallback: suggestion.details.scheduleSuggestion.isFallback || false,
      has_alternatives: suggestion.details.scheduleSuggestion.alternatives.length > 0
    });
    return {
      type: 'conversation',
      data: { 
        response: suggestion.suggestion,
        scheduling: {
          bestSlot: suggestion.details.scheduleSuggestion.bestSlot,
          alternatives: suggestion.details.scheduleSuggestion.alternatives,
          taskDetails: suggestion.details.taskDetails
        }
      }
    };
  } catch (error) {
    console.error('Error in schedule query:', error);
    metricsService.error('schedule_query', 'Error finding optimal schedule', { error: error.message });
    metricsService.endTimer(timerId, { error: error.message });
    return contextObj.handleError(error, 'schedule_query');
  }
}

export async function findOptimalScheduleSlot(newTaskDuration, userId, contextObj) {
  const timerId = metricsService.startTimer('find_optimal_slot');
  const cacheKey = `${userId}_${newTaskDuration}`;
  const scheduleCache = contextObj.scheduleCache;
  const cacheTTL = contextObj.cacheTTL;
  
  const cachedResult = scheduleCache.get(cacheKey);
  if (cachedResult && (Date.now() - cachedResult.timestamp < cacheTTL)) {
    console.log('Using cached schedule result');
    metricsService.info('cache', 'Schedule cache hit', { userId, taskDuration: newTaskDuration });
    metricsService.trackCacheHit('scheduleCache');
    metricsService.endTimer(timerId, { cache_hit: true });
    return cachedResult.data;
  }
  
  try {
    const userPreferencesService = (await import('./userPreferences.js')).default;
    metricsService.info('preferences', 'Fetching user preferences', { userId });
    const userPreferences = await userPreferencesService.getUserPreferences(userId);
    metricsService.checkpoint(timerId, 'preferences_fetched');
    
    metricsService.info('database', 'Fetching tasks and todos', { userId });
    const { data: existingTasks, error: tasksError } = await supabase
      .from('tasks')
      .select(`
          id,
          title,
          duration,
          schedule,
          time,
          created_at,
          productivity_score,
          time_spent
        `)
      .eq('user_id', userId)
      .gte('schedule', new Date().toISOString().split('T')[0])
      .order('schedule', { ascending: true });

    if (tasksError) throw tasksError;

    const { data: todos, error: todosError } = await supabase
      .from('todos')
      .select(`
          id,
          title,
          due_date,
          completed,
          subtasks (
            id,
            completed,
            completed_at
          )
        `)
      .eq('user_id', userId)
      .gte('due_date', new Date().toISOString().split('T')[0])
      .order('due_date', { ascending: true });

    if (todosError) throw todosError;
    
    metricsService.checkpoint(timerId, 'data_fetched');
    metricsService.info('scheduling', 'Building schedule map', { 
      taskCount: existingTasks?.length || 0,
      todoCount: todos?.length || 0
    });
    const schedule = buildScheduleMap(existingTasks || [], todos || [], userPreferences);
    metricsService.checkpoint(timerId, 'schedule_map_built');
    
    metricsService.info('scheduling', 'Finding best time slot', { taskDuration: newTaskDuration });
    const optimalSlot = findBestTimeSlot(schedule, newTaskDuration, userPreferences);
    metricsService.checkpoint(timerId, 'optimal_slot_found');
    
    scheduleCache.set(cacheKey, { timestamp: Date.now(), data: optimalSlot });
    metricsService.endTimer(timerId, { 
      has_best_slot: !!optimalSlot.bestSlot,
      alternative_count: optimalSlot.alternatives.length,
      has_conflicts: optimalSlot.hasConflicts
    });
    metricsService.trackScheduling('success', Date.now() - timerId.startTime);
    return optimalSlot;
  } catch (error) {
    console.error('Error finding optimal schedule:', error);
    metricsService.error('scheduling', 'Error finding optimal schedule', { error: error.message });
    metricsService.endTimer(timerId, { error: error.message });
    metricsService.trackScheduling('error', Date.now() - timerId.startTime);
    return fallbackScheduleSuggestion(newTaskDuration);
  }
}

export function fallbackScheduleSuggestion(taskDuration) {
  metricsService.info('scheduling', 'Using fallback scheduling suggestion', { taskDuration });
  metricsService.trackScheduling('fallback', 0);
  
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(10, 0, 0, 0);
  
  const dateKey = tomorrow.toISOString().split('T')[0];
  return {
    bestSlot: {
      date: dateKey,
      startTime: tomorrow,
      endTime: new Date(tomorrow.getTime() + taskDuration * 60000),
      score: 50,
      metrics: { freeTimePercentage: 100, todoCount: 0, productivityScore: 5 }
    },
    alternatives: [],
    hasConflicts: false,
    isFallback: true
  };
}

export function buildScheduleMap(tasks, todos, userPreferences) {
  const scheduleMap = {};
  const now = new Date();
  
  // Initialize the next 14 days
  for (let i = 0; i < 14; i++) {
    const date = new Date(now);
    date.setDate(date.getDate() + i);
    const dateKey = date.toISOString().split('T')[0];
    scheduleMap[dateKey] = {
      date: dateKey,
      busySlots: [],
      totalTaskDuration: 0,
      productivityScore: 0,
      todoCount: 0,
      freeTimeSlots: []
    };
  }
  
  // Add tasks to the schedule
  tasks.forEach(task => {
    if (!task.schedule) return;
    const taskDate = task.schedule.split('T')[0];
    if (!scheduleMap[taskDate]) return;
    const startTime = new Date(task.schedule);
    if (task.time) {
      const [hours, minutes] = task.time.split(':').map(Number);
      startTime.setHours(hours, minutes, 0, 0);
    } else {
      startTime.setHours(9, 0, 0, 0);
    }
    const endTime = new Date(startTime.getTime() + (task.duration || 60) * 60000);
    scheduleMap[taskDate].busySlots.push({
      start: startTime,
      end: endTime,
      title: task.title,
      duration: task.duration || 60,
      productivityScore: task.productivity_score || 5
    });
    scheduleMap[taskDate].totalTaskDuration += (task.duration || 60);
    scheduleMap[taskDate].productivityScore += (task.productivity_score || 5);
  });
  
  // Add todos to the schedule
  todos.forEach(todo => {
    if (!todo.due_date) return;
    const todoDate = todo.due_date.split('T')[0];
    if (!scheduleMap[todoDate]) return;
    scheduleMap[todoDate].todoCount += 1;
  });
  
  // Calculate free time slots based on user preferences
  Object.keys(scheduleMap).forEach(dateKey => {
    const dayData = scheduleMap[dateKey];
    const date = new Date(dateKey);
    const dayOfWeek = date.getDay();
    if (!userPreferences.workDays.includes(dayOfWeek)) return;
    const [workStartHour, workStartMinute] = userPreferences.workHours.start.split(':').map(Number);
    const [workEndHour, workEndMinute] = userPreferences.workHours.end.split(':').map(Number);
    const workStart = new Date(date);
    workStart.setHours(workStartHour, workStartMinute, 0, 0);
    const workEnd = new Date(date);
    workEnd.setHours(workEndHour, workEndMinute, 0, 0);
    dayData.busySlots.sort((a, b) => a.start - b.start);
    let currentTime = new Date(workStart);
    const breakSlots = userPreferences.breakTimes.map(breakTime => {
      const [startHour, startMinute] = breakTime.start.split(':').map(Number);
      const [endHour, endMinute] = breakTime.end.split(':').map(Number);
      const breakStart = new Date(date);
      breakStart.setHours(startHour, startMinute, 0, 0);
      const breakEnd = new Date(date);
      breakEnd.setHours(endHour, endMinute, 0, 0);
      return { start: breakStart, end: breakEnd, title: breakTime.label || 'Break', isBreak: true };
    });
    const allBusySlots = [...dayData.busySlots, ...breakSlots].sort((a, b) => a.start - b.start);
    for (const slot of allBusySlots) {
      if (slot.end <= workStart || slot.start >= workEnd) continue;
      if (slot.start > currentTime) {
        dayData.freeTimeSlots.push({
          start: new Date(currentTime),
          end: new Date(slot.start),
          duration: (slot.start - currentTime) / 60000
        });
      }
      currentTime = new Date(Math.max(currentTime.getTime(), slot.end.getTime()));
    }
    if (currentTime < workEnd) {
      dayData.freeTimeSlots.push({
        start: new Date(currentTime),
        end: new Date(workEnd),
        duration: (workEnd - currentTime) / 60000
      });
    }
  });
  return scheduleMap;
}

export function findBestTimeSlot(scheduleMap, taskDuration, userPreferences) {
  const slots = [];
  const now = new Date();
  Object.keys(scheduleMap).forEach(dateKey => {
    const dayData = scheduleMap[dateKey];
    const date = new Date(dateKey);
    if (date < now) return;
    const dayOfWeek = date.getDay();
    if (!userPreferences.workDays.includes(dayOfWeek)) return;
    dayData.freeTimeSlots.forEach(slot => {
      if (slot.duration < taskDuration) return;
      if (slot.end <= now) return;
      const score = calculateSlotScore(slot, dayData, taskDuration, userPreferences);
      slots.push({
        date: dateKey,
        startTime: slot.start,
        endTime: new Date(slot.start.getTime() + taskDuration * 60000),
        score,
        metrics: {
          freeTimePercentage: (slot.duration / taskDuration) * 100,
          todoCount: dayData.todoCount,
          productivityScore: userPreferencesService.calculateProductivityScore(slot.start, userPreferences)
        }
      });
    });
  });
  slots.sort((a, b) => b.score - a.score);
  return {
    bestSlot: slots[0] || fallbackScheduleSuggestion(taskDuration).bestSlot,
    alternatives: slots.slice(1, 4),
    hasConflicts: slots.length === 0
  };
}

export function calculateSlotScore(slot, dayData, taskDuration, userPreferences) {
  let score = 50;
  const freeTimePercentage = (slot.duration / taskDuration) * 100;
  if (freeTimePercentage >= 200) score += 20;
  else if (freeTimePercentage >= 150) score += 15;
  else if (freeTimePercentage >= 120) score += 10;
  else score += 5;
  
  const totalTaskMinutes = dayData.totalTaskDuration;
  if (totalTaskMinutes === 0) score += 20;
  else if (totalTaskMinutes < 120) score += 15;
  else if (totalTaskMinutes < 240) score += 10;
  else if (totalTaskMinutes < 360) score += 5;
  else score -= 10;
  
  if (dayData.todoCount === 0) score += 10;
  else if (dayData.todoCount < 3) score += 5;
  else if (dayData.todoCount >= 5) score -= 10;
  
  const productivityScore = userPreferencesService.calculateProductivityScore(slot.start, userPreferences);
  score += productivityScore * 2;
  
  const daysFromNow = Math.floor((slot.start - now) / (24 * 60 * 60 * 1000));
  score -= daysFromNow * 2;
  
  const hour = slot.start.getHours();
  if (hour >= 9 && hour <= 12) score += 10;
  return Math.max(0, Math.min(100, score));
}

export async function suggestBestScheduleTime(input, userId, contextObj) {
  const timerId = metricsService.startTimer('suggest_best_time');
  try {
    const prompt = `
        Analyze this task request and extract:
        1. Estimated duration in minutes
        2. Task complexity (1-5)
        3. Any time preferences mentioned
        4. Any scheduling constraints
        
        Task: ${input}
        
        Respond in JSON format:
        {
          "duration": number,
          "complexity": number,
          "preferences": string[],
          "constraints": string[]
        }
      `;
    metricsService.info('ai_request', 'Analyzing task details', { input_length: input.length });
    metricsService.checkpoint(timerId, 'sending_task_analysis');
    
    const aiTimerId = metricsService.startTimer('ai_task_analysis');
    const analysis = await contextObj.model.generateContent(prompt);
    const taskDetails = JSON.parse(cleanJsonResponse(analysis.response.text()));
    metricsService.endTimer(aiTimerId);
    metricsService.trackAICall('taskAnalysis');
    
    metricsService.checkpoint(timerId, 'task_details_extracted');
    metricsService.info('scheduling', 'Task details extracted', { duration: taskDetails.duration, complexity: taskDetails.complexity });
    
    const scheduleSuggestion = await findOptimalScheduleSlot(taskDetails.duration, userId, contextObj);
    metricsService.checkpoint(timerId, 'optimal_slot_found');

    const responsePrompt = `
        Given the following scheduling analysis, create a natural, helpful response suggesting the best time to schedule this task.
        Include the reasoning behind the suggestion and any alternative options if available.
        
        Task: ${input}
        
        Best slot found: ${JSON.stringify(scheduleSuggestion.bestSlot)}
        Alternative slots: ${JSON.stringify(scheduleSuggestion.alternatives)}
        Has scheduling conflicts: ${scheduleSuggestion.hasConflicts}
        Is fallback suggestion: ${scheduleSuggestion.isFallback || false}
        
        Task details:
        - Estimated duration: ${taskDetails.duration} minutes
        - Complexity: ${taskDetails.complexity}/5
        - User preferences: ${taskDetails.preferences.join(', ')}
        - Constraints: ${taskDetails.constraints.join(', ')}
        
        Response should be conversational and include:
        1. The best suggested time/day
        2. Why this time was chosen
        3. Alternative options if available
        4. Any relevant warnings or considerations
      `;
    metricsService.info('ai_request', 'Generating scheduling response', { 
      has_alternatives: scheduleSuggestion.alternatives.length > 0,
      is_fallback: scheduleSuggestion.isFallback || false
    });
    
    const responseTimerId = metricsService.startTimer('ai_response_generation');
    const response = await contextObj.model.generateContent(responsePrompt);
    metricsService.endTimer(responseTimerId);
    metricsService.trackAICall('responseGeneration');
    
    metricsService.checkpoint(timerId, 'response_generated');
    metricsService.endTimer(timerId, { task_duration: taskDetails.duration, task_complexity: taskDetails.complexity, is_fallback: scheduleSuggestion.isFallback || false });
    
    return {
      suggestion: response.response.text(),
      details: { scheduleSuggestion, taskDetails }
    };
  } catch (error) {
    metricsService.error('scheduling', 'Error suggesting best time', { error: error.message });
    metricsService.endTimer(timerId, { error: error.message });
    metricsService.trackAIError();
    return {
      suggestion: "I'm having trouble finding the optimal time for your task. Based on general best practices, tomorrow morning around 10 AM might be a good time for this task.",
      details: {
        scheduleSuggestion: fallbackScheduleSuggestion(60),
        taskDetails: { duration: 60, complexity: 3, preferences: [], constraints: [] }
      }
    };
  }
}

/**
 * Factory function to create schedule service functions
 * @param {Object} metricsService - Metrics service
 * @param {Object} userPreferencesService - User preferences service
 * @param {Object} taskRankingService - Task ranking service
 * @returns {Object} - Schedule service functions
 */
export function createScheduleService(metricsService, userPreferencesService, taskRankingService) {
  return {
    handleScheduleAnalysis: (input, userId, contextObj) => 
      handleScheduleAnalysis(input, userId, { 
        ...contextObj, 
        metricsService, 
        taskRankingService 
      }),
    handleScheduleQuery: (input, userId, contextObj) => 
      handleScheduleQuery(input, userId, { 
        ...contextObj, 
        metricsService 
      }),
    findOptimalScheduleSlot: (newTaskDuration, userId, contextObj) => 
      findOptimalScheduleSlot(newTaskDuration, userId, { 
        ...contextObj, 
        metricsService, 
        userPreferencesService 
      }),
    fallbackScheduleSuggestion: (taskDuration) => 
      fallbackScheduleSuggestion(taskDuration),
    suggestBestScheduleTime: (input, userId, contextObj) => 
      suggestBestScheduleTime(input, userId, { 
        ...contextObj, 
        metricsService, 
        userPreferencesService 
      })
  };
}
