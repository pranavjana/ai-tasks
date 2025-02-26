/**
 * Metrics and Logging Service
 * 
 * This service provides centralized logging and performance tracking
 * for the task scheduling system.
 */

class MetricsService {
  constructor() {
    this.metrics = {
      aiCalls: {
        total: 0,
        classification: 0,
        taskAnalysis: 0,
        responseGeneration: 0,
        errors: 0
      },
      scheduling: {
        total: 0,
        successful: 0,
        fallbacks: 0,
        errors: 0,
        averageDuration: 0
      },
      userPreferences: {
        fetches: 0,
        updates: 0,
        errors: 0
      },
      cacheHits: {
        scheduleCache: 0,
        preferencesCache: 0
      }
    };
    
    this.logs = [];
    this.maxLogs = 1000;
    
    // Performance tracking
    this.timers = new Map();
  }
  
  /**
   * Log an event with optional metadata
   * @param {string} level - Log level (info, warn, error)
   * @param {string} category - Category of the log
   * @param {string} message - Log message
   * @param {Object} metadata - Additional data
   */
  log(level, category, message, metadata = {}) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      category,
      message,
      metadata
    };
    
    // Add to logs array, maintaining max size
    this.logs.push(logEntry);
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }
    
    // Also log to console
    const consoleMethod = level === 'error' ? console.error : 
                          level === 'warn' ? console.warn : 
                          console.log;
    
    consoleMethod(`[${timestamp}] [${level.toUpperCase()}] [${category}] ${message}`, 
      Object.keys(metadata).length > 0 ? metadata : '');
    
    return logEntry;
  }
  
  /**
   * Log an info event
   * @param {string} category - Category of the log
   * @param {string} message - Log message
   * @param {Object} metadata - Additional data
   */
  info(category, message, metadata = {}) {
    return this.log('info', category, message, metadata);
  }
  
  /**
   * Log a warning event
   * @param {string} category - Category of the log
   * @param {string} message - Log message
   * @param {Object} metadata - Additional data
   */
  warn(category, message, metadata = {}) {
    return this.log('warn', category, message, metadata);
  }
  
  /**
   * Log an error event
   * @param {string} category - Category of the log
   * @param {string} message - Log message
   * @param {Object} metadata - Additional data
   */
  error(category, message, metadata = {}) {
    return this.log('error', category, message, metadata);
  }
  
  /**
   * Start a timer for performance tracking
   * @param {string} name - Timer name
   * @returns {string} - Timer ID
   */
  startTimer(name) {
    const id = `${name}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.timers.set(id, {
      name,
      startTime: Date.now(),
      checkpoints: []
    });
    return id;
  }
  
  /**
   * Add a checkpoint to a running timer
   * @param {string} timerId - Timer ID
   * @param {string} checkpointName - Checkpoint name
   */
  checkpoint(timerId, checkpointName) {
    const timer = this.timers.get(timerId);
    if (!timer) return;
    
    timer.checkpoints.push({
      name: checkpointName,
      time: Date.now(),
      elapsed: Date.now() - timer.startTime
    });
  }
  
  /**
   * End a timer and log the performance
   * @param {string} timerId - Timer ID
   * @param {Object} metadata - Additional data
   * @returns {Object} - Timer results
   */
  endTimer(timerId, metadata = {}) {
    const timer = this.timers.get(timerId);
    if (!timer) return null;
    
    const endTime = Date.now();
    const duration = endTime - timer.startTime;
    
    const result = {
      name: timer.name,
      duration,
      startTime: timer.startTime,
      endTime,
      checkpoints: timer.checkpoints,
      metadata
    };
    
    this.info('performance', `${timer.name} completed in ${duration}ms`, {
      duration,
      checkpoints: timer.checkpoints,
      ...metadata
    });
    
    this.timers.delete(timerId);
    
    // Update metrics based on timer name
    if (timer.name.startsWith('ai_')) {
      this.metrics.aiCalls.total++;
      if (timer.name === 'ai_classification') this.metrics.aiCalls.classification++;
      if (timer.name === 'ai_task_analysis') this.metrics.aiCalls.taskAnalysis++;
      if (timer.name === 'ai_response_generation') this.metrics.aiCalls.responseGeneration++;
    }
    
    if (timer.name.startsWith('scheduling_')) {
      this.metrics.scheduling.total++;
      if (timer.name === 'scheduling_successful') this.metrics.scheduling.successful++;
      if (timer.name === 'scheduling_fallback') this.metrics.scheduling.fallbacks++;
      
      // Update average duration
      const currentTotal = this.metrics.scheduling.averageDuration * (this.metrics.scheduling.total - 1);
      this.metrics.scheduling.averageDuration = (currentTotal + duration) / this.metrics.scheduling.total;
    }
    
    return result;
  }
  
  /**
   * Track an AI call
   * @param {string} type - Type of AI call
   */
  trackAICall(type) {
    this.metrics.aiCalls.total++;
    if (this.metrics.aiCalls[type] !== undefined) {
      this.metrics.aiCalls[type]++;
    }
  }
  
  /**
   * Track an AI error
   */
  trackAIError() {
    this.metrics.aiCalls.errors++;
  }
  
  /**
   * Track a scheduling operation
   * @param {string} result - Result of scheduling (success, fallback, error)
   * @param {number} duration - Duration in ms
   */
  trackScheduling(result, duration) {
    this.metrics.scheduling.total++;
    
    if (result === 'success') {
      this.metrics.scheduling.successful++;
    } else if (result === 'fallback') {
      this.metrics.scheduling.fallbacks++;
    } else if (result === 'error') {
      this.metrics.scheduling.errors++;
    }
    
    // Update average duration
    const currentTotal = this.metrics.scheduling.averageDuration * (this.metrics.scheduling.total - 1);
    this.metrics.scheduling.averageDuration = (currentTotal + duration) / this.metrics.scheduling.total;
  }
  
  /**
   * Track a cache hit
   * @param {string} cacheType - Type of cache
   */
  trackCacheHit(cacheType) {
    if (this.metrics.cacheHits[cacheType] !== undefined) {
      this.metrics.cacheHits[cacheType]++;
    }
  }
  
  /**
   * Get current metrics
   * @returns {Object} - Current metrics
   */
  getMetrics() {
    return { ...this.metrics };
  }
  
  /**
   * Get recent logs
   * @param {number} count - Number of logs to return
   * @param {string} level - Filter by log level
   * @param {string} category - Filter by category
   * @returns {Array} - Recent logs
   */
  getRecentLogs(count = 100, level = null, category = null) {
    let filteredLogs = [...this.logs];
    
    if (level) {
      filteredLogs = filteredLogs.filter(log => log.level === level);
    }
    
    if (category) {
      filteredLogs = filteredLogs.filter(log => log.category === category);
    }
    
    return filteredLogs.slice(-count).reverse();
  }
}

/**
 * Factory function to create a new MetricsService instance
 * @returns {MetricsService} - A new MetricsService instance
 */
export function createMetricsService() {
  return new MetricsService();
}

// For backward compatibility - will be deprecated
const metricsService = new MetricsService();
export default metricsService; 