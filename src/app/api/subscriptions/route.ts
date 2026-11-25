import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    let email = session?.user?.email || 'citizen@demo.in';

    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        subscriptions: {
          include: { lake: true },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ subscriptions: [] });
    }

    // Also get recent status events on subscribed lakes for in-app notifications
    const lakeIds = user.subscriptions.map((s) => s.lakeId);
    const recentNotifications = await prisma.statusEvent.findMany({
      where: {
        report: {
          lakeId: { in: lakeIds },
        },
      },
      include: {
        report: {
          include: { lake: true },
        },
      },
      orderBy: { timestamp: 'desc' },
      take: 10,
    });

    return NextResponse.json({
      subscriptions: user.subscriptions,
      notifications: recentNotifications,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    const body = await req.json();
    const { lakeId, action } = body;

    let email = session?.user?.email || 'citizen@demo.in';
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (action === 'unsubscribe') {
      await prisma.subscription.deleteMany({
        where: { userId: user.id, lakeId },
      });
      return NextResponse.json({ success: true, subscribed: false });
    } else {
      const sub = await prisma.subscription.upsert({
        where: {
          userId_lakeId: {
            userId: user.id,
            lakeId,
          },
        },
        create: {
          userId: user.id,
          lakeId,
        },
        update: {},
      });
      return NextResponse.json({ success: true, subscribed: true, sub });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
