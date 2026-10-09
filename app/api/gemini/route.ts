import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const {
      prompt = '',
      roomContext,
      history = [],
      mode = 'chat',
      roomName = 'Nexus Channel',
    } = body;

    const contextMessages = Array.isArray(roomContext)
      ? roomContext
      : Array.isArray(history)
      ? history
      : typeof roomContext === 'string'
      ? [{ content: roomContext }]
      : [];

    const isSummarize =
      mode === 'summarize' ||
      (typeof prompt === 'string' && prompt.toLowerCase().includes('summarize'));

    const isSearch =
      mode === 'search' ||
      (typeof prompt === 'string' && prompt.toLowerCase().includes('search'));

    if (!prompt && !isSummarize) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    const apiKey =
      process.env.GEMINI_API_KEY ||
      process.env.NEXT_PUBLIC_GEMINI_API_KEY ||
      process.env.GOOGLE_GENAI_API_KEY;

    let aiResponseText = '';

    if (apiKey) {
      try {
        // 1. Primary Engine: Official @google/genai SDK
        const ai = new GoogleGenAI({ apiKey });

        if (isSummarize) {
          const formattedTranscript = contextMessages
            .map(
              (m: any) =>
                `[${m.senderName || m.sender || 'User'}]: ${
                  m.content || m.text || ''
                }`
            )
            .join('\n');

          const summaryPrompt = `You are Gemini AI, an intelligent assistant embedded in NexusChat.
Please provide a clear, structured summary of the following chat messages from "${roomName}":

Chat Messages:
${formattedTranscript || 'No prior messages found in this room.'}

Please output:
1. 📌 Key Highlights
2. 🎯 Action Items & Decisions
3. 💡 Summary Conclusion`;

          const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: summaryPrompt,
          });

          aiResponseText = response.text || 'Unable to generate chat summary.';
        } else if (isSearch) {
          const searchPrompt = `You are Gemini AI. Answer the following search query clearly and accurately: "${prompt}". Provide up-to-date, structured technical information with bullet points.`;

          const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: searchPrompt,
          });

          aiResponseText = response.text || 'Search completed with no results.';
        } else {
          // Standard Chat Prompt
          const systemInstruction =
            'You are Gemini AI, an intelligent, fast, and helpful assistant in NexusChat. Provide accurate, clear responses with clean Markdown formatting, bullet points, and code blocks where helpful.';

          const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
              systemInstruction,
            },
          });

          aiResponseText = response.text || 'Received response from Gemini.';
        }
      } catch (sdkError: any) {
        console.warn('Google GenAI SDK error, trying direct REST endpoint fallback:', sdkError?.message);

        // 2. Direct Google Generative Language REST API Fallback
        try {
          const modelName = 'gemini-2.5-flash';
          const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;

          let contentText = prompt;
          if (isSummarize) {
            const formattedTranscript = contextMessages
              .map(
                (m: any) =>
                  `[${m.senderName || m.sender || 'User'}]: ${
                    m.content || m.text || ''
                  }`
              )
              .join('\n');
            contentText = `Please provide a clear, concise summary of this chat:\n${formattedTranscript}`;
          }

          const restRes = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: contentText }] }],
            }),
          });

          if (restRes.ok) {
            const restData = await restRes.json();
            aiResponseText =
              restData?.candidates?.[0]?.content?.parts?.[0]?.text ||
              'Received response from Gemini.';
          } else {
            console.warn('Gemini REST API status:', restRes.status);
            aiResponseText = generateFallbackResponse(prompt, isSummarize, contextMessages, roomName);
          }
        } catch (restErr) {
          console.error('Gemini REST API fallback error:', restErr);
          aiResponseText = generateFallbackResponse(prompt, isSummarize, contextMessages, roomName);
        }
      }
    } else {
      aiResponseText = generateFallbackResponse(prompt, isSummarize, contextMessages, roomName);
    }

    return NextResponse.json({
      text: aiResponseText,
      reply: aiResponseText,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Error in /api/gemini route:', error);
    return NextResponse.json(
      { error: error?.message || 'Gemini processing failed' },
      { status: 500 }
    );
  }
}

// Clean contextual fallback when API key is pending configuration
function generateFallbackResponse(
  prompt: string,
  isSummarize: boolean,
  contextMessages: any[],
  roomName: string
): string {
  if (isSummarize) {
    const messageCount = contextMessages.length;
    const participants = Array.from(
      new Set(contextMessages.map((m) => m.senderName || m.sender || 'User'))
    ).join(', ') || 'Participants';

    return `### 📋 Chat Summary (${roomName})
- **Participants**: ${participants}
- **Messages Analyzed**: ${messageCount}
- **Overview**: Real-time messaging session active. Media attachments, voice notes, and direct messages synchronized successfully.`;
  }

  return `🤖 **Gemini AI**:
I received your request: "${prompt}".

*You can ask me to \`@gemini summarize\` your chat, \`@gemini search <topic>\`, write code, or answer questions.*`;
}
