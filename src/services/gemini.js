import { GoogleGenerativeAI } from "@google/generative-ai";

class GeminiService {
  constructor() {
    this.genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);
    this.model = this.genAI.getGenerativeModel({ model: "gemini-pro" });
    
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
    const prompt = `You are a versatile AI assistant that can handle both reminder management and general conversations.

Your task is to analyze the user's input and call the appropriate function:

1. If the input is about creating a reminder or scheduling something (e.g., "remind me to...", "set a reminder...", "I need to remember..."):
   - Call the createReminder function
   - Extract relevant details from the input to fill the parameters
   - Ensure the response is helpful and complete

2. If the input is general conversation (e.g., questions, greetings, casual chat):
   - Call the chat function
   - Provide a friendly, contextual response

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

Examples:

User: "Remind me to walk the dog every morning at 7am"
Response:
{
  "function": "createReminder",
  "parameters": {
    "title": "Walk the dog",
    "description": "Daily morning dog walk",
    "schedule": "Daily",
    "time": "7am"
  }
}

User: "How are you doing today?"
Response:
{
  "function": "chat",
  "parameters": {
    "response": "I'm doing well, thank you for asking! I'm here to help you manage your reminders and chat with you. How can I assist you today?"
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

      // Validate response structure
      if (!parsedResponse.function || !parsedResponse.parameters) {
        throw new Error('Invalid function call format');
      }

      // Map function calls to our response format
      if (parsedResponse.function === 'createReminder') {
        return {
          type: 'task',
          data: {
            ...parsedResponse.parameters,
            completed: false
          }
        };
      } else if (parsedResponse.function === 'chat') {
        return {
          type: 'conversation',
          data: {
            response: parsedResponse.parameters.response
          }
        };
      }

      throw new Error('Unknown function call');
    } catch (error) {
      console.error('Gemini API Error:', error);
      throw error;
    }
  }

  // You can add more methods here for other capabilities
  // For example:
  // async updateReminder(id, updates) { ... }
  // async deleteReminder(id) { ... }
  // async markReminderComplete(id) { ... }
}

// Create a singleton instance
const geminiService = new GeminiService();

export default geminiService; 