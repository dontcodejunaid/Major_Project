/**
 * Gemini AI Service Utility
 * Supports Google Gemini API calls with robust fallbacks.
 */

const getGeminiApiKey = () => {
  return process.env.GEMINI_API_KEY || '';
};

/**
 * Call Gemini API with a system instruction and user prompt
 * @param {string} prompt 
 * @param {string} systemInstruction 
 * @returns {Promise<string>}
 */
async function callGemini(prompt, systemInstruction = '') {
  const apiKey = getGeminiApiKey();
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured in backend environment');
  }

  // Model list to try in order of preference
  const models = ['gemini-2.5-flash', 'gemini-1.5-flash', 'gemini-pro'];

  for (const model of models) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      
      const contents = [];
      if (systemInstruction) {
        contents.push({
          role: 'user',
          parts: [{ text: `SYSTEM INSTRUCTION: ${systemInstruction}\n\nUSER REQUEST: ${prompt}` }]
        });
      } else {
        contents.push({
          role: 'user',
          parts: [{ text: prompt }]
        });
      }

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents,
          generationConfig: {
            temperature: 0.2,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 2048,
          }
        })
      });

      if (!response.ok) {
        const errText = await response.text();
        console.warn(`Gemini API call to ${model} failed (${response.status}): ${errText}`);
        continue; // try next model
      }

      const result = await response.json();
      const textOutput = result?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (textOutput) {
        return textOutput;
      }
    } catch (err) {
      console.warn(`Error contacting Gemini model ${model}:`, err.message);
    }
  }

  throw new Error('Gemini API was unable to generate a response across available models.');
}

/**
 * Generate JSON response from Gemini
 */
async function callGeminiJson(prompt, systemInstruction = '') {
  const enhancedInstruction = `${systemInstruction}\n\nIMPORTANT: You must respond ONLY with a valid, parseable JSON object or array. Do NOT wrap with markdown backticks (e.g. no \`\`\`json). Just the raw JSON.`;
  const rawText = await callGemini(prompt, enhancedInstruction);
  
  try {
    // Strip possible markdown ticks if Gemini included them
    const cleaned = rawText.replace(/```json/gi, '').replace(/```/g, '').trim();
    return JSON.parse(cleaned);
  } catch (e) {
    console.error('Failed to parse Gemini output as JSON:', rawText);
    throw new Error('Invalid JSON format received from AI model');
  }
}

module.exports = {
  callGemini,
  callGeminiJson
};
