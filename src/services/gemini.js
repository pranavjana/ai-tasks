import { GoogleGenerativeAI } from "@google/generative-ai";
import { createClient } from "@supabase/supabase-js";

// Initialize Supabase client
const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

class GeminiService {
  constructor() {
    this.genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);
    this.model = this.genAI.getGenerativeModel({ 
      model: "gemini-2.0-flash",
      generationConfig: {
        temperature: 0.1,
        topK: 1,
        topP: 1,
        maxOutputTokens: 2048,
      },
    });
  }

  async determineRequestType(input) {
    console.log('🔍 Determining request type for input:', input);

    const typePrompt = `Analyze this input: "${input}"
You must respond with ONLY a JSON object in this exact format (no markdown, no backticks, no explanation):
{
  "type": "date_query" or "reminder" or "conversation" or "todo_list",
  "explanation": "Brief explanation of why this type was chosen",
  "is_question": true or false
}

Examples:
- "how are you" -> {"type": "conversation", "explanation": "This is a general conversational question", "is_question": true}
- "remind me to buy milk" -> {"type": "reminder", "explanation": "User wants to create a reminder", "is_question": false}
- "what's next Friday's date" -> {"type": "date_query", "explanation": "User is asking about a specific date", "is_question": true}
- "create a todo list for my project" -> {"type": "todo_list", "explanation": "User wants to create a todo list", "is_question": false}
- "add a list of tasks for tomorrow" -> {"type": "todo_list", "explanation": "User wants to create a list of tasks", "is_question": false}`;

    console.log('📝 Sending type determination prompt:', typePrompt);

    try {
      const result = await this.model.generateContent(typePrompt);
      const response = await result.response;
      const text = response.text().trim();
      console.log('📄 Raw LLM response:', text);

      // Clean up the response to ensure it's valid JSON
      const cleanJson = text.replace(/```json\n?|\n?```/g, '').trim();
      console.log('🧹 Cleaned JSON:', cleanJson);

      const typeInfo = JSON.parse(cleanJson);
      console.log('✨ Parsed type info:', typeInfo);
      return typeInfo;
    } catch (error) {
      console.error('❌ Error determining request type:', error);
      return { 
        type: 'conversation', 
        explanation: 'Failed to determine request type: ' + error.message,
        is_question: false
      };
    }
  }

  async handleDateQuery(input) {
    const today = new Date();
    const currentDay = today.getDate().toString().padStart(2, '0');
    const currentMonth = (today.getMonth() + 1).toString().padStart(2, '0');
    
    const prompt = `Today is 2025-${currentMonth}-${currentDay}. Based on this reference date and the query "${input}", give me the date in YYYY-MM-DD format. Always use 2025 as the year.
Return ONLY the date in YYYY-MM-DD format, nothing else.`;

    try {
      console.log('Current date:', `2025-${currentMonth}-${currentDay}`);
      console.log('Sending date prompt:', prompt);
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text().trim();
      console.log('Raw LLM response:', text);
      
      const dateMatch = text.match(/\d{4}-\d{2}-\d{2}/);
      const finalResponse = dateMatch ? dateMatch[0] : text;
      console.log('Final response:', finalResponse);
      
      return {
        type: 'conversation',
        data: { response: finalResponse }
      };
    } catch (error) {
      console.error('Error getting date:', error);
      return {
        type: 'conversation',
        data: {
          response: "Sorry, I couldn't process that date query. Please try again."
        }
      };
    }
  }

  async handleReminder(input) {
    // First, let's extract all reminders from the input
    const extractRemindersPrompt = `Extract ALL reminders from this text: "${input}"
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
      // Get all reminders info from Gemini
      console.log('Sending extract reminders prompt:', extractRemindersPrompt);
      const result = await this.model.generateContent(extractRemindersPrompt);
      const response = await result.response;
      const text = response.text().trim();
      
      const cleanJson = text.replace(/```json\n?|\n?```/g, '').trim();
      console.log('Cleaned JSON text:', cleanJson);
      
      const remindersInfo = JSON.parse(cleanJson);
      console.log('Parsed reminders info:', remindersInfo);

      if (!Array.isArray(remindersInfo) || remindersInfo.length === 0) {
        throw new Error('No reminders extracted from input');
      }

      // Get user once for all reminders
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw new Error('Authentication error: ' + userError.message);
      if (!user) throw new Error('No authenticated user found');

      // Get current date for date calculations
      const today = new Date();
      const currentDay = today.getDate().toString().padStart(2, '0');
      const currentMonth = (today.getMonth() + 1).toString().padStart(2, '0');

      // Process each reminder
      const createdTasks = [];
      const errors = [];

      for (const reminderInfo of remindersInfo) {
        try {
          // Validate reminder info
          if (!reminderInfo.title) throw new Error('No title extracted from reminder');
          if (!reminderInfo.date_query) throw new Error('No date found in reminder');

          // Get the actual date
          const dateResult = await this.model.generateContent(
            `Today is 2025-${currentMonth}-${currentDay}. Based on this reference date and the query "${reminderInfo.date_query}", give me the date in YYYY-MM-DD format. Always use 2025 as the year.
Return ONLY the date in YYYY-MM-DD format, nothing else.`
          );
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
              if (parseInt(hours) >= 0 && parseInt(hours) < 24 && 
                  parseInt(minutes) >= 0 && parseInt(minutes) < 60) {
                formattedTime = `${hours}:${minutes}`;
              }
            }
          }

          // Prepare the task data
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

          // Insert into Supabase
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

      // Return all created tasks
      return {
        type: 'multiple_tasks',
        data: createdTasks,
        message: `Created ${createdTasks.length} reminders successfully!`
      };
    } catch (error) {
      console.error('Error creating reminder(s):', error);
      return {
        type: 'conversation',
        data: {
          response: `Sorry, I couldn't create the reminder(s). Error: ${error.message}`
        }
      };
    }
  }

  async handleConversation(input) {
    const prompt = `Respond naturally to this user input: "${input}"
Keep the response brief and friendly. If it's a question, provide a helpful answer.`;

    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text().trim();
      
      return {
        type: 'conversation',
        data: { response: text }
      };
    } catch (error) {
      console.error('Error in conversation:', error);
      return {
        type: 'conversation',
        data: { response: "I'm sorry, I didn't understand that. Could you rephrase?" }
      };
    }
  }

  async handleTodoList(input) {
    const extractTodoPrompt = `Extract todo list information from this text: "${input}"
You must respond with ONLY a JSON object in this exact format (no markdown, no backticks, no explanation):
{
  "title": "Main title for the todo list",
  "date_query": "The date-related part of the request, if any",
  "subtasks": [
    {
      "content": "Description of the subtask"
    }
  ]
}`;

    try {
      // Get todo list info from Gemini
      console.log('Sending extract todo prompt:', extractTodoPrompt);
      const result = await this.model.generateContent(extractTodoPrompt);
      const response = await result.response;
      const text = response.text().trim();
      
      const cleanJson = text.replace(/```json\n?|\n?```/g, '').trim();
      console.log('Cleaned JSON text:', cleanJson);
      
      const todoInfo = JSON.parse(cleanJson);
      console.log('Parsed todo info:', todoInfo);

      // Get user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw new Error('Authentication error: ' + userError.message);
      if (!user) throw new Error('No authenticated user found');

      // Get the due date if specified
      let dueDate = null;
      if (todoInfo.date_query) {
        const today = new Date();
        const currentDay = today.getDate().toString().padStart(2, '0');
        const currentMonth = (today.getMonth() + 1).toString().padStart(2, '0');
        
        const dateResult = await this.model.generateContent(
          `Today is 2025-${currentMonth}-${currentDay}. Based on this reference date and the query "${todoInfo.date_query}", give me the date in YYYY-MM-DD format. Always use 2025 as the year.
Return ONLY the date in YYYY-MM-DD format, nothing else.`
        );
        const dateResponse = await dateResult.response;
        const dateText = dateResponse.text().trim();
        const dateMatch = dateText.match(/\d{4}-\d{2}-\d{2}/);
        dueDate = dateMatch ? dateMatch[0] : null;
      }

      // Create the todo
      const todoData = {
        user_id: user.id,
        title: todoInfo.title,
        completed: false,
        created_at: new Date().toISOString(),
        due_date: dueDate
      };

      // Insert todo into Supabase
      const { data: todo, error: todoError } = await supabase
        .from('todos')
        .insert([todoData])
        .select('*')
        .single();

      if (todoError) throw new Error('Error creating todo: ' + todoError.message);

      // Create subtasks if any
      if (todoInfo.subtasks && todoInfo.subtasks.length > 0) {
        const subtaskData = todoInfo.subtasks.map(subtask => ({
          todo_id: todo.id,
          content: subtask.content,
          completed: false,
          created_at: new Date().toISOString()
        }));

        const { error: subtaskError } = await supabase
          .from('subtasks')
          .insert(subtaskData);

        if (subtaskError) throw new Error('Error creating subtasks: ' + subtaskError.message);

        // Fetch the complete todo with subtasks
        const { data: todoWithSubtasks, error: fetchError } = await supabase
          .from('todos')
          .select('*, subtasks(*)')
          .eq('id', todo.id)
          .single();

        if (fetchError) throw new Error('Error fetching todo with subtasks: ' + fetchError.message);

        return {
          type: 'todo',
          data: todoWithSubtasks
        };
      }

      return {
        type: 'todo',
        data: todo
      };
    } catch (error) {
      console.error('Error creating todo list:', error);
      return {
        type: 'conversation',
        data: {
          response: `Sorry, I couldn't create the todo list. Error: ${error.message}`
        }
      };
    }
  }

  async createTask(input) {
    console.log('Processing input:', input);

    try {
      // First determine what type of request this is
      const requestType = await this.determineRequestType(input);
      console.log('Determined request type:', requestType);

      switch (requestType.type) {
        case 'date_query':
          return await this.handleDateQuery(input);
        
        case 'reminder':
          return await this.handleReminder(input);
        
        case 'todo_list':
          return await this.handleTodoList(input);
        
        case 'conversation':
          return await this.handleConversation(input);
        
        default:
          return {
            type: 'conversation',
            data: { 
              response: "I'm not sure how to handle that. Could you try rephrasing your request?" 
            }
          };
      }
    } catch (error) {
      console.error('Error in createTask:', error);
      return {
        type: 'conversation',
        data: {
          response: `Sorry, I couldn't process your request. Error: ${error.message}`
        }
      };
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

// Create a singleton instance
const geminiService = new GeminiService();

export default geminiService;