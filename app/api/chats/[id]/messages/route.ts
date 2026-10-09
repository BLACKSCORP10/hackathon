import { NextRequest, NextResponse } from 'next/server';
import { sendFirestoreMessage, addFirestoreReaction } from '@/lib/db';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id: chatId } = params;
    const body = await req.json();

    if (body.action === 'reaction') {
      const { messageId, emoji } = body;
      await addFirestoreReaction(chatId, messageId, emoji);
      return NextResponse.json({ success: true });
    }

    const { senderId, senderName, senderAvatar, receiverId, content, type, mediaUrl, mediaMeta } = body;

    const messageId = await sendFirestoreMessage(chatId, {
      senderId: senderId || 'anonymous',
      senderName: senderName || 'Anonymous',
      senderAvatar: senderAvatar || '',
      receiverId: receiverId || '',
      content: content || 'Media Payload',
      type: type || 'text',
      mediaUrl,
      mediaMeta,
    });

    return NextResponse.json({ success: true, messageId }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || 'Server error' }, { status: 500 });
  }
}
