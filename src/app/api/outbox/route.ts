import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const outbox = await prisma.outbox.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    return NextResponse.json({ outbox });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
