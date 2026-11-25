import React from 'react';
import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { ComplaintViewClient } from './ComplaintViewClient';

export const revalidate = 0;

export default async function ComplaintPage({ params }: { params: { id: string } }) {
  const identifier = params.id;

  const complaint = await prisma.complaint.findFirst({
    where: {
      OR: [
        { id: identifier },
        { trackingId: identifier },
        { reportId: identifier },
      ],
    },
    include: {
      report: {
        include: {
          lake: true,
          user: true,
          statusEvents: {
            orderBy: { timestamp: 'asc' },
          },
        },
      },
      escalations: {
        orderBy: { level: 'asc' },
      },
    },
  });

  if (!complaint) {
    notFound();
  }

  return <ComplaintViewClient complaint={JSON.parse(JSON.stringify(complaint))} />;
}
