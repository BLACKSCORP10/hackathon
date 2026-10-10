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
      return NextResponse.json(
        { text: 'Error fetching Gemini response.', error: 'Prompt is required' },
        { status: 400 }
      );
    }

    const apiKey =
      process.env.GEMINI_API_KEY ||
      process.env.NEXT_PUBLIC_GEMINI_API_KEY ||
      process.env.GOOGLE_GENAI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        {
          text: 'Error fetching Gemini response.',
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
    const primaryModel = 'gemini-2.5-flash';
    const fallbackModel = 'gemini-2.5-pro';

    let contentToSend = userQuery;
    if (isSummarize) {
      const formattedTranscript = contextMessages
        .map(
          (m: any) =>
            `[${m.senderName || m.sender || 'User'}]: ${m.content || m.text || ''
            }`
        )
        .join('\n');

      contentToSend = `You are Gemini AI, an intelligent assistant embedded in NexusChat.
Please provide a clear, structured, and helpful summary of the following chat messages from "${roomName}":

Chat Transcript:
${formattedTranscript || 'No recent messages in this conversation.'}

Format the response with:
1. 📌 Key Highlights
2. 🎯 Decisions & Action Items
3. 💡 Summary Conclusion`;
    }

    // 1. Primary Engine: Official @google/genai SDK (gemini-2.5-flash)
    try {
      const ai = new GoogleGenAI({ apiKey });
      const systemInstruction =
        'You are Gemini AI, an intelligent, fast, and helpful assistant in NexusChat. Provide accurate, clear responses with clean Markdown formatting, bullet points, and code blocks where helpful.';

      const response = await ai.models.generateContent({
        model: primaryModel,
        contents: contentToSend,
        config: !isSummarize
          ? {
            systemInstruction,
          }
          : undefined,
      });

      aiResponseText = response.text || '';
    } catch (sdkError: any) {
      console.warn(`GenAI SDK (${primaryModel}) failed, trying fallback (${fallbackModel}):`, sdkError?.message);

      // Try fallback model with SDK
      try {
        const ai = new GoogleGenAI({ apiKey });
        const fallbackResponse = await ai.models.generateContent({
          model: fallbackModel,
          contents: contentToSend,
        });
        aiResponseText = fallbackResponse.text || '';
      } catch (fallbackError: any) {
        console.warn(`GenAI SDK fallback (${fallbackModel}) failed:`, fallbackError?.message);
      }
    }

    // 2. Direct Google Generative Language REST API Fallback
    if (!aiResponseText) {
      for (const targetModel of [primaryModel, fallbackModel]) {
        try {
          const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${targetModel}:generateContent?key=${apiKey}`;
          const restRes = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: contentToSend }] }],
            }),
          });

          if (restRes.ok) {
            const restData = await restRes.json();
            const textCandidate = restData?.candidates?.[0]?.content?.parts?.[0]?.text;
            if (textCandidate) {
              aiResponseText = textCandidate;
              break;
            }
          }
        } catch (restErr: any) {
          console.warn(`Gemini REST API fallback (${targetModel}) error:`, restErr?.message);
        }
      }
    }

    if (!aiResponseText) {
      return NextResponse.json(
        { text: 'Error fetching Gemini response.', error: 'Failed to obtain content from Gemini models' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      text: aiResponseText,
    });
  } catch (error: any) {
    console.error('Error in /api/gemini route:', error);
    return NextResponse.json(
      { text: 'Error fetching Gemini response.', error: error?.message || 'Gemini processing failed' },
      { status: 500 }
    );
  }
}