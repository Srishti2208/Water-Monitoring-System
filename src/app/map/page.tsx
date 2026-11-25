import React from 'react';
import { prisma } from '@/lib/prisma';
import { MapClientView } from './MapClientView';

export const revalidate = 0; // Dynamic rendering

export default async function MapPage() {
  const [lakes, reports] = await Promise.all([
    prisma.lake.findMany({
      orderBy: { currentHealthScore: 'asc' }, // worst first in sidebar
    }),
    prisma.report.findMany({
      include: {
        lake: true,
        complaint: true,
      },
      orderBy: { capturedAt: 'desc' },
      take: 200,
    }),
  ]);

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-4rem)] overflow-hidden">
      <MapClientView
        initialLakes={JSON.parse(JSON.stringify(lakes))}
        initialReports={JSON.parse(JSON.stringify(reports))}
      />
    </div>
  );
}
