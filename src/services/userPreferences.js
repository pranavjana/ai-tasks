import { supabase } from '../lib/supabase';

class UserPreferencesService {
  constructor(metricsService) {
    this.metricsService = metricsService;
    this.preferencesCache = new Map();
    this.cacheTTL = 5 * 60 * 1000; // 5 minutes
    
    // Default preferences
    this.defaultPreferences = {
      workHours: {
        start: '09:00',
        end: '17:00'
      },
      workDays: [1, 2, 3, 4, 5], // Monday to Friday (0 = Sunday)
      productiveHours: {
        start: '10:00',
        end: '14:00'
      },
      breakTimes: [
        { start: '12:00', end: '13:00', label: 'Lunch' }
      ],
      taskPreferences: {
        preferredTaskDuration: 60, // minutes
        minimumBreakBetweenTasks: 15, // minutes
        maximumConsecutiveTasks: 3
      },
      notifications: {
        enabled: true,
        reminderTime: 15 // minutes before task
      }
    };
    
    if (this.metricsService) {
      this.metricsService.info('initialization', 'UserPreferencesService initialized');
    }
  }
  
  /**
   * Get user preferences, with fallback to defaults
   * @param {string} userId - The user ID
   * @returns {Promise<Object>} - User preferences
   */
  async getUserPreferences(userId) {
    // Check cache first
    const cachedPrefs = this.preferencesCache.get(userId);
    if (cachedPrefs && (Date.now() - cachedPrefs.timestamp < this.cacheTTL)) {
      if (this.metricsService) {
        this.metricsService.trackCacheHit('preferencesCache');
      }
      return cachedPrefs.data;
    }
    
    try {
      if (this.metricsService) {
        this.metricsService.info('userPreferences', 'Fetching user preferences', { userId });
      }
      
      // Try to get user preferences from database
      const { data, error } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', userId)
        .single();
        
      if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned"
        console.error('Error fetching user preferences:', error);
        if (this.metricsService) {
          this.metricsService.error('userPreferences', 'Error fetching preferences', { error: error.message });
        }
        throw error;
      }
      
      // If no preferences found, create default ones
      if (!data) {
        return await this.createDefaultPreferences(userId);
      }
      
      // Process the data from the database
      const preferences = this.processPreferencesFromDB(data);
      
      // Cache the preferences
      this.preferencesCache.set(userId, {
        data: preferences,
        timestamp: Date.now()
      });
      
      return preferences;
    } catch (error) {
      console.error('Error in getUserPreferences:', error);
      if (this.metricsService) {
        this.metricsService.error('userPreferences', 'Error in getUserPreferences', { error: error.message });
      }
      
      // Return default preferences on error
      return { ...this.defaultPreferences };
    }
  }
  
  /**
   * Create default preferences for a new user
   * @param {string} userId - The user ID
   * @returns {Promise<Object>} - The created preferences
   */
  async createDefaultPreferences(userId) {
    try {
      const preferencesData = {
        user_id: userId,
        work_hours: JSON.stringify(this.defaultPreferences.workHours),
        work_days: JSON.stringify(this.defaultPreferences.workDays),
        productive_hours: JSON.stringify(this.defaultPreferences.productiveHours),
        break_times: JSON.stringify(this.defaultPreferences.breakTimes),
        task_preferences: JSON.stringify(this.defaultPreferences.taskPreferences),
        notifications: JSON.stringify(this.defaultPreferences.notifications),
        created_at: new Date().toISOString()
      };
      
      const { data, error } = await supabase
        .from('user_preferences')
        .insert(preferencesData)
        .select()
        .single();
        
      if (error) {
        console.error('Error creating default preferences:', error);
        throw error;
      }
      
      // Format the response to match our expected structure
      const preferences = {
        ...data,
        workHours: this.defaultPreferences.workHours,
        workDays: this.defaultPreferences.workDays,
        productiveHours: this.defaultPreferences.productiveHours,
        breakTimes: this.defaultPreferences.breakTimes,
        taskPreferences: this.defaultPreferences.taskPreferences,
        notifications: this.defaultPreferences.notifications
      };
      
      // Cache the result
      this.preferencesCache.set(userId, {
        timestamp: Date.now(),
        data: preferences
      });
      
      return preferences;
    } catch (error) {
      console.error('Error in createDefaultPreferences:', error);
      // Return defaults on error
      return this.defaultPreferences;
    }
  }
  
  /**
   * Update user preferences
   * @param {string} userId - The user ID
   * @param {Object} preferences - The preferences to update
   * @returns {Promise<Object>} - The updated preferences
   */
  async updateUserPreferences(userId, preferences) {
    try {
      // Format data for database
      const updateData = {
        work_hours: preferences.workHours ? JSON.stringify(preferences.workHours) : undefined,
        work_days: preferences.workDays ? JSON.stringify(preferences.workDays) : undefined,
        productive_hours: preferences.productiveHours ? JSON.stringify(preferences.productiveHours) : undefined,
        break_times: preferences.breakTimes ? JSON.stringify(preferences.breakTimes) : undefined,
        task_preferences: preferences.taskPreferences ? JSON.stringify(preferences.taskPreferences) : undefined,
        notifications: preferences.notifications ? JSON.stringify(preferences.notifications) : undefined,
        updated_at: new Date().toISOString()
      };
      
      // Remove undefined fields
      Object.keys(updateData).forEach(key => 
        updateData[key] === undefined && delete updateData[key]
      );
      
      // Update in database
      const { data, error } = await supabase
        .from('user_preferences')
        .update(updateData)
        .eq('user_id', userId)
        .select()
        .single();
        
      if (error) {
        console.error('Error updating preferences:', error);
        throw error;
      }
      
      // Get current preferences to merge with updates
      const currentPrefs = await this.getUserPreferences(userId);
      
      // Merge updated preferences
      const updatedPreferences = {
        ...currentPrefs,
        ...preferences
      };
      
      // Update cache
      this.preferencesCache.set(userId, {
        timestamp: Date.now(),
        data: updatedPreferences
      });
      
      return updatedPreferences;
    } catch (error) {
      console.error('Error in updateUserPreferences:', error);
      throw error;
    }
  }
  
  /**
   * Check if a time is within user's work hours
   * @param {Date} date - The date to check
   * @param {Object} preferences - User preferences
   * @returns {boolean} - Whether the time is within work hours
   */
  isWithinWorkHours(date, preferences) {
    const day = date.getDay();
    
    // Check if it's a work day
    if (!preferences.workDays.includes(day)) {
      return false;
    }
    
    // Parse work hours
    const [startHour, startMinute] = preferences.workHours.start.split(':').map(Number);
    const [endHour, endMinute] = preferences.workHours.end.split(':').map(Number);
    
    // Create Date objects for start and end times on the same day
    const workStart = new Date(date);
    workStart.setHours(startHour, startMinute, 0, 0);
    
    const workEnd = new Date(date);
    workEnd.setHours(endHour, endMinute, 0, 0);
    
    // Check if time is within work hours
    return date >= workStart && date <= workEnd;
  }
  
  /**
   * Check if a time is within user's break times
   * @param {Date} date - The date to check
   * @param {Object} preferences - User preferences
   * @returns {boolean} - Whether the time is within a break
   */
  isWithinBreakTime(date, preferences) {
    // Check each break time
    for (const breakTime of preferences.breakTimes) {
      // Parse break times
      const [startHour, startMinute] = breakTime.start.split(':').map(Number);
      const [endHour, endMinute] = breakTime.end.split(':').map(Number);
      
      // Create Date objects for break start and end on the same day
      const breakStart = new Date(date);
      breakStart.setHours(startHour, startMinute, 0, 0);
      
      const breakEnd = new Date(date);
      breakEnd.setHours(endHour, endMinute, 0, 0);
      
      // Check if time is within this break
      if (date >= breakStart && date <= breakEnd) {
        return true;
      }
    }
    
    return false;
  }
  
  /**
   * Check if a time is within user's productive hours
   * @param {Date} date - The date to check
   * @param {Object} preferences - User preferences
   * @returns {boolean} - Whether the time is within productive hours
   */
  isWithinProductiveHours(date, preferences) {
    // Parse productive hours
    const [startHour, startMinute] = preferences.productiveHours.start.split(':').map(Number);
    const [endHour, endMinute] = preferences.productiveHours.end.split(':').map(Number);
    
    // Create Date objects for productive start and end on the same day
    const productiveStart = new Date(date);
    productiveStart.setHours(startHour, startMinute, 0, 0);
    
    const productiveEnd = new Date(date);
    productiveEnd.setHours(endHour, endMinute, 0, 0);
    
    // Check if time is within productive hours
    return date >= productiveStart && date <= productiveEnd;
  }
  
  /**
   * Calculate productivity score for a given time based on user preferences
   * @param {Date} date - The date to check
   * @param {Object} preferences - User preferences
   * @returns {number} - Productivity score (0-10)
   */
  calculateProductivityScore(date, preferences) {
    // Base score
    let score = 5;
    
    // Not a work day or outside work hours
    if (!this.isWithinWorkHours(date, preferences)) {
      return 0;
    }
    
    // Within break time
    if (this.isWithinBreakTime(date, preferences)) {
      return 2;
    }
    
    // Within productive hours
    if (this.isWithinProductiveHours(date, preferences)) {
      score += 3;
    }
    
    return Math.min(score, 10);
  }
}

/**
 * Factory function to create a new UserPreferencesService
 * @param {Object} metricsService - The metrics service for logging and tracking
 * @returns {UserPreferencesService} - A new UserPreferencesService instance
 */
export function createUserPreferencesService(metricsService) {
  return new UserPreferencesService(metricsService);
}

// For backward compatibility - will be deprecated
const userPreferencesService = new UserPreferencesService();
export default userPreferencesService; 