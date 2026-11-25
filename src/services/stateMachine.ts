import { prisma } from '@/lib/prisma';
import { sendOrQueueComplaint } from './complaint';
import { calculateLakeHealthScore, calculateTrend } from './healthScore';

export type ReportStatus =
  | 'SUBMITTED'
  | 'AI_VALIDATED'
  | 'COMPLAINT_SENT'
  | 'ACKNOWLEDGED'
  | 'IN_PROGRESS'
  | 'RESOLVED_CLAIMED'
  | 'CITIZEN_VERIFIED'
  | 'CLOSED'
  | 'REJECTED'
  | 'REOPENED';

// Allowed next states map
export const ALLOWED_TRANSITIONS: Record<ReportStatus, ReportStatus[]> = {
  SUBMITTED: ['AI_VALIDATED', 'REJECTED'],
  AI_VALIDATED: ['COMPLAINT_SENT', 'REJECTED'],
  COMPLAINT_SENT: ['ACKNOWLEDGED', 'REJECTED', 'REOPENED'],
  ACKNOWLEDGED: ['IN_PROGRESS', 'REJECTED', 'REOPENED'],
  IN_PROGRESS: ['RESOLVED_CLAIMED', 'ACKNOWLEDGED', 'REOPENED'],
  RESOLVED_CLAIMED: ['CITIZEN_VERIFIED', 'REOPENED'],
  CITIZEN_VERIFIED: ['CLOSED', 'REOPENED'],
  CLOSED: ['REOPENED'],
  REJECTED: ['REOPENED'],
  REOPENED: ['IN_PROGRESS', 'COMPLAINT_SENT', 'AI_VALIDATED'],
};

export interface TransitionRequest {
  reportId: string;
  toStatus: ReportStatus;
  actor: string; // e.g. "Official (official@demo.in)", "Citizen (citizen@demo.in)", "AI Vision Agent", "System SLA Cron"
  actorRole?: 'CITIZEN' | 'OFFICIAL' | 'ADMIN' | 'SYSTEM';
  note?: string;
  resolutionPhotoPath?: string;
}

/**
 * Executes a verified status transition following the JalDrishti civic state machine
 */
export async function transitionReportStatus({
  reportId,
  toStatus,
  actor,
  actorRole = 'SYSTEM',
  note,
  resolutionPhotoPath,
}: TransitionRequest) {
  const report = await prisma.report.findUnique({
    where: { id: reportId },
    include: {
      lake: true,
      complaint: true,
      user: true,
    },
  });

  if (!report) {
    throw new Error(`Report with id ${reportId} not found.`);
  }

  const fromStatus = report.status as ReportStatus;

  // Validate state transition validity
  const validNextStates = ALLOWED_TRANSITIONS[fromStatus] || [];
  if (!validNextStates.includes(toStatus) && actorRole !== 'ADMIN') {
    throw new Error(
      `Invalid state transition: Cannot transition from ${fromStatus} to ${toStatus}. Allowed transitions: ${validNextStates.join(', ')}`
    );
  }

  // Role permissions check
  if (actorRole === 'OFFICIAL') {
    const officialAllowed: ReportStatus[] = [
      'ACKNOWLEDGED',
      'IN_PROGRESS',
      'RESOLVED_CLAIMED',
      'REJECTED',
    ];
    if (!officialAllowed.includes(toStatus) && toStatus !== fromStatus) {
      throw new Error(`Officials are permitted to set statuses: ${officialAllowed.join(', ')}`);
    }
    if (toStatus === 'RESOLVED_CLAIMED' && !note) {
      throw new Error('Marking action taken requires a detailed resolution note.');
    }
  }

  if (actorRole === 'CITIZEN') {
    const citizenAllowed: ReportStatus[] = ['CITIZEN_VERIFIED', 'REOPENED'];
    if (!citizenAllowed.includes(toStatus) && fromStatus !== 'SUBMITTED') {
      throw new Error(`Citizens can only verify resolution ('CITIZEN_VERIFIED') or report re-pollution ('REOPENED').`);
    }
  }

  // If transition to RESOLVED_CLAIMED and resolution photo provided, append to notes
  let effectiveNote = note;
  if (resolutionPhotoPath) {
    effectiveNote = `${note || 'Remediation completed.'} [Resolution Proof: ${resolutionPhotoPath}]`;
  }

  // Execute database transaction
  const updatedReport = await prisma.$transaction(async (tx) => {
    // 1. Update report status
    const rep = await tx.report.update({
      where: { id: reportId },
      data: {
        status: toStatus,
        updatedAt: new Date(),
      },
    });

    // 2. Insert StatusEvent audit log
    await tx.statusEvent.create({
      data: {
        reportId,
        complaintId: report.complaint?.id,
        fromStatus,
        toStatus,
        actor,
        note: effectiveNote,
        timestamp: new Date(),
      },
    });

    return rep;
  });

  // Post-transition triggers
  if (toStatus === 'COMPLAINT_SENT') {
    // Automatically generate and dispatch formal complaint letter
    try {
      await sendOrQueueComplaint(reportId);
    } catch (err) {
      console.error('Error generating complaint upon transition:', err);
    }
  }

  if (toStatus === 'AI_VALIDATED' || toStatus === 'CLOSED' || toStatus === 'REOPENED') {
    // Recompute lake health score
    try {
      await recalculateLakeHealth(report.lakeId);
    } catch (err) {
      console.error('Error updating lake health score:', err);
    }
  }

  return updatedReport;
}

/**
 * Recomputes lake health score and updates the lake record
 */
export async function recalculateLakeHealth(lakeId: string) {
  const lake = await prisma.lake.findUnique({
    where: { id: lakeId },
    include: {
      reports: {
        where: {
          status: {
            notIn: ['REJECTED', 'SUBMITTED'],
          },
        },
      },
      snapshots: {
        orderBy: { date: 'desc' },
        take: 7,
      },
    },
  });

  if (!lake) return;

  const mappedReports = lake.reports.map((r) => {
    const vision = r.vision ? JSON.parse(r.vision) : { severity: 3 };
    const readings = r.readings ? JSON.parse(r.readings) : {};
    const trust = r.trust ? JSON.parse(r.trust) : {};
    return {
      severity: vision.severity || 3,
      capturedAt: r.capturedAt,
      readings,
      trust,
    };
  });

  const newScore = calculateLakeHealthScore(mappedReports);
  const score7DaysAgo = lake.snapshots.length > 0 ? lake.snapshots[lake.snapshots.length - 1].score : newScore;
  const newTrend = calculateTrend(newScore, score7DaysAgo);

  await prisma.lake.update({
    where: { id: lakeId },
    data: {
      currentHealthScore: newScore,
      trend: newTrend,
    },
  });

  // Record daily snapshot if one does not exist for today
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const existingSnapshot = await prisma.lakeHealthSnapshot.findFirst({
    where: {
      lakeId,
      date: {
        gte: today,
      },
    },
  });

  if (!existingSnapshot) {
    await prisma.lakeHealthSnapshot.create({
      data: {
        lakeId,
        date: new Date(),
        score: newScore,
      },
    });
  }
}
