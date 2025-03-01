// conversationHandler.js
import { cleanJsonResponse } from './aiUtils';
import { supabase } from '../lib/supabase';
import metricsService from './metrics';

export async function handleDateQuery(input, contextObj) {
  const { conversationHistory = [], chat } = contextObj;
  
  const today = new Date();
  const currentDay = today.getDate().toString().padStart(2, '0');
  const currentMonth = (today.getMonth() + 1).toString().padStart(2, '0');
  const currentYear = today.getFullYear();
  
  const prompt = `Today is ${currentYear}-${currentMonth}-${currentDay}. Based on the query "${input}", what date (in YYYY-MM-DD format) is being referred to?`;

  try {
    console.log('Current date:', `${currentYear}-${currentMonth}-${currentDay}`);
    console.log('Sending date prompt:', prompt);
    
    const result = await chat.sendMessage(prompt);
    const response = await result.response;
    const text = response.text().trim();
    console.log('Raw LLM response:', text);
    
    const dateMatch = text.match(/\d{4}-\d{2}-\d{2}/);
    if (!dateMatch) {
      throw new Error('No valid date found in response');
    }
    const finalResponse = dateMatch[0];
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
  
  const extractRemindersPrompt = `Extract reminders from this text: "${input}"

Return ONLY a JSON array containing exactly one reminder object in this format (no explanation, no backticks):
[{
  "title": "Brief title of the reminder (without the date/time part)",
  "description": "Full description if any",
  "category": "One of: Work, Personal, Health, Shopping, Home, Study, Social, Other",
  "date_query": "IMPORTANT: Extract the EXACT date-related text from the input (e.g., 'tomorrow', 'next week', 'day after tmr', etc.)",
  "time": "Extract time in 24-hour format (HH:mm) if specified, or null if no time mentioned"
}]

IMPORTANT: 
1. Response MUST be a JSON array with square brackets []
2. Array MUST contain exactly one reminder object with curly braces {}
3. Title should NOT include the date/time information
4. ALWAYS extract and preserve the EXACT date-related text in date_query
5. Time should be in 24-hour format (HH:mm) or null`;

  try {
    console.log('Sending extract reminders prompt:', extractRemindersPrompt);
    const result = await chat.sendMessage(extractRemindersPrompt);
    const response = await result.response;
    const text = response.text().trim();
    
    const cleanJson = cleanJsonResponse(text);
    console.log('Cleaned JSON text:', cleanJson);
    
    let remindersInfo;
    try {
      // First try to parse the JSON
      const parsed = JSON.parse(cleanJson);
      
      // If it's an object, wrap it in an array
      if (!Array.isArray(parsed)) {
        remindersInfo = [parsed];
      } else {
        remindersInfo = parsed;
      }
      
      // Validate the structure
      if (!remindersInfo.length || !remindersInfo[0].title) {
        throw new Error('Invalid reminder structure');
      }
    } catch (parseError) {
      console.error('Failed to parse reminders JSON:', parseError);
      // Create a basic reminder from the input
      remindersInfo = [{
        title: input.replace(/\b(today|tomorrow|tmr|next|after)\b.*$/, '').trim() || input,
        description: '',
        category: 'Other',
        date_query: input.match(/\b(today|tomorrow|tmr|next|after\s+\w+)\b.*$/)?.[0] || 'today',
        time: null
      }];
    }

    console.log('Parsed reminders info:', remindersInfo);

    conversationHistory.push({ role: 'user', message: input });
    conversationHistory.push({ role: 'assistant', message: `Extracted ${remindersInfo.length} reminder(s)` });

    if (remindersInfo.length === 0) {
      throw new Error('No reminders could be extracted from input');
    }

    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError) throw new Error('Authentication error: ' + userError.message);
    if (!user) throw new Error('No authenticated user found');

    const createdTasks = [];
    const errors = [];

    for (const reminderInfo of remindersInfo) {
      try {
        // Validate required fields
        if (!reminderInfo.title) {
          reminderInfo.title = input;
        }
        if (!reminderInfo.date_query) {
          reminderInfo.date_query = 'today';
        }

        // Use handleDateQuery to get the correct date
        const dateResult = await handleDateQuery(reminderInfo.date_query, { 
          conversationHistory: [], // Empty conversation history for clean context
          chat
        });
        const scheduleDate = dateResult.data.response;
        console.log('Schedule date:', scheduleDate);

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
      message: `Created ${createdTasks.length} reminder${createdTasks.length > 1 ? 's' : ''} successfully!`
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
