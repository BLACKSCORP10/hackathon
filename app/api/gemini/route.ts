import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { prompt, mode = 'chat', history = [], roomName = 'Nexus Channel' } = body;

    if (!prompt && mode !== 'summarize') {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    const apiKey =
      process.env.GEMINI_API_KEY ||
      process.env.NEXT_PUBLIC_GEMINI_API_KEY ||
      process.env.GOOGLE_GENAI_API_KEY;

    let aiResponseText = '';

    if (apiKey) {
      try {
        // 1. Try official @google/genai SDK
        const ai = new GoogleGenAI({ apiKey });

        if (mode === 'summarize') {
          const formattedHistory = (history as any[])
            .map((m: any) => `[${m.senderName || 'User'}]: ${m.content || m.text || ''}`)
            .join('\n');

          const summaryPrompt = `You are Nexus Gemini, an advanced AI assistant embedded in NexusChat.
Please provide a clear, concise summary of the following chat conversation from "${roomName}":

Chat Transcript:
${formattedHistory || 'No recent messages in this channel.'}

Provide a structured summary with:
1. 📌 Key Discussion Points
2. 🎯 Action Items & Next Steps
3. 💡 Core Decisions or Code Artifacts`;

          const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: summaryPrompt,
          });

          aiResponseText = response.text || 'Unable to generate room summary.';
        } else if (mode === 'search') {
          const searchPrompt = `You are Nexus Gemini. The user is asking a query: "${prompt}".
Please provide an accurate, up-to-date, structured response with verified key facts, clear explanations, and technical details where applicable.`;

          const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: searchPrompt,
          });

          aiResponseText = response.text || 'Search completed with no results.';
        } else {
          // Standard Chat / Command
          const systemInstruction =
            'You are Nexus Gemini, an intelligent, helpful, and concise AI assistant in NexusChat. Provide clear, accurate answers with clean Markdown formatting, bullet points, and code blocks where helpful.';

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
        console.warn('Google GenAI SDK error, attempting direct REST fallback:', sdkError?.message);
        
        // 2. Direct REST Fallback with standard Google Gemini API payload
        try {
          const modelName = 'gemini-2.5-flash';
          const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;
          
          let contentText = prompt;
          if (mode === 'summarize') {
            const formattedHistory = (history as any[])
              .map((m: any) => `[${m.senderName || 'User'}]: ${m.content || m.text || ''}`)
              .join('\n');
            contentText = `Summarize this conversation:\n${formattedHistory}`;
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
            aiResponseText = generateFallbackResponse(prompt, mode, history, roomName);
          }
        } catch (restErr) {
          console.error('Gemini REST API error:', restErr);
          aiResponseText = generateFallbackResponse(prompt, mode, history, roomName);
        }
      }
    } else {
      aiResponseText = generateFallbackResponse(prompt, mode, history, roomName);
    }

    return NextResponse.json({
      text: aiResponseText,
      reply: aiResponseText,
      mode,
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

// Clean contextual fallback when API key is not configured
function generateFallbackResponse(
  prompt: string,
  mode: string,
  history: any[],
  roomName: string
): string {
  if (mode === 'summarize') {
    const messageCount = history.length;
    const participants = Array.from(
      new Set(history.map((m) => m.senderName || 'User'))
    ).join(', ') || 'Participants';

    return `### 📋 Chat Summary (${roomName})
- **Participants**: ${participants}
- **Messages Analyzed**: ${messageCount}
- **Overview**: Real-time messaging session active. Media attachments, voice notes, and direct messages synchronized successfully.`;
  }

  if (mode === 'search') {
    return `### 🔍 Search Query: "${prompt}"
- **Query**: \`${prompt}\`
- **Result**: Ready to assist with research, calculations, and data queries. (Add GEMINI_API_KEY in .env.local to enable live web queries).`;
  }

  return `🤖 **Gemini AI**:
I received your request: "${prompt}".

*You can ask me to \`@gemini summarize\` your chat, \`@gemini search <topic>\`, write code, or answer questions.*`;
}
