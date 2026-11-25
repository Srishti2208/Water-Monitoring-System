import React from 'react';
import { prisma } from '@/lib/prisma';
import { OfficialDashboardClient } from './OfficialDashboardClient';

export const revalidate = 0;

export default async function OfficialPage() {
  const [complaints, lakes, reports, breaches] = await Promise.all([
    prisma.complaint.findMany({
      include: {
        report: {
          include: {
            lake: true,
            user: true,
            statusEvents: { orderBy: { timestamp: 'desc' } },
          },
        },
        escalations: { orderBy: { level: 'desc' } },
      },
      orderBy: { sentAt: 'desc' },
    }),
    prisma.lake.findMany({
      orderBy: { currentHealthScore: 'asc' },
    }),
    prisma.report.findMany({
      include: { lake: true },
    }),
    prisma.escalation.findMany({
      include: {
        complaint: {
          include: {
            report: {
              include: { lake: true, user: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    }),
  ]);

  return (
    <OfficialDashboardClient
      initialComplaints={JSON.parse(JSON.stringify(complaints))}
      lakes={JSON.parse(JSON.stringify(lakes))}
      initialBreaches={JSON.parse(JSON.stringify(breaches))}
      reports={JSON.parse(JSON.stringify(reports))}
    />
  );
}
