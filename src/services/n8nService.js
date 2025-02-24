const N8N_WEBHOOK_URL = 'https://prcncv.app.n8n.cloud/webhook-test/782a7da6-aea3-4448-a569-ebaab032dd86';

class N8nService {
  async createCalendarTask(taskData) {
    try {
      const response = await fetch(N8N_WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: taskData.title,
          description: taskData.description || '',
          date: taskData.schedule,
          time: taskData.time || '',
          difficulty: taskData.difficulty,
          category: taskData.category
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('Calendar task created:', result);
      return result;
    } catch (error) {
      console.error('Error creating calendar task:', error);
      throw error;
    }
  }

  async sendUserInput(text) {
    try {
      const response = await fetch(N8N_WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          message: text,
          metadata: {
            timestamp: new Date().toISOString(),
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
          }
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('Request sent to n8n:', result);
      return result;
    } catch (error) {
      console.error('Error sending request to n8n:', error);
      throw error;
    }
  }
}

export const n8nService = new N8nService(); 