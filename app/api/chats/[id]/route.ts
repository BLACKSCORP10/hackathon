import { NextRequest, NextResponse } from 'next/server';
import { doc, getDoc, collection, getDocs, orderBy, query } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const chatDoc = await getDoc(doc(db, 'chats', id));

    if (!chatDoc.exists()) {
      return NextResponse.json({ success: false, error: 'Chat not found' }, { status: 404 });
    }

    const messagesQuery = query(collection(db, 'chats', id, 'messages'), orderBy('timestamp', 'asc'));
    const messagesSnap = await getDocs(messagesQuery);
    const messages = messagesSnap.docs.map(d => ({ id: d.id, ...d.data() }));

    return NextResponse.json({
      success: true,
      chat: { id: chatDoc.id, ...chatDoc.data() },
      messages,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || 'Server error' }, { status: 500 });
  }
}
