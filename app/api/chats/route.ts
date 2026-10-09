import { NextRequest, NextResponse } from 'next/server';
import { collection, getDocs, orderBy, query } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const q = query(collection(db, 'chats'), orderBy('updatedAt', 'desc'));
    const snapshot = await getDocs(q);
    const chats = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));

    return NextResponse.json({
      success: true,
      chats,
      totalCount: chats.length,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || 'Server error' }, { status: 500 });
  }
}
