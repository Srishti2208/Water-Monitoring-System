import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateComplaintPdfBuffer } from '@/services/complaintPdf';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const complaintIdOrTracking = params.id;

    const complaint = await prisma.complaint.findFirst({
      where: {
        OR: [
          { id: complaintIdOrTracking },
          { trackingId: complaintIdOrTracking },
          { reportId: complaintIdOrTracking },
        ],
      },
      include: {
        report: {
          include: {
            lake: true,
            user: true,
          },
        },
        escalations: true,
      },
    });

    if (!complaint) {
      return NextResponse.json({ error: 'Complaint not found' }, { status: 404 });
    }

    const report = complaint.report;
    const vision = report.vision ? JSON.parse(report.vision) : { severity: 3 };

    const pdfBuffer = await generateComplaintPdfBuffer({
      trackingId: complaint.trackingId,
      lakeName: report.lake.name,
      ward: report.lake.ward,
      lat: report.lat,
      lng: report.lng,
      dateStr: new Date(complaint.sentAt).toLocaleDateString('en-IN'),
      severity: vision.severity || 3,
      priority: complaint.priority,
      letterText: complaint.letterText,
      citizenName: report.user.name || 'Citizen Reporter',
      citizenEmail: report.user.email,
      escalationNotes: complaint.escalations.map(
        (e) => `[Level ${e.level}] ${e.reason} (${new Date(e.createdAt).toLocaleDateString('en-IN')})`
      ),
    });

    return new NextResponse(pdfBuffer as any, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${complaint.trackingId}.pdf"`,
      },
    });
  } catch (error: any) {
    console.error('Error generating complaint PDF:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate PDF' },
      { status: 500 }
    );
  }
}
