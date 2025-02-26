// todoHandler.js
import { cleanJsonResponse } from './aiUtils';
import { supabase } from '../lib/supabase';

export async function handleTodoList(input, contextObj) {
  const { conversationHistory, chat, metricsService } = contextObj;
  try {
    // Check if this is a scheduling-related request first
    if (input.toLowerCase().includes('best day') || 
        input.toLowerCase().includes('when should') ||
        input.toLowerCase().includes('best time')) {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');
      const suggestion = await contextObj.suggestBestScheduleTime(input, user.id);
      return {
        type: 'scheduling_suggestion',
        content: suggestion.suggestion,
        details: suggestion.details
      };
    }

    const context = conversationHistory.map(msg => `${msg.role}: ${msg.message}`).join('\n');
    
    // Determine type of todo list based on keywords
    const isLearningRequest = input.toLowerCase().includes('learn') || 
                              input.toLowerCase().includes('study') || 
                              input.toLowerCase().includes('teach me');
    const isShoppingList = input.toLowerCase().includes('buy') || 
                           input.toLowerCase().includes('shop') || 
                           input.toLowerCase().includes('purchase') ||
                           input.toLowerCase().includes('ingredients');
    
    let extractTodoPrompt;
    if (isLearningRequest) {
      extractTodoPrompt = `
          You are an expert educational AI assistant. Create a comprehensive, step-by-step learning path for the following request: "${input}"
          
          Format the response as a structured todo list with the following:
          1. A main todo item with a clear title describing the learning goal
          2. A series of subtasks that break down the learning process into manageable steps
          3. Each subtask should be specific, actionable, and in a logical sequence
          4. Include estimated time commitments for each subtask
          5. Add resource recommendations (books, courses, websites) as notes for relevant subtasks
          
          IMPORTANT: Return ONLY the JSON object, no markdown formatting or additional text.
          {
            "title": "Main learning goal",
            "description": "Brief overview of the learning path",
            "subtasks": [
              {
                "content": "Step 1 description",
                "notes": "Optional resource recommendations or tips"
              }
            ]
          }
        `;
    } else if (isShoppingList) {
      extractTodoPrompt = `
          Create a detailed shopping list based on this request: "${input}"
          
          If this is a recipe ingredients list:
          1. Include all necessary ingredients with quantities
          2. Group items by category (produce, dairy, pantry, etc.)
          3. Add any special notes about brands or substitutions
          
          If this is a general shopping list:
          1. Break down items into clear, specific entries
          2. Group similar items together
          3. Include any specific details mentioned (brands, sizes, etc.)
          
          IMPORTANT: Return ONLY the JSON object, no markdown formatting or additional text.
          {
            "title": "Shopping List: [Purpose]",
            "description": "List for [specific purpose/recipe]",
            "subtasks": [
              {
                "content": "Item with quantity/specifications",
                "notes": "Optional details about brands, alternatives, or where to find"
              }
            ]
          }
        `;
    } else {
      extractTodoPrompt = `
          Create a structured todo list based on this request: "${input}"
          
          Break down the request into:
          1. A clear, concise main title
          2. A brief description of the overall goal
          3. A series of specific, actionable subtasks
          4. Any relevant notes or details for each subtask
          
          Consider:
          - Order tasks logically
          - Include any mentioned deadlines or timing
          - Add helpful details as notes
          
          IMPORTANT: Return ONLY the JSON object, no markdown formatting or additional text.
          {
            "title": "Main task or goal",
            "description": "Brief overview of what needs to be done",
            "subtasks": [
              {
                "content": "Specific task description",
                "notes": "Optional timing, requirements, or helpful details"
              }
            ]
          }
        `;
    }

    console.log('Sending extract todo prompt:', extractTodoPrompt);
    const result = await chat.sendMessage(extractTodoPrompt);
    const response = await result.response;
    const rawText = response.text().trim();
    console.log('Raw response:', rawText);

    const cleanedText = cleanJsonResponse(rawText);
    console.log('Cleaned response:', cleanedText);
    
    const todoInfo = JSON.parse(cleanedText);
    console.log('Parsed todo info:', todoInfo);
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data: todo, error } = await supabase
      .from('todos')
      .insert({
        user_id: user.id,
        title: todoInfo.title,
        created_at: new Date().toISOString(),
        completed: false
      })
      .select()
      .single();

    if (error) throw new Error('Error creating todo: ' + error.message);

    if (todoInfo.subtasks && todoInfo.subtasks.length > 0) {
      const subtaskData = todoInfo.subtasks.map(subtask => ({
        todo_id: todo.id,
        content: subtask.content,
        notes: subtask.notes || null,
        completed: false,
        created_at: new Date().toISOString()
      }));

      const { error: subtaskError } = await supabase.from('subtasks').insert(subtaskData);
      if (subtaskError) throw new Error('Error creating subtasks: ' + subtaskError.message);

      const { data: todoWithSubtasks, error: fetchError } = await supabase
        .from('todos')
        .select('*, subtasks(*)')
        .eq('id', todo.id)
        .single();

      if (fetchError) throw new Error('Error fetching todo with subtasks: ' + fetchError.message);

      return {
        type: 'todo',
        data: todoWithSubtasks,
        message: isLearningRequest 
          ? "I've created a personalized learning path for you. Here's your step-by-step guide:" 
          : isShoppingList
            ? "I've created your shopping list. Here are the items you need:" 
            : "I've created your todo list. Here are the tasks:"
      };
    }

    return { type: 'todo', data: todo, message: "I've created your todo list." };
  } catch (error) {
    console.error('Error handling todo list:', error);
    throw error;
  }
}

/**
 * Factory function to create a todo handler
 * @param {Object} metricsService - The metrics service for logging and tracking
 * @returns {Object} - A new todo handler instance with all methods
 */
export function createTodoHandler(metricsService) {
  return {
    handleTodoList: (input, contextObj) => 
      handleTodoList(input, { 
        ...contextObj, 
        metricsService 
      })
  };
}

// For backward compatibility - will be deprecated
export default {
  handleTodoList
};
