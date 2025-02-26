// conversationHandler.js
import { cleanJsonResponse } from './aiUtils';
import { supabase } from '../lib/supabase';
import metricsService from './metrics';

export async function handleDateQuery(input, contextObj) {
  const { conversationHistory, chat } = contextObj;
  const context = conversationHistory.map(msg => `${msg.role}: ${msg.message}`).join('\n');
  const today = new Date();
  const currentDay = today.getDate().toString().padStart(2, '0');
  const currentMonth = (today.getMonth() + 1).toString().padStart(2, '0');
  
  const prompt = `Previous conversation:\n${context}\n\nToday is 2025-${currentMonth}-${currentDay}. Based on this reference date and the query "${input}", give me the date in YYYY-MM-DD format. Always use 2025 as the year.
Return ONLY the date in YYYY-MM-DD format, nothing else.`;

  try {
    console.log('Current date:', `2025-${currentMonth}-${currentDay}`);
    console.log('Sending date prompt:', prompt);
    const result = await chat.sendMessage(prompt);
    const response = await result.response;
    const text = response.text().trim();
    console.log('Raw LLM response:', text);
    
    const dateMatch = text.match(/\d{4}-\d{2}-\d{2}/);
    const finalResponse = dateMatch ? dateMatch[0] : text;
    console.log('Final response:', finalResponse);

    // Update conversation history
    conversationHistory.push({ role: 'user', message: input });
    conversationHistory.push({ role: 'assistant', message: finalResponse });
    
    return {
      type: 'conversation',
      data: { response: finalResponse }
    };
  } catch (error) {
    console.error('Error getting date:', error);
    return {
      type: 'conversation',
      data: { response: "Sorry, I couldn't process that date query. Please try again." }
    };
  }
}

export async function handleReminder(input, contextObj) {
  const { conversationHistory, chat } = contextObj;
  const context = conversationHistory.map(msg => `${msg.role}: ${msg.message}`).join('\n');
  
  const extractRemindersPrompt = `Previous conversation:\n${context}\n\nExtract ALL reminders from this text: "${input}"
You must respond with ONLY a JSON array of reminder objects in this exact format (no markdown, no backticks, no explanation):
[
  {
    "title": "Brief title of the reminder",
    "description": "Full description if any",
    "category": "One of: Work, Personal, Health, Shopping, Home, Study, Social, Other",
    "date_query": "The date-related part of the request",
    "time": "The time if specified (in 24-hour format HH:mm), or null if no time specified"
  }
]`;

  try {
    console.log('Sending extract reminders prompt:', extractRemindersPrompt);
    const result = await chat.sendMessage(extractRemindersPrompt);
    const response = await result.response;
    const text = response.text().trim();
    
    const cleanJson = cleanJsonResponse(text);
    console.log('Cleaned JSON text:', cleanJson);
    
    const remindersInfo = JSON.parse(cleanJson);
    console.log('Parsed reminders info:', remindersInfo);

    conversationHistory.push({ role: 'user', message: input });
    conversationHistory.push({ role: 'assistant', message: `Extracted ${remindersInfo.length} reminder(s)` });

    if (!Array.isArray(remindersInfo) || remindersInfo.length === 0) {
      throw new Error('No reminders extracted from input');
    }

    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError) throw new Error('Authentication error: ' + userError.message);
    if (!user) throw new Error('No authenticated user found');

    // Get current date for processing reminders
    const today = new Date();
    const currentDay = today.getDate().toString().padStart(2, '0');
    const currentMonth = (today.getMonth() + 1).toString().padStart(2, '0');

    const createdTasks = [];
    const errors = [];

    for (const reminderInfo of remindersInfo) {
      try {
        if (!reminderInfo.title) throw new Error('No title extracted from reminder');
        if (!reminderInfo.date_query) throw new Error('No date found in reminder');

        const datePrompt = `Previous conversation:\n${context}\n\nToday is 2025-${currentMonth}-${currentDay}. Based on this reference date and the query "${reminderInfo.date_query}", give me the date in YYYY-MM-DD format. Always use 2025 as the year.
Return ONLY the date in YYYY-MM-DD format, nothing else.`;

        const dateResult = await chat.sendMessage(datePrompt);
        const dateResponse = await dateResult.response;
        const dateText = dateResponse.text().trim();
        const dateMatch = dateText.match(/\d{4}-\d{2}-\d{2}/);
        const scheduleDate = dateMatch ? dateMatch[0] : null;

        if (!scheduleDate) throw new Error('Could not determine reminder date');

        // Validate and format time if provided
        let formattedTime = null;
        if (reminderInfo.time) {
          const timeMatch = reminderInfo.time.match(/^([0-9]{2}):([0-9]{2})$/);
          if (timeMatch) {
            const [_, hours, minutes] = timeMatch;
            if (parseInt(hours) >= 0 && parseInt(hours) < 24 && parseInt(minutes) >= 0 && parseInt(minutes) < 60) {
              formattedTime = `${hours}:${minutes}`;
            }
          }
        }

        const taskData = {
          user_id: user.id,
          title: reminderInfo.title,
          description: reminderInfo.description || '',
          category: reminderInfo.category || 'Other',
          schedule: scheduleDate,
          time: formattedTime,
          completed: false,
          created_at: new Date().toISOString()
        };

        console.log('Inserting task into Supabase:', taskData);

        const { data, error } = await supabase
          .from('tasks')
          .insert([taskData])
          .select('*')
          .single();

        if (error) throw new Error('Database error: ' + error.message);
        if (!data) throw new Error('No data returned from task creation');

        createdTasks.push(data);
      } catch (error) {
        errors.push(`Failed to create reminder "${reminderInfo.title}": ${error.message}`);
      }
    }

    if (createdTasks.length === 0) {
      throw new Error('Failed to create any reminders: ' + errors.join('; '));
    }

    console.log('Successfully created tasks:', createdTasks);
    return {
      type: 'multiple_tasks',
      data: createdTasks,
      message: `Created ${createdTasks.length} reminders successfully!`
    };
  } catch (error) {
    console.error('Error creating reminder(s):', error);
    return {
      type: 'conversation',
      data: { response: `Sorry, I couldn't create the reminder(s). Error: ${error.message}` }
    };
  }
}

