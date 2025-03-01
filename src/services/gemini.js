// GeminiService.js
import { GoogleGenerativeAI } from "@google/generative-ai";
import { supabase } from '../lib/supabase';
import { env } from '../lib/env';

class GeminiService {
  constructor(metricsService, aiUtils, scheduleService, todoHandler, conversationHandler) {
    this.metricsService = metricsService;
    this.aiUtils = aiUtils;
    this.scheduleService = scheduleService;
    this.todoHandler = todoHandler;
    this.conversationHandler = conversationHandler;
    
    this.genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);
    this.model = this.genAI.getGenerativeModel({ 
      model: "gemini-2.0-flash",
      generationConfig: { temperature: 0.1, topK: 1, topP: 1, maxOutputTokens: 2048 },
    });
    this.chat = this.model.startChat({
      history: [],
      generationConfig: { temperature: 0.1, topK: 1, topP: 1, maxOutputTokens: 2048 },
    });
    this.conversationHistory = [];
    this.scheduleCache = new Map();
    this.cacheTTL = 5 * 60 * 1000; // 5 minutes

    this.metricsService.info('initialization', 'GeminiService initialized');

    // Ensure proper binding for methods used as callbacks
    this.determineRequestType = this.determineRequestType.bind(this);
    this.handleError = this.handleError.bind(this);
  }
  
  // Wrappers for helper functions
  addToHistory(role, message) {
    this.conversationHistory = this.aiUtils.addToHistory(this.conversationHistory, role, message);
  }
  
  getConversationContext() {
    return this.aiUtils.getConversationContext(this.conversationHistory);
  }
  
  // Updated determineRequestType: always returns an object with a `type` property.
  async determineRequestType(input) {
    const input_lower = input.toLowerCase();
    
    // Check for todo list creation patterns
    const todoPatterns = [
      'create a list',
      'make a list',
      'todo list',
      'to do list',
      'to-do list',
      'checklist',
      'task list',
      'shopping list',
      'list of',
      'create tasks',
      'make tasks',
      'add these tasks',
      'add these items'
    ];
    
    if (todoPatterns.some(pattern => input_lower.includes(pattern))) {
      return { type: 'todo_list', explanation: 'Contains todo list creation keywords', is_question: false };
    }
    
    // Check for reminder patterns
    if (input_lower.includes('remind') || input_lower.includes('schedule')) {
      return { type: 'reminder', explanation: 'Contains reminder keywords', is_question: false };
    }
    
    // Check for date query patterns
    if (input_lower.includes('date') || input_lower.includes('when')) {
      return { type: 'date_query', explanation: 'Contains date query', is_question: true };
    }
    
    // Fallback to conversation
    return { type: 'conversation', explanation: 'Default fallback to conversation', is_question: true };
  }
  
  handleError(error, context) {
    let response;
    switch(context) {
      case 'schedule_analysis':
        response = "I couldn't analyze your schedule right now. Please check if you have any tasks scheduled for the next week.";
        break;
      case 'schedule_query':
        response = "I couldn't find the best time to schedule this task. You might want to try again with more details about the task duration.";
        break;
      case 'conversation':
        response = "I'm sorry, I couldn't access your task information. Could you try again?";
        break;
      default:
        response = `I encountered an error: ${error.message}. Please try again.`;
    }
    
    console.error(`Error in ${context}:`, error);
    this.metricsService.error('error_handling', `Error in ${context}`, { error: error.message, context });
    
    return { type: 'conversation', data: { response } };
  }
  
  async createTask(input) {
    console.log('Processing input:', input);
    try {
      // Ensure that determineRequestType always returns a valid object.
      const requestType = (await this.determineRequestType(input)) || { type: 'conversation' };
      console.log('Determined request type:', requestType);
      
      // Defensive check
      if (!requestType || !requestType.type) {
        console.warn('Request type undefined, falling back to conversation');
        return { type: 'conversation', data: { response: "I'm not sure how to handle that. Could you try rephrasing your request?" } };
      }
      
      if (requestType.type === 'date_query') {
        return await this.conversationHandler.handleDateQuery(input, { 
          conversationHistory: this.conversationHistory, 
          chat: this.chat 
        });
      }
      if (requestType.type === 'reminder') {
        return await this.conversationHandler.handleReminder(input, { 
          conversationHistory: this.conversationHistory, 
          chat: this.chat 
        });
      }
      if (requestType.type === 'todo_list') {
        return await this.todoHandler.handleTodoList(input, { 
          conversationHistory: this.conversationHistory, 
          chat: this.chat, 
          model: this.model 
        });
      }
      if (['schedule_query', 'task_query', 'conversation'].includes(requestType.type)) {
        return await this.conversationHandler.handleConversation(input, {
          conversationHistory: this.conversationHistory,
          chat: this.chat,
          supabase,
          metricsService: this.metricsService,
          determineRequestType: this.determineRequestType,
          handleScheduleAnalysis: (inp, uid) => this.scheduleService.handleScheduleAnalysis(inp, uid, {
            conversationHistory: this.conversationHistory,
            chat: this.chat,
            scheduleCache: this.scheduleCache,
            cacheTTL: this.cacheTTL,
            model: this.model,
            handleError: this.handleError
          }),
          handleScheduleQuery: (inp, uid) => this.scheduleService.handleScheduleQuery(inp, uid, { 
            conversationHistory: this.conversationHistory, 
            chat: this.chat 
          }),
          handleError: this.handleError,
          suggestBestScheduleTime: (inp, uid) => this.scheduleService.suggestBestScheduleTime(inp, uid, {
            model: this.model,
            scheduleCache: this.scheduleCache,
            cacheTTL: this.cacheTTL,
            conversationHistory: this.conversationHistory,
            handleError: this.handleError
          })
        });
      }
      
      return { type: 'conversation', data: { response: "I'm not sure how to handle that. Could you try rephrasing your request?" } };
    } catch (error) {
      console.error('Error in createTask:', error);
      return { type: 'conversation', data: { response: `Sorry, I couldn't process your request. Error: ${error.message}` } };
    }
  }
  
  async fetchTodos() {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      const { data, error } = await supabase
        .from('todos')
        .select('*, subtasks (*)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching todos:', error);
      return [];
    }
  }
}

/**
 * Factory function to create a new GeminiService
 * @param {Object} metricsService - Metrics service
 * @param {Object} aiUtils - AI utilities
 * @param {Object} scheduleService - Schedule service
 * @param {Object} todoHandler - Todo handler
 * @param {Object} conversationHandler - Conversation handler
 * @returns {GeminiService} - A new GeminiService instance
 */
export function createGeminiService(metricsService, aiUtils, scheduleService, todoHandler, conversationHandler) {
  return new GeminiService(metricsService, aiUtils, scheduleService, todoHandler, conversationHandler);
}

// For backward compatibility - will be deprecated
// Instead of creating a new instance without dependencies, we'll export the factory function
// and let the service registry handle the instantiation
export default { createGeminiService };
