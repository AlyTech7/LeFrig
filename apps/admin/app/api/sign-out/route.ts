import { auth, clerkClient } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { getHostedClerkSignInUrl } from '@/lib/site-url';

export async function GET() {
  const { sessionId } = await auth();
  if (sessionId) {
    const client = await clerkClient();
    await client.sessions.revokeSession(sessionId);
  }
  return NextResponse.redirect(getHostedClerkSignInUrl());
}
