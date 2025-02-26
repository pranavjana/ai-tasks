// aiUtils.js

/**
 * Add a message to the conversation history
 * @param {Array} conversationHistory - The conversation history array
 * @param {string} role - The role (user or assistant)
 * @param {string} message - The message content
 * @returns {Array} - Updated conversation history
 */
export function addToHistory(conversationHistory, role, message) {
  conversationHistory.push({ role, message });
  // Keep only the last 10 messages to avoid token limits
  if (conversationHistory.length > 10) {
    conversationHistory = conversationHistory.slice(-10);
  }
  return conversationHistory;
}

/**
 * Get a formatted string of the conversation context
 * @param {Array} conversationHistory - The conversation history array
 * @returns {string} - Formatted conversation context
 */
export function getConversationContext(conversationHistory) {
  return conversationHistory
    .map(msg => `${msg.role}: ${msg.message}`)
    .join('\n');
}

/**
 * Clean a JSON response from AI
 * @param {string} text - The raw text from AI
 * @returns {string} - Cleaned JSON string
 */
export function cleanJsonResponse(text) {
  // Remove markdown code block syntax
  let cleaned = text.replace(/```json\n?|\n?```/g, '').trim();
  
  // Find the first '{' and last '}'
  const startIndex = cleaned.indexOf('{');
  const endIndex = cleaned.lastIndexOf('}');
  
  if (startIndex !== -1 && endIndex !== -1) {
    cleaned = cleaned.slice(startIndex, endIndex + 1);
  }
  
  // Remove any extra newlines or whitespace
  cleaned = cleaned.replace(/^\s*[\r\n]/gm, '');
  
  console.log('Cleaned JSON text:', cleaned);
  return cleaned;
}

/**
 * Factory function to create aiUtils
 * @returns {Object} - AI utility functions
 */
export function createAiUtils() {
  return {
    addToHistory,
    getConversationContext,
    cleanJsonResponse
  };
}

// For backward compatibility
export default {
  addToHistory,
  getConversationContext,
  cleanJsonResponse
};
  