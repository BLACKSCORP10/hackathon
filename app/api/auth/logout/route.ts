import { NextResponse } from 'next/server';

export async function POST() {
  const response = NextResponse.json({
    success: true,
    message: 'Node disconnected and session cleared.',
  });

  response.cookies.delete('nexus_auth_token');
  return response;
}
