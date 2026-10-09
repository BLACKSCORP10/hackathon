import { GoogleGenAI } from '@google/genai';

export interface GeminiMessageContext {
  senderName?: string;
  sender?: string;
  content?: string;
  text?: string;
}

export interface GeminiOptions {
  model?: string;
  fallbackModel?: string;
  systemInstruction?: string;
  roomContext?: GeminiMessageContext[];
  history?: GeminiMessageContext[];
  mode?: 'chat' | 'summarize';
  roomName?: string;
}

/**
 * Generate AI content using Google Gen AI with fallback models and clean error handling
 */
export async function generateGeminiText(
  prompt: string,
  options: GeminiOptions = {}
): Promise<{ text: string; error?: string }> {
  const apiKey =
    process.env.GEMINI_API_KEY ||
    process.env.NEXT_PUBLIC_GEMINI_API_KEY ||
    process.env.GOOGLE_GENAI_API_KEY ||
    '';

  if (!apiKey) {
    return {
      text: 'Error fetching Gemini response.',
      error: 'GEMINI_API_KEY is not configured on the server.',
    };
  }

  const primaryModel = options.model || 'gemini-2.5-flash';
  const fallbackModel = options.fallbackModel || 'gemini-1.5-flash';

  const userQuery = (prompt || '').trim();
  const isSummarize =
    options.mode === 'summarize' ||
    userQuery.toLowerCase().includes('summarize');

  const contextList = options.roomContext || options.history || [];
  let finalPrompt = userQuery;

  if (isSummarize) {
    const formattedTranscript = contextList
      .map(
        (m) =>
          `[${m.senderName || m.sender || 'User'}]: ${m.content || m.text || ''}`
      )
      .join('\n');

    finalPrompt = `You are Gemini AI, an intelligent assistant embedded in NexusChat.
Please provide a clear, structured, and helpful summary of the following chat messages from "${options.roomName || 'Nexus Channel'}":

Chat Transcript:
${formattedTranscript || 'No recent messages in this conversation.'}

Format the response with:
1. 📌 Key Highlights
2. 🎯 Decisions & Action Items
3. 💡 Summary Conclusion`;
  }

  // 1. Primary Attempt: Official @google/genai SDK with gemini-2.5-flash
  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: primaryModel,
      contents: finalPrompt,
      config: options.systemInstruction
        ? { systemInstruction: options.systemInstruction }
        : undefined,
    });

    if (response?.text) {
      return { text: response.text };
    }
  } catch (sdkError: any) {
    console.warn(`GenAI SDK (${primaryModel}) failed, trying fallback:`, sdkError?.message);
  }

  // 2. Secondary Attempt: SDK with fallbackModel (gemini-1.5-flash)
  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: fallbackModel,
      contents: finalPrompt,
    });

    if (response?.text) {
      return { text: response.text };
    }
  } catch (fallbackSdkError: any) {
    console.warn(`GenAI SDK fallback (${fallbackModel}) failed:`, fallbackSdkError?.message);
  }

  // 3. Direct Google Generative Language REST API Fallback
  for (const targetModel of [primaryModel, fallbackModel]) {
    try {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${targetModel}:generateContent?key=${apiKey}`;
      const restRes = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: finalPrompt }] }],
        }),
      });

      if (restRes.ok) {
        const data = await restRes.json();
        const outputText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (outputText) {
          return { text: outputText };
        }
      }
    } catch (restErr: any) {
      console.warn(`REST fetch fallback (${targetModel}) failed:`, restErr?.message);
    }
  }

  // If all attempts fail, cleanly return standard readable error message
  return {
    text: 'Error fetching Gemini response.',
    error: 'All Gemini API endpoints failed.',
  };
}
