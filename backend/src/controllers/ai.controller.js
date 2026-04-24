const aiService = require("../services/ai.service");

/**
 * AI Chat controller (Standard JSON Response)
 */
const chat = async (req, res) => {
  const requestId = Date.now();
  console.log(`[AI Controller][${requestId}] Received chat request (Non-Streaming)`);
  
  try {
    const { messages } = req.body;
    const user = req.user; // Full user object from protect middleware

    console.log(`[AI Controller][${requestId}] Messages count:`, messages?.length);
    if (messages && messages.length > 0) {
      console.log(`[AI Controller][${requestId}] Last message:`, messages[messages.length - 1].content);
    }

    if (!messages || !Array.isArray(messages)) {
      console.error(`[AI Controller][${requestId}] Invalid messages format`);
      return res.status(400).json({
        success: false,
        message: "Messages array is required.",
      });
    }

    console.log(`[AI Controller][${requestId}] Calling aiService.chat...`);
    const text = await aiService.chat(messages, user);
    
    console.log(`[AI Controller][${requestId}] Response received from AI service. Length:`, text?.length);
    
    if (!text) {
      console.warn(`[AI Controller][${requestId}] AI service returned empty text.`);
    }

    return res.status(200).json({
      success: true,
      content: text || "عذراً، لم أتمكن من توليد رد حالياً. حاول مرة أخرى."
    });

  } catch (error) {
    console.error(`[AI Controller][${requestId}] Error:`, error.message);
    console.error(error.stack);
    
    return res.status(500).json({
      success: false,
      message: error.message || "An error occurred during AI processing.",
    });
  }
};

module.exports = {
  chat,
};
