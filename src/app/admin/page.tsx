import React from 'react';
import { prisma } from '@/lib/prisma';
import { AdminClientView } from './AdminClientView';

export const revalidate = 0;

export default async function AdminPage() {
  const [lakesCount, reportsCount, complaintsCount, escalationsCount, outboxRecords] = await Promise.all([
    prisma.lake.count(),
    prisma.report.count(),
    prisma.complaint.count(),
    prisma.escalation.count(),
    prisma.outbox.findMany({
      orderBy: { createdAt: 'desc' },
      take: 25,
    }),
  ]);

  return (
    <AdminClientView
      stats={{
        lakesCount,
        reportsCount,
        complaintsCount,
        escalationsCount,
      }}
      initialOutbox={JSON.parse(JSON.stringify(outboxRecords))}
    />
  );
}
