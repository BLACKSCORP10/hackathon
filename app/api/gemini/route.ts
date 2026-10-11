import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { prompt = '', roomContext, history = [], mode = 'chat', roomName = 'Nexus Channel' } = body;

    const userQuery = (typeof prompt === 'string' ? prompt : '').trim();
    const isSummarize = mode === 'summarize' || userQuery.toLowerCase().includes('summarize');

    if (!userQuery && !isSummarize) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json({ text: 'Error: GEMINI_API_KEY is missing on server.' }, { status: 500 });
    }

    const contextMessages = Array.isArray(roomContext)
      ? roomContext
      : Array.isArray(history)
        ? history
        : [];

    let contentToSend = userQuery;
    if (isSummarize) {
      const formattedTranscript = contextMessages
        .map((m: any) => `[${m.senderName || m.sender || 'User'}]: ${m.content || m.text || ''}`)
        .join('\n');

      contentToSend = `You are Gemini AI in NexusChat. Summarize the following chat messages from "${roomName}":\n\n${formattedTranscript}\n\nInclude: 📌 Highlights, 🎯 Action Items, 💡 Conclusion.`;
    }

    // Direct REST API Call to Google Gemini 2.5 Flash
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: contentToSend }] }],
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error('Gemini Google API Error Response:', data);
      return NextResponse.json({
        text: `Gemini API Error: ${data?.error?.message || 'Failed to connect to Google AI'}`,
      });
    }

    const generatedText = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!generatedText) {
      return NextResponse.json({ text: 'Gemini returned an empty response.' });
    }

    return NextResponse.json({ text: generatedText });
  } catch (error: any) {
    console.error('Error in /api/gemini route:', error);
    return NextResponse.json({ text: `Server Error: ${error?.message || 'Processing failed'}` }, { status: 500 });
  }
}