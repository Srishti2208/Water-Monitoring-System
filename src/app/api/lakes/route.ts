import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

export async function GET() {
  try {
    const lakes = await prisma.lake.findMany({
      include: {
        _count: {
          select: { reports: true, subscriptions: true },
        },
      },
      orderBy: { currentHealthScore: 'asc' },
    });
    return NextResponse.json({ success: true, lakes });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, ward, lat, lng, currentHealthScore = 70 } = body;

    if (!name || !ward || lat === undefined || lng === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: name, ward, lat, lng are mandatory.' },
        { status: 400 }
      );
    }

    const parsedLat = parseFloat(lat);
    const parsedLng = parseFloat(lng);
    const parsedScore = Math.min(100, Math.max(0, parseInt(currentHealthScore, 10) || 70));

    if (isNaN(parsedLat) || isNaN(parsedLng)) {
      return NextResponse.json(
        { error: 'Invalid coordinates provided.' },
        { status: 400 }
      );
    }

    // Determine initial trend
    const trend = parsedScore >= 70 ? 'IMPROVING' : parsedScore <= 40 ? 'DECLINING' : 'STABLE';

    // Create lake record
    const lake = await prisma.lake.create({
      data: {
        name: name.trim(),
        ward: ward.trim(),
        lat: parsedLat,
        lng: parsedLng,
        currentHealthScore: parsedScore,
        trend,
      },
    });

    // Seed 90 days of baseline historical snapshots for Recharts area graph
    const snapshots = [];
    const now = new Date();
    for (let i = 90; i >= 0; i--) {
      const snapDate = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      // Small natural variation
      const randomJitter = Math.floor(Math.sin(i / 10) * 4);
      const score = Math.min(100, Math.max(10, parsedScore + randomJitter));
      snapshots.push({
        lakeId: lake.id,
        date: snapDate,
        score,
      });
    }

    await prisma.lakeHealthSnapshot.createMany({
      data: snapshots,
    });

    return NextResponse.json({
      success: true,
      message: `Lake "${lake.name}" registered successfully with 90-day baseline snapshots.`,
      lake,
    });
  } catch (error: any) {
    console.error('Error creating lake:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
