import { prisma } from '@/lib/prisma';
import { sendOrQueueComplaint } from './complaint';

export interface SLACheckResult {
  breachesDetected: number;
  escalationsCreated: number;
  details: Array<{
    trackingId: string;
    lakeName: string;
    level: number;
    reason: string;
  }>;
}

/**
 * Checks all active complaints against statutory SLA deadlines:
 * - Acknowledged within 7 days of COMPLAINT_SENT
 * - In Progress within 14 days
 * Creates Escalation records, bumps priority to HIGH / CRITICAL, and regenerates complaint letter.
 */
export async function runSLACheck(): Promise<SLACheckResult> {
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
  const twentyOneDaysAgo = new Date(now.getTime() - 21 * 24 * 60 * 60 * 1000);

  // Find active complaints where status is COMPLAINT_SENT or ACKNOWLEDGED
  const activeComplaints = await prisma.complaint.findMany({
    include: {
      report: {
        include: {
          lake: true,
        },
      },
      escalations: {
        orderBy: { level: 'desc' },
      },
    },
    where: {
      report: {
        status: {
          in: ['COMPLAINT_SENT', 'ACKNOWLEDGED'],
        },
      },
    },
  });

  const details: SLACheckResult['details'] = [];
  let escalationsCreated = 0;

  for (const complaint of activeComplaints) {
    const reportStatus = complaint.report.status;
    const sentAt = new Date(complaint.sentAt);
    const highestLevel = complaint.escalations.length > 0 ? complaint.escalations[0].level : 0;

    let shouldEscalateToLevel = 0;
    let escalationReason = '';
    let newPriority: 'HIGH' | 'CRITICAL' = 'HIGH';

    // Condition 1: Level 3 escalation (> 21 days unresolved with no progress)
    if (highestLevel < 3 && sentAt < twentyOneDaysAgo) {
      shouldEscalateToLevel = 3;
      escalationReason = `STATUTORY BREACH (>21 days without substantive field remediation). Escalated to Member Secretary, KSPCB.`;
      newPriority = 'CRITICAL';
    }
    // Condition 2: Level 2 escalation (> 14 days and not in progress)
    else if (highestLevel < 2 && sentAt < fourteenDaysAgo && reportStatus !== 'IN_PROGRESS') {
      shouldEscalateToLevel = 2;
      escalationReason = `SLA BREACH (>14 days without initiation of field work). Escalated to Zonal Joint Commissioner, BBMP.`;
      newPriority = 'HIGH';
    }
    // Condition 3: Level 1 escalation (> 7 days and not acknowledged)
    else if (highestLevel < 1 && sentAt < sevenDaysAgo && reportStatus === 'COMPLAINT_SENT') {
      shouldEscalateToLevel = 1;
      escalationReason = `SLA BREACH (>7 days without formal ward acknowledgment). Escalated to Ward Executive Engineer.`;
      newPriority = 'HIGH';
    }

    if (shouldEscalateToLevel > 0) {
      // Create escalation record
      await prisma.escalation.create({
        data: {
          complaintId: complaint.id,
          level: shouldEscalateToLevel,
          reason: escalationReason,
          createdAt: new Date(),
        },
      });

      // Insert StatusEvent audit log
      await prisma.statusEvent.create({
        data: {
          complaintId: complaint.id,
          reportId: complaint.report.id,
          fromStatus: reportStatus,
          toStatus: reportStatus,
          actor: 'System SLA Monitor (Cron)',
          note: `[ESCALATION LEVEL ${shouldEscalateToLevel}] ${escalationReason}`,
          timestamp: new Date(),
        },
      });

      // Update complaint priority and regenerate complaint letter with escalation history
      await sendOrQueueComplaint(complaint.report.id, newPriority);

      escalationsCreated++;
      details.push({
        trackingId: complaint.trackingId,
        lakeName: complaint.report.lake.name,
        level: shouldEscalateToLevel,
        reason: escalationReason,
      });
    }
  }

  return {
    breachesDetected: details.length,
    escalationsCreated,
    details,
  };
}
