import { GoogleGenerativeAI } from "@google/generative-ai";
import { createClient } from "@supabase/supabase-js";

// Initialize Supabase client using environment variables
const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

class GeminiService {
  constructor() {
    this.genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);
    this.model = this.genAI.getGenerativeModel({ model: "gemini-pro" });
    this.conversationHistory = []; // Add conversation history array

    // Define available functions
    this.functions = {
      createReminder: {
        name: "createReminder",
        description: "Creates a new reminder with the specified details",
        parameters: {
          type: "object",
          properties: {
            title: {
              type: "string",
              description: "Brief title of the reminder"
            },
            description: {
              type: "string",
              description: "Detailed description of what needs to be done"
            },
            schedule: {
              type: "string",
              description: "When the reminder should occur (e.g., 'Daily', 'Every Monday')"
            },
            time: {
              type: "string",
              description: "Time of day for the reminder"
            },
            category: {
              type: "string",
              description: "Category of the task (e.g., 'Work', 'Personal', 'Health', 'Shopping', 'Home', 'Study', 'Social', 'Other')",
              enum: ["Work", "Personal", "Health", "Shopping", "Home", "Study", "Social", "Other"]
            }
          },
          required: ["title", "category"]
        }
      },
      queryTasks: {
        name: "queryTasks",
        description: "Queries existing tasks and responds with relevant information",
        parameters: {
          type: "object",
          properties: {
            response: {
              type: "string",
              description: "Natural language response about the tasks"
            },
            filter: {
              type: "object",
              properties: {
                category: {
                  type: "string",
                  description: "Filter by category"
                },
                completed: {
                  type: "boolean",
                  description: "Filter by completion status"
                }
              }
            }
          },
          required: ["response"]
        }
      },
      chat: {
        name: "chat",
        description: "Responds to general conversation with a friendly message",
        parameters: {
          type: "object",
          properties: {
            response: {
              type: "string",
              description: "A friendly conversational response"
            }
          },
          required: ["response"]
        }
      }
    };
  }

  async createTask(input) {
    // First, check if this is a query about existing tasks
    const queryIndicators = [
      "what", "which", "show", "tell", "list", "do i have", 
      "are there", "how many", "any", "find", "search"
    ];
    
    const isTaskQuery = queryIndicators.some(indicator => 
      input.toLowerCase().includes(indicator)
    );

    if (isTaskQuery) {
      return this.handleTaskQuery(input);
    }

    this.conversationHistory.push({ role: "user", content: input });

    const prompt = `You are a versatile AI assistant that can handle both reminder management and general conversations.
You have access to the conversation history to maintain context.

Previous conversation:
${this.conversationHistory.map(msg => `${msg.role}: ${msg.content}`).join('\n')}

Your task is to analyze the user's input and call the appropriate function.
When creating a reminder, you must intelligently deduce the most appropriate category for the task.

Categories and their typical use cases:
- Work: Professional tasks, meetings, deadlines, work-related calls
- Personal: Self-care, errands, personal appointments
- Health: Exercise, medication, doctor appointments, wellness activities
- Shopping: Groceries, online orders, shopping lists
- Home: Cleaning, maintenance, repairs, household chores
- Study: Homework, research, learning activities, courses
- Social: Meetups, calls with friends, social events, birthdays
- Other: Anything that doesn't fit the above categories

Available functions:
${JSON.stringify(this.functions, null, 2)}

Remember:
- Only call ONE function per response
- Always include a category when creating a reminder
- Choose the most appropriate category based on the task context
- Format your response as a valid JSON object with 'function' and 'parameters' fields
- Do not include any additional text or markdown formatting

Example response format:
{
  "function": "createReminder",
  "parameters": {
    "title": "Example task",
    "category": "Work",
    "description": "Optional description",
    "schedule": "Optional schedule",
    "time": "Optional time"
  }
}

Current input: "${input}"`;

    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text().trim();

      console.log('Raw API Response:', text);

      // Try to extract JSON from the response if it's wrapped in markdown or has extra text
      let jsonText = text;
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        jsonText = jsonMatch[0];
      }

      console.log('Extracted JSON:', jsonText);

      let parsedResponse;
      try {
        parsedResponse = JSON.parse(jsonText);
      } catch (parseError) {
        console.error('JSON Parse Error:', parseError);
        throw new Error('Invalid response format from AI');
      }

      if (!parsedResponse.function || !parsedResponse.parameters) {
        console.error('Missing required fields:', parsedResponse);
        throw new Error('Invalid response structure: missing required fields');
      }

      if (parsedResponse.function === 'createReminder') {
        if (!parsedResponse.parameters.title || !parsedResponse.parameters.category) {
          console.error('Missing required parameters:', parsedResponse.parameters);
          throw new Error('Invalid reminder: missing required parameters');
        }

        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError) throw userError;

        const task = {
          title: parsedResponse.parameters.title,
          description: parsedResponse.parameters.description || '',
          schedule: parsedResponse.parameters.schedule || '',
          time: parsedResponse.parameters.time || '',
          category: parsedResponse.parameters.category,
          completed: false,
          user_id: user.id
        };

        const { data, error } = await supabase
          .from('tasks')
          .insert([task])
          .select();

        if (error) {
          console.error("Supabase Error:", error);
          throw error;
        }

        const taskResponse = {
          type: 'task',
          data: {
            ...task,
            id: data[0].id
          }
        };

        this.conversationHistory.push({ 
          role: "assistant", 
          content: `Created reminder: ${task.title} (Category: ${task.category})`
        });
        
        return taskResponse;
      } else if (parsedResponse.function === 'chat') {
        if (!parsedResponse.parameters.response) {
          throw new Error('Invalid chat response: missing response parameter');
        }

        const chatResponse = {
          type: 'conversation',
          data: {
            response: parsedResponse.parameters.response
          }
        };

        this.conversationHistory.push({ 
          role: "assistant", 
          content: parsedResponse.parameters.response 
        });

        return chatResponse;
      }

      throw new Error('Unknown function type: ' + parsedResponse.function);
    } catch (error) {
      console.error('Detailed Error:', error);
      // Add error to conversation history to help debug
      this.conversationHistory.push({ 
        role: "error", 
        content: error.message 
      });
      throw error;
    }
  }

  async handleTaskQuery(input) {
    this.conversationHistory.push({ role: "user", content: input });

    const prompt = `You are a helpful AI assistant that can query and provide information about the user's tasks.
Your goal is to understand the user's query and provide relevant information about their tasks.

Current tasks in the system:
${JSON.stringify(await this.fetchCurrentTasks(), null, 2)}

Previous conversation:
${this.conversationHistory.map(msg => `${msg.role}: ${msg.content}`).join('\n')}

Analyze the user's query and provide a natural, helpful response about their tasks.
Consider:
- If they're asking about specific categories
- If they're asking about completion status
- If they're asking about timing or schedules
- Provide relevant details in a conversational way

You MUST format your response as a JSON object with the following structure:
{
  "function": "queryTasks",
  "parameters": {
    "response": "Your natural language response here",
    "filter": {
      "category": "optional category filter",
      "completed": true/false (optional completion status filter)
    }
  }
}

Example response:
{
  "function": "queryTasks",
  "parameters": {
    "response": "You have 3 study tasks: 'Complete math homework' due tomorrow, 'Read chapter 5' due next week, and 'Prepare for exam' due on Friday.",
    "filter": {
      "category": "Study"
    }
  }
}

Current query: "${input}"`;

    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text().trim();

      console.log('Raw API Response:', text);

      // Extract JSON from response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No valid JSON found in response');
      }
      
      const jsonText = jsonMatch[0];
      console.log('Extracted JSON:', jsonText);

      let parsedResponse;
      try {
        parsedResponse = JSON.parse(jsonText);
      } catch (error) {
        console.error('JSON Parse Error:', error);
        throw new Error('Failed to parse response JSON');
      }

      if (!parsedResponse.function || !parsedResponse.parameters || !parsedResponse.parameters.response) {
        throw new Error('Invalid response structure: missing required fields');
      }

      if (parsedResponse.function !== 'queryTasks') {
        throw new Error('Invalid function type: expected queryTasks');
      }

      const chatResponse = {
        type: 'conversation',
        data: {
          response: parsedResponse.parameters.response
        }
      };

      this.conversationHistory.push({ 
        role: "assistant", 
        content: parsedResponse.parameters.response 
      });

      return chatResponse;
    } catch (error) {
      console.error('Task Query Error:', error);
      // Return a more user-friendly error response
      return {
        type: 'conversation',
        data: {
          response: "I apologize, but I had trouble processing your query about tasks. Could you please try asking in a different way?"
        }
      };
    }
  }

  async fetchCurrentTasks() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', user.id);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching tasks:', error);
      return [];
    }
  }
}

// Create a singleton instance
const geminiService = new GeminiService();

export default geminiService;
