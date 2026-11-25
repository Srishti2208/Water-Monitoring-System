import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { computeDHash } from '@/services/dhash';
import { evaluateReportTrust } from '@/services/antiSpam';
import { getVisionService } from '@/services/vision';
import { getRainfallContext } from '@/services/weather';
import { transitionReportStatus } from '@/services/stateMachine';
import { auth } from '@/auth';
import path from 'path';
import fs from 'fs';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const lakeId = searchParams.get('lakeId');
    const status = searchParams.get('status');
    const userId = searchParams.get('userId');
    const limit = parseInt(searchParams.get('limit') || '100');

    const where: any = {};
    if (lakeId) where.lakeId = lakeId;
    if (status) where.status = status;
    if (userId) where.userId = userId;

    const reports = await prisma.report.findMany({
      where,
      include: {
        lake: true,
        user: {
          select: { id: true, name: true, email: true, trustScore: true },
        },
        complaint: true,
        statusEvents: {
          orderBy: { timestamp: 'asc' },
        },
      },
      orderBy: { uploadedAt: 'desc' },
      take: limit,
    });

    return NextResponse.json({ reports });
  } catch (error: any) {
    console.error('Error fetching reports:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    const contentType = req.headers.get('content-type') || '';

    let payload: any = {};
    let uploadedFileBuffer: Buffer | null = null;
    let savedPhotoPath = '/demo-images/solid_waste.jpg';

    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      const file = formData.get('photo') as File | null;
      const rawData = formData.get('data') as string;
      if (rawData) {
        payload = JSON.parse(rawData);
      }

      if (file && typeof file !== 'string') {
        const bytes = await file.arrayBuffer();
        uploadedFileBuffer = Buffer.from(bytes);
        const filename = `report_${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
        const uploadDir = path.join(process.cwd(), 'public', 'uploads');
        if (!fs.existsSync(uploadDir)) {
          fs.mkdirSync(uploadDir, { recursive: true });
        }
        const fullFilePath = path.join(uploadDir, filename);
        await fs.promises.writeFile(fullFilePath, uploadedFileBuffer);
        savedPhotoPath = `/uploads/${filename}`;
      }
    } else {
      payload = await req.json();
      if (payload.photoPath) {
        savedPhotoPath = payload.photoPath;
      }
    }

    // Determine User ID (from session or default to citizen@demo.in)
    let user = null;
    if (session?.user?.email) {
      user = await prisma.user.findUnique({ where: { email: session.user.email } });
    }
    if (!user) {
      user = await prisma.user.findUnique({ where: { email: 'citizen@demo.in' } });
    }
    if (!user) {
      // Emergency seed
      const { seedDatabase } = await import('@/scripts/seed');
      await seedDatabase(false);
      user = await prisma.user.findUnique({ where: { email: 'citizen@demo.in' } });
    }

    const userId = user?.id || 'demo-user-id';

    // Parse coordinates and dates
    const lat = parseFloat(payload.lat);
    const lng = parseFloat(payload.lng);
    const capturedAt = payload.capturedAt ? new Date(payload.capturedAt) : new Date();
    const uploadedAt = new Date();

    const hasExifGps = Boolean(payload.hasExifGps);
    const hasExifTimestamp = Boolean(payload.hasExifTimestamp);

    // Compute perceptual dHash of image
    let dHash: string | undefined;
    try {
      if (uploadedFileBuffer) {
        dHash = await computeDHash(uploadedFileBuffer);
      } else {
        dHash = await computeDHash(savedPhotoPath);
      }
    } catch (e) {
      console.warn('dHash compute failed, using fallback:', e);
      dHash = '0123456789abcdef';
    }

    // 1. Anti-spam & Trust Verification
    const trustResult = await evaluateReportTrust({
      userId,
      lat,
      lng,
      capturedAt,
      uploadedAt,
      hasExifGps,
      hasExifTimestamp,
      dHash,
    });

    if (trustResult.rateLimitExceeded) {
      return NextResponse.json(
        { error: trustResult.reason || 'Rate limit exceeded' },
        { status: 429 }
      );
    }

    // Determine nearest lake if lakeId is not provided
    let lakeId = payload.lakeId;
    if (!lakeId) {
      const lakes = await prisma.lake.findMany();
      let closestLake = lakes[0];
      let minDistance = Infinity;
      const { calculateDistanceMeters } = await import('@/services/dhash');
      for (const l of lakes) {
        const dist = calculateDistanceMeters(lat, lng, l.lat, l.lng);
        if (dist < minDistance) {
          minDistance = dist;
          closestLake = l;
        }
      }
      lakeId = closestLake.id;
    }

    // 2. Vision Service AI Analysis
    const visionService = getVisionService();
    let visionAnalysis = await visionService.analyzeWaterImage(uploadedFileBuffer || savedPhotoPath);

    // Apply community cross-validation bonus (+1 effective severity, cap 5)
    let effectiveSeverity = visionAnalysis.severity;
    if (trustResult.communityVerified && !trustResult.duplicateOfId) {
      effectiveSeverity = Math.min(5, effectiveSeverity + 1);
    }

    // 3. Meteorological Enrichment (Rainfall context)
    const rainContext = await getRainfallContext(lat, lng, capturedAt);

    // 4. Initial Database Record Creation in SUBMITTED state
    const report = await prisma.report.create({
      data: {
        userId,
        lakeId,
        lat,
        lng,
        photoPaths: JSON.stringify([savedPhotoPath]),
        capturedAt,
        uploadedAt,
        readings: JSON.stringify(payload.readings || {}),
        observations: JSON.stringify(payload.observations || {}),
        vision: JSON.stringify({
          ...visionAnalysis,
          severity: effectiveSeverity,
        }),
        rainContext: JSON.stringify(rainContext),
        trust: JSON.stringify({
          exifVerified: trustResult.exifVerified,
          communityVerified: trustResult.communityVerified,
          duplicateOfId: trustResult.duplicateOfId,
        }),
        status: 'SUBMITTED',
        dHash,
      },
    });

    // Record submission event
    await prisma.statusEvent.create({
      data: {
        reportId: report.id,
        fromStatus: 'SUBMITTED',
        toStatus: 'SUBMITTED',
        actor: `Citizen (${user?.email})`,
        note: `Citizen report submitted with ${trustResult.exifVerified ? 'verified EXIF metadata' : 'unverified/missing EXIF metadata'}.`,
        timestamp: uploadedAt,
      },
    });

    // 5. Automatic transition: SUBMITTED -> AI_VALIDATED
    let validatedReport;
    if (trustResult.duplicateOfId) {
      // Mark as REJECTED due to duplicate within 500m/7d
      validatedReport = await transitionReportStatus({
        reportId: report.id,
        toStatus: 'REJECTED',
        actor: 'JalDrishti Anti-Spam Engine',
        actorRole: 'SYSTEM',
        note: `Duplicate image detected within 500m / 7 days (Hamming distance match with Report ${trustResult.duplicateOfId}). Excluded from double counting.`,
      });
    } else {
      validatedReport = await transitionReportStatus({
        reportId: report.id,
        toStatus: 'AI_VALIDATED',
        actor: 'JalDrishti AI Vision Service',
        actorRole: 'SYSTEM',
        note: `AI Classification: ${visionAnalysis.labels.join(', ') || 'Clean surface'} | Severity ${effectiveSeverity}/5 (${visionAnalysis.notes})`,
      });

      // 6. Automatic transition: AI_VALIDATED -> COMPLAINT_SENT
      validatedReport = await transitionReportStatus({
        reportId: report.id,
        toStatus: 'COMPLAINT_SENT',
        actor: 'JalDrishti Civic Dispatch Engine',
        actorRole: 'SYSTEM',
        note: `Formal civic notice generated and queued for dispatch to BBMP Lakes Division.`,
      });
    }

    // Fetch full report with relations
    const finalReport = await prisma.report.findUnique({
      where: { id: report.id },
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
      report: finalReport,
      trust: trustResult,
    });
  } catch (error: any) {
    console.error('Error submitting report:', error);
    return NextResponse.json(
      { error: error.message || 'Submission failed' },
      { status: 500 }
    );
  }
}
