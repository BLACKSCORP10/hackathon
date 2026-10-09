import { NextRequest, NextResponse } from 'next/server';
import { getFirestoreUser } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { uid } = body;

    if (!uid) {
      return NextResponse.json({ success: false, error: 'UID is required' }, { status: 400 });
    }

    const user = await getFirestoreUser(uid);
    return NextResponse.json({ success: true, user });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || 'Server error' }, { status: 500 });
  }
}
