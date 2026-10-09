import { NextRequest, NextResponse } from 'next/server';
import { syncFirestoreUser } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { uid, email, name, username, phone, avatarUrl } = body;

    if (!uid || !email) {
      return NextResponse.json({ success: false, error: 'UID and Email are required' }, { status: 400 });
    }

    const user = await syncFirestoreUser({
      uid,
      email,
      name,
      username,
      phone,
      avatarUrl,
    });

    return NextResponse.json({ success: true, user });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || 'Server error' }, { status: 500 });
  }
}
