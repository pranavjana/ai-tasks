import { GoogleGenerativeAI } from "@google/generative-ai";

class GeminiService {
  constructor() {
    this.genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);
    this.model = this.genAI.getGenerativeModel({ model: "gemini-pro" });
  }

  async createTask(input) {
    const prompt = `You are an assistant that handles two types of requests: task creation and general conversation.
    
    Step 1: Classify the user’s input.
    - If the input contains phrases like "Task request:" or "create a task", or any other format that asks you to create an event or such, treat it as a task creation request.
    - Otherwise, treat it as a general conversation request.

    Step 2:
    If classified as Task creation request:
      Requirements:
      1. The output must be valid JSON (no extra text, code blocks, or markdown).
      2. The JSON must have exactly these fields:
        {
          "title": "Brief task title",
          "description": "Detailed task description",
          "schedule": "When the task should occur (e.g., 'Daily', 'Every Monday', etc.)",
          "time": "Time of day if specified",
          "completed": false
        }
      3. The "completed" field must always be false.
      4. If any field is missing from the user input, fill it with an empty string.
      5. If the user does not provide a separate title, you may use a short summary of their request.
      6. Output nothing except the JSON object.
      
      Example Input:
      "Pick up groceries every Monday at 5 pm"

      Example Output:
      {
        "title": "Pick up groceries",
        "description": "Pick up groceries every Monday at 5 pm",
        "schedule": "Every Monday",
        "time": "5 pm",
        "completed": false
      }

      Example Input:
      "Walk the dog"

      Example Output:
      {
        "title": "Walk the dog",
        "description": "Walk the dog",
        "schedule": "",
        "time": "",
        "completed": false
      }
    
    If classified as general conversation:
    Converse as though you are a normal person talking to the user. Gather and provide any info asked.

    Task Request: "${input}"
`;

    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text().trim();
      
      console.log('API Response:', text); // Debug log

      // Remove any potential markdown formatting
      const jsonText = text.replace(/```json\n?|\n?```/g, '').trim();
      console.log('Cleaned JSON text:', jsonText); // Debug log
      
      const taskJson = JSON.parse(jsonText);

      // if (!taskJson.title || !taskJson.description) {
      //   throw new Error('Invalid task format');
      // }

      return taskJson;
    } catch (error) {
      console.error('Gemini API Error:', error);
      throw error;
    }
  }
}

// Create a singleton instance
const geminiService = new GeminiService();

export default geminiService; 