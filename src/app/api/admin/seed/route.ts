import { NextRequest, NextResponse } from 'next/server';
import { seedDatabase } from '@/scripts/seed';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const force = searchParams.get('force') === 'true';

    const result = await seedDatabase(force);
    const counts = {
      lakes: await prisma.lake.count(),
      reports: await prisma.report.count(),
      complaints: await prisma.complaint.count(),
      escalations: await prisma.escalation.count(),
      users: await prisma.user.count(),
    };

    return NextResponse.json({ ...result, counts });
  } catch (error: any) {
    console.error('API seed error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Seeding failed' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const force = body.force === true;

    const result = await seedDatabase(force);
    const counts = {
      lakes: await prisma.lake.count(),
      reports: await prisma.report.count(),
      complaints: await prisma.complaint.count(),
      escalations: await prisma.escalation.count(),
      users: await prisma.user.count(),
    };

    return NextResponse.json({ ...result, counts });
  } catch (error: any) {
    console.error('API seed error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Seeding failed' },
      { status: 500 }
    );
  }
}
