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
            }
          },
          required: ["title"]
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
    // Add user's input to conversation history
    this.conversationHistory.push({ role: "user", content: input });

    const prompt = `You are a versatile AI assistant that can handle both reminder management and general conversations.
You have access to the conversation history to maintain context.

Previous conversation:
${this.conversationHistory.map(msg => `${msg.role}: ${msg.content}`).join('\n')}

Your task is to analyze the user's input and call the appropriate function:

1. If the input is about creating a reminder or scheduling something (e.g., "remind me to...", "set a reminder...", "I need to remember..."):
   - Call the createReminder function
   - Extract relevant details from the input to fill the parameters
   - Ensure the response is helpful and complete
   - Consider the context from previous messages if relevant

2. If the input is general conversation (e.g., questions, greetings, casual chat):
   - Call the chat function
   - Provide a friendly, contextual response
   - Reference previous messages when appropriate to maintain conversation flow

Available functions:

${JSON.stringify(this.functions, null, 2)}

Remember:
- Only call ONE function per response
- Format your response as a function call in this exact format:
{
  "function": "functionName",
  "parameters": {
    // function parameters here
  }
}

Current input: "${input}"`;

    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text().trim();

      console.log('API Response:', text); // Debug log

      // Remove any potential markdown formatting
      const jsonText = text.replace(/```json\n?|\n?```/g, '').trim();
      console.log('Cleaned JSON text:', jsonText); // Debug log

      const parsedResponse = JSON.parse(jsonText);

      if (!parsedResponse.function || !parsedResponse.parameters) {
        throw new Error('Invalid function call format');
      }

      if (parsedResponse.function === 'createReminder') {
        // Get the current user
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError) throw userError;

        // Build the task object
        const task = {
          title: parsedResponse.parameters.title,
          description: parsedResponse.parameters.description || '',
          schedule: parsedResponse.parameters.schedule || '',
          time: parsedResponse.parameters.time || '',
          completed: false,
          user_id: user.id // Add the user_id
        };

        // Insert the task into the database
        const { data, error } = await supabase
          .from('tasks')
          .insert([task])
          .select();

        if (error) {
          console.error("Error storing task in DB:", error);
          throw error;
        }

        console.log("Task stored in DB:", data);
        const taskResponse = {
          type: 'task',
          data: {
            ...parsedResponse.parameters,
            completed: false
          }
        };
        // Add AI's response to conversation history
        this.conversationHistory.push({ 
          role: "assistant", 
          content: `Created reminder: ${parsedResponse.parameters.title}`
        });
        return taskResponse;
      } else if (parsedResponse.function === 'chat') {
        const chatResponse = {
          type: 'conversation',
          data: {
            response: parsedResponse.parameters.response
          }
        };
        // Add AI's response to conversation history
        this.conversationHistory.push({ 
          role: "assistant", 
          content: parsedResponse.parameters.response 
        });
        return chatResponse;
      }

      throw new Error('Unknown function call');
    } catch (error) {
      console.error('Error:', error);
      throw error;
    }
  }
}

// Create a singleton instance
const geminiService = new GeminiService();

export default geminiService;
