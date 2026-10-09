import { NextRequest, NextResponse } from 'next/server';
import { getFirestoreUser } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const uid = req.cookies.get('nexus_auth_token')?.value;

    if (!uid) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const user = await getFirestoreUser(uid);
    if (!user) {
      return NextResponse.json({ success: false, error: 'User node not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, user });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || 'Server error' }, { status: 500 });
  }
}
