import { NextResponse } from 'next/server';
import { collection, getDocs, orderBy, query } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const q = query(collection(db, 'stories'), orderBy('timestamp', 'desc'));
    const snapshot = await getDocs(q);
    const stories = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));

    return NextResponse.json({
      success: true,
      stories,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || 'Server error' }, { status: 500 });
  }
}
