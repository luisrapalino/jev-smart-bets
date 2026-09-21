import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

import { db, isDatabaseEnabled } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { getCurrentUserId } from '@/lib/session';

export async function GET() {
  const userId = await getCurrentUserId();
  if (!userId || !isDatabaseEnabled) {
    return NextResponse.json({ user: null });
  }

  const [user] = await db!.select().from(users).where(eq(users.id, userId));
  return NextResponse.json({ user: user ? { email: user.email } : null });
}
