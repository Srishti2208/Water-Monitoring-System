import { NextRequest, NextResponse } from 'next/server';
import { transitionReportStatus, ReportStatus } from '@/services/stateMachine';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    const body = await req.json();

    const { reportId, toStatus, note, resolutionPhotoPath } = body;
    if (!reportId || !toStatus) {
      return NextResponse.json({ error: 'Missing reportId or toStatus' }, { status: 400 });
    }

    // Determine actor and role
    let actorEmail = session?.user?.email || 'official@demo.in';
    let actorRole: 'CITIZEN' | 'OFFICIAL' | 'ADMIN' = (session?.user as any)?.role || 'OFFICIAL';

    const actor = `${actorRole} (${actorEmail})`;

    const updated = await transitionReportStatus({
      reportId,
      toStatus: toStatus as ReportStatus,
      actor,
      actorRole,
      note,
      resolutionPhotoPath,
    });

    const fullReport = await prisma.report.findUnique({
      where: { id: reportId },
      include: {
        lake: true,
        user: true,
        complaint: true,
        statusEvents: {
          orderBy: { timestamp: 'asc' },
        },
      },
    });

    return NextResponse.json({
      success: true,
      report: fullReport,
    });
  } catch (error: any) {
    console.error('Error transitioning report status:', error);
    return NextResponse.json(
      { error: error.message || 'Transition failed' },
      { status: 400 }
    );
  }
}
