/**
 * Service Initialization
 * 
 * This module registers all services with the service registry.
 * It defines the dependencies between services and ensures they're
 * initialized in the correct order.
 */

import registry from './serviceRegistry';

// Import service factory functions
import { createMetricsService } from './metrics';
import { createUserPreferencesService } from './userPreferences';
import { createTaskRankingService } from './taskRanking';
import { createScheduleService } from './scheduleService';
import { createTodoHandler } from './todoHandler';
import { createConversationHandler } from './conversationHandler';
import { createAiUtils } from './aiUtils';
import { createGeminiService } from './gemini';

// Register services with their dependencies
export function initializeServices() {
  // Register services in dependency order
  
  // Services with no dependencies
  registry.register('metrics', createMetricsService, []);
  registry.register('aiUtils', createAiUtils, []);
  
  // Services that depend on metrics
  registry.register('userPreferences', createUserPreferencesService, ['metrics']);
  
  // Services that depend on userPreferences and metrics
  registry.register('taskRanking', createTaskRankingService, ['metrics', 'userPreferences']);
  
  // Services that depend on taskRanking
  registry.register('scheduleService', createScheduleService, ['metrics', 'userPreferences', 'taskRanking']);
  
  // Services that depend on multiple other services
  registry.register('todoHandler', createTodoHandler, ['metrics']);
  registry.register('conversationHandler', createConversationHandler, ['metrics', 'scheduleService']);
  
  // Main service that depends on all others
  registry.register('gemini', createGeminiService, [
    'metrics', 
    'aiUtils', 
    'scheduleService', 
    'todoHandler', 
    'conversationHandler'
  ]);
  
  // Initialize all services
  registry.initializeAll();
  
  return registry;
}

// Export a function to get services
export function getService(name) {
  return registry.get(name);
}

export default { initializeServices, getService }; 