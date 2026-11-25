import React from 'react';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import { MyReportsClient } from './MyReportsClient';

export const revalidate = 0;

export default async function MyReportsPage() {
  const session = await auth();
  const email = session?.user?.email || 'citizen@demo.in';

  const user = await prisma.user.findUnique({
    where: { email },
    include: {
      reports: {
        include: {
          lake: true,
          complaint: true,
          statusEvents: {
            orderBy: { timestamp: 'desc' },
          },
        },
        orderBy: { capturedAt: 'desc' },
      },
      subscriptions: {
        include: { lake: true },
      },
    },
  });

  // If user has no reports, load demo reports so judges see data immediately
  const reports = user?.reports && user.reports.length > 0
    ? user.reports
    : await prisma.report.findMany({
        include: {
          lake: true,
          complaint: true,
          statusEvents: {
            orderBy: { timestamp: 'desc' },
          },
        },
        orderBy: { capturedAt: 'desc' },
        take: 10,
      });

  return (
    <MyReportsClient
      reports={JSON.parse(JSON.stringify(reports))}
      currentUserEmail={email}
    />
  );
}