export async function handleConversation(input, contextObj) {
  const { conversationHistory, chat, supabase, metricsService } = contextObj;
  const timerId = metricsService.startTimer('conversation_handling');
  
  try {
    // Assume determineRequestType is provided by the main service (or another module)
    const requestType = await contextObj.determineRequestType(input);
    metricsService.checkpoint(timerId, 'request_type_determined');
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      metricsService.error('authentication', 'User not authenticated');
      throw new Error('User not authenticated');
    }
    
    metricsService.checkpoint(timerId, 'user_authenticated');

    if (requestType.type === 'schedule_analysis') {
      metricsService.info('request_handling', 'Handling schedule analysis request');
      const result = await contextObj.handleScheduleAnalysis(input, user.id);
      metricsService.endTimer(timerId, { request_type: 'schedule_analysis' });
      return result;
    }
    
    if (requestType.type === 'schedule_query') {
      metricsService.info('request_handling', 'Handling schedule query request');
      const result = await contextObj.handleScheduleQuery(input, user.id);
      metricsService.endTimer(timerId, { request_type: 'schedule_query' });
      return result;
    }

    // Fetch tasks and todos for context
    const [tasksResult, todosResult] = await Promise.all([
      supabase.from('tasks').select('*').eq('user_id', user.id).order('schedule', { ascending: true }),
      supabase.from('todos').select('*, subtasks(*)').eq('user_id', user.id).order('created_at', { ascending: false })
    ]);
    
    metricsService.checkpoint(timerId, 'data_fetched');
    if (tasksResult.error) throw tasksResult.error;
    if (todosResult.error) throw todosResult.error;

    const taskContext = tasksResult.data?.map(task => ({
      title: task.title,
      schedule: task.schedule,
      time: task.time,
      completed: task.completed
    })) || [];

    const todoContext = todosResult.data?.map(todo => ({
      title: todo.title,
      completed: todo.completed,
      subtasks: todo.subtasks?.map(st => ({
        content: st.content,
        completed: st.completed
      }))
    })) || [];

    const context = conversationHistory.map(msg => `${msg.role}: ${msg.message}`).join('\n');
    const prompt = `Previous conversation:\n${context}\n\n
Current user tasks and todos:
Tasks: ${JSON.stringify(taskContext, null, 2)}
Todos: ${JSON.stringify(todoContext, null, 2)}

Based on the above context, respond naturally to this user input: "${input}"

If the user is asking about their tasks or todos:
1. Reference specific tasks/todos in your response
2. Provide status updates (completed/pending)
3. Include relevant deadlines or schedules
4. Suggest next actions if appropriate

Keep the response conversational and helpful. If it's a question about tasks, provide specific details from the context.`;

    metricsService.info('ai_request', 'Sending conversation prompt', { 
      prompt_length: prompt.length,
      task_count: taskContext.length,
      todo_count: todoContext.length
    });
    
    const aiTimerId = metricsService.startTimer('ai_conversation');
    const result = await chat.sendMessage(prompt);
    const response = await result.response;
    const text = response.text().trim();
    metricsService.endTimer(aiTimerId);
    metricsService.trackAICall('conversation');
    
    metricsService.checkpoint(timerId, 'ai_response_received');
    conversationHistory.push({ role: 'user', message: input });
    conversationHistory.push({ role: 'assistant', message: text });
    
    metricsService.endTimer(timerId, { request_type: 'conversation', response_length: text.length });
    return { type: 'conversation', data: { response: text } };
  } catch (error) {
    console.error('Error in conversation:', error);
    metricsService.error('conversation', 'Error in conversation handling', { error: error.message });
    metricsService.endTimer(timerId, { error: error.message });
    return contextObj.handleError(error, 'conversation');
  }
}

/**
 * Factory function to create a conversation handler
 * @param {Object} metricsService - The metrics service for logging and tracking
 * @param {Object} scheduleService - The schedule service for handling schedule-related operations
 * @returns {Object} - A new conversation handler instance with all methods
 */
export function createConversationHandler(metricsService, scheduleService) {
  return {
    handleDateQuery,
    handleReminder,
    handleConversation: (input, contextObj) => 
      handleConversation(input, { 
        ...contextObj, 
        metricsService,
        handleScheduleAnalysis: scheduleService.handleScheduleAnalysis,
        handleScheduleQuery: scheduleService.handleScheduleQuery
      })
  };
}

// For backward compatibility - will be deprecated
export default {
  handleDateQuery,
  handleReminder,
  handleConversation
};
