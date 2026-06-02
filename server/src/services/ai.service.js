const axios = require('axios');

// Configure Groq Service Wrapper (OpenAI-compatible)
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions'; 
const MODEL = 'llama-3.3-70b-versatile'; 

const callGroqAPI = async (messages) => {
  try {
    const response = await axios.post(
      GROQ_API_URL,
      {
        model: MODEL,
        messages: messages,
        max_tokens: 1024,
        temperature: 0.7
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );
    return response.data;
  } catch (error) {
    console.error('Groq API Request Failed:', error.response?.data || error.message);
    throw new Error('AI Service request failed');
  }
};

/**
 * Request NLP logic parsing for standard reviews using HuggingFace Inference API
 */
exports.analyzeSentiment = async (text) => {
  try {
    const response = await axios.post(
      'https://api-inference.huggingface.co/models/cardiffnlp/twitter-roberta-base-sentiment-latest',
      { inputs: text },
      {
        headers: {
          'Authorization': `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );
    const result = response.data;

    // Evaluate result shape bounds elegantly
    if (!Array.isArray(result) || !Array.isArray(result[0])) {
      return { sentiment: 'neutral', confidence: 0, sentimentScore: 0, error: true };
    }

    const scores = result[0];
    let highest = { label: 'neutral', score: 0 };
    const rawScores = {};

    scores.forEach(s => {
      rawScores[s.label] = s.score;
      if (s.score > highest.score) {
        highest = s;
      }
    });

    const positiveScore = rawScores['positive'] || 0;
    const negativeScore = rawScores['negative'] || 0;
    const sentimentScore = positiveScore - negativeScore;

    let sentimentCategory = 'neutral';
    if (sentimentScore > 0.3) sentimentCategory = 'positive';
    else if (sentimentScore < -0.3) sentimentCategory = 'negative';

    return {
      sentiment: sentimentCategory,
      confidence: highest.score,
      sentimentScore: sentimentScore,
      rawScores
    };
  } catch (error) {
    console.error('HuggingFace AI Service Error:', error.response?.data || error.message);
    return { sentiment: 'neutral', confidence: 0, sentimentScore: 0, error: true };
  }
};

/**
 * Leverage contextual modeling mappings building Top 5 matrices using precise raw data parsing
 */
exports.getRecommendations = async (userProfile, toursList) => {
  const messages = [
    { 
      role: 'system', 
      content: 'You are an advanced travel booking recommendation engine. Your task is to analyze user preferences against a list of tours and return ONLY a strict JSON array of the top 5 most highly recommended tour IDs. Example: ["id1", "id2", "id3", "id4", "id5"]. Do not output any explanation.' 
    },
    { 
      role: 'user', 
      content: `User Profile Metadata:\n${JSON.stringify(userProfile)}\n\nAvailable Tours Catalog:\n${JSON.stringify(toursList)}` 
    }
  ];

  const response = await callGroqAPI(messages);
  const content = response.choices[0].message.content;
  return JSON.parse(content);
};

/**
 * Process intelligent conversational NLP interactions using history and real-time tour catalog
 */
exports.chatbotReply = async (message, history = [], catalogContext = '') => {
  const systemMessage = { 
    role: 'system', 
    content: `You are a helpful travel assistant for our marketplace. 
    
    STRICT DATA POLICY:
    - You must ONLY recommend or discuss tours present in the AVAILABLE CATALOG below.
    - If a user asks for a destination/tour NOT in the catalog, inform them we don't have it yet and suggest the closest match from our list.
    - Never invent tours, prices, or locations.
    - Be concise, enthusiastic, and helpful.

    AVAILABLE CATALOG (Our ONLY products):
    ${catalogContext || 'Currently no tours available.'}
    `
  };

  // Combine system prompt + history + current message
  const messages = [
    systemMessage,
    ...history.map(m => ({ role: m.role, content: m.content })),
    { role: 'user', content: message }
  ];

  const response = await callGroqAPI(messages);
  return response.choices[0].message.content;
};
