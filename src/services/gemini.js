import { GoogleGenerativeAI } from "@google/generative-ai";

class GeminiService {
  constructor() {
    this.genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);
    this.model = this.genAI.getGenerativeModel({ model: "gemini-pro" });
  }

  async createTask(input) {
    const prompt = `You are a task creation assistant. Convert this task request into a valid JSON object.
    Format the response as a JSON object with this exact structure:
    {
      "title": "Brief task title",
      "description": "Detailed task description",
      "schedule": "When the task should occur (e.g., 'Daily', 'Every Monday', etc.)",
      "time": "Time of day if specified",
      "completed": false
    }

    Task request: "${input}"
    
    Ensure the response is a properly formatted JSON object and nothing else.`;

    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text().trim();
      
      console.log('API Response:', text); // Debug log

      // Remove any potential markdown formatting
      const jsonText = text.replace(/```json\n?|\n?```/g, '').trim();
      console.log('Cleaned JSON text:', jsonText); // Debug log
      
      const taskJson = JSON.parse(jsonText);

      if (!taskJson.title || !taskJson.description) {
        throw new Error('Invalid task format');
      }

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