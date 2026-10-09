import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { roomName, isVideo = true } = body;

    const dailyApiKey = process.env.DAILY_API_KEY;
    const dailyDomain = process.env.NEXT_PUBLIC_DAILY_DOMAIN || 'nexuschat';
    const fallbackUrl =
      process.env.NEXT_PUBLIC_DAILY_ROOM_URL ||
      `https://${dailyDomain}.daily.co/${roomName || 'nexus-mesh'}`;

    // If Daily API key is configured, create a temporary Daily.co room via REST API
    if (dailyApiKey) {
      try {
        const res = await fetch('https://api.daily.co/v1/rooms', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${dailyApiKey}`,
          },
          body: JSON.stringify({
            name: roomName,
            properties: {
              enable_chat: true,
              enable_screenshare: true,
              enable_knocking: false,
              start_video_off: !isVideo,
              start_audio_off: false,
              exp: Math.round(Date.now() / 1000) + 7200, // 2 hours expiration
            },
          }),
        });

        if (res.ok) {
          const data = await res.json();
          return NextResponse.json({ url: data.url, name: data.name, created: true });
        } else {
          // If room already exists or error, fetch room or use fallback
          const errorData = await res.json().catch(() => ({}));
          console.warn('Daily room creation API notice:', errorData);
          if (errorData?.info?.includes('already exists')) {
            return NextResponse.json({
              url: `https://${dailyDomain}.daily.co/${roomName}`,
              name: roomName,
              created: false,
            });
          }
        }
      } catch (apiErr) {
        console.warn('Daily REST API fetch error:', apiErr);
      }
    }

    // Default URL using room name
    return NextResponse.json({
      url: fallbackUrl,
      name: roomName || 'nexus-mesh',
      created: false,
    });
  } catch (err: any) {
    console.error('Error in daily room route:', err);
    return NextResponse.json(
      { error: err?.message || 'Failed to initialize Daily room' },
      { status: 500 }
    );
  }
}
