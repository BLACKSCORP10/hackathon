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

    const userQuery = (typeof prompt === 'string' ? prompt : '').trim();

    const isSummarize =
      mode === 'summarize' ||
      userQuery.toLowerCase().includes('summarize');

    if (!userQuery && !isSummarize) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    const apiKey =
      process.env.GEMINI_API_KEY ||
      process.env.NEXT_PUBLIC_GEMINI_API_KEY ||
      process.env.GOOGLE_GENAI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        {
          error:
            'GEMINI_API_KEY is not configured on the server. Please set GEMINI_API_KEY in your environment variables.',
        },
        { status: 500 }
      );
    }

    const contextMessages = Array.isArray(roomContext)
      ? roomContext
      : Array.isArray(history)
      ? history
      : typeof roomContext === 'string'
      ? [{ content: roomContext }]
      : [];

    let aiResponseText = '';

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
Please provide a clear, structured, and helpful summary of the following chat messages from "${roomName}":

Chat Transcript:
${formattedTranscript || 'No recent messages in this conversation.'}

Format the response with:
1. 📌 Key Highlights
2. 🎯 Decisions & Action Items
3. 💡 Summary Conclusion`;

        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: summaryPrompt,
        });

        aiResponseText = response.text || 'Unable to generate chat summary.';
      } else {
        // Standard prompt execution
        const systemInstruction =
          'You are Gemini AI, an intelligent, fast, and helpful assistant in NexusChat. Provide accurate, clear responses with clean Markdown formatting, bullet points, and code blocks where helpful.';

        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: userQuery,
          config: {
            systemInstruction,
          },
        });

        aiResponseText = response.text || 'Received empty response from Gemini.';
      }
    } catch (sdkError: any) {
      console.warn(
        'Google GenAI SDK error, attempting direct Google Generative Language REST API:',
        sdkError?.message
      );

      // 2. Direct Google Generative Language REST API Fallback
      try {
        const modelName = 'gemini-2.5-flash';
        const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;

        let contentText = userQuery;
        if (isSummarize) {
          const formattedTranscript = contextMessages
            .map(
              (m: any) =>
                `[${m.senderName || m.sender || 'User'}]: ${
                  m.content || m.text || ''
                }`
            )
            .join('\n');
          contentText = `Please provide a clear, concise summary of this chat conversation:\n${formattedTranscript}`;
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
          const errData = await restRes.json().catch(() => null);
          console.error('Gemini REST API error response:', errData);
          return NextResponse.json(
            { error: errData?.error?.message || `Gemini API error: ${restRes.statusText}` },
            { status: restRes.status }
          );
        }
      } catch (restErr: any) {
        console.error('Gemini REST API fallback error:', restErr);
        return NextResponse.json(
          { error: restErr?.message || 'Failed to connect to Gemini API endpoint.' },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      text: aiResponseText,
    });
  } catch (error: any) {
    console.error('Error in /api/gemini route:', error);
    return NextResponse.json(
      { error: error?.message || 'Gemini processing failed' },
      { status: 500 }
    );
  }
}
