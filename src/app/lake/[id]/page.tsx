import React from 'react';
import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { LakeDetailClient } from './LakeDetailClient';

export const revalidate = 0;

export default async function LakePage({ params }: { params: { id: string } }) {
  const lake = await prisma.lake.findUnique({
    where: { id: params.id },
    include: {
      reports: {
        include: {
          complaint: true,
          user: {
            select: { name: true, email: true },
          },
        },
        orderBy: { capturedAt: 'desc' },
      },
      snapshots: {
        orderBy: { date: 'asc' },
        take: 90,
      },
      subscriptions: true,
    },
  });

  if (!lake) {
    notFound();
  }

  return (
    <LakeDetailClient
      lake={JSON.parse(JSON.stringify(lake))}
      initialReports={JSON.parse(JSON.stringify(lake.reports))}
      snapshots={JSON.parse(JSON.stringify(lake.snapshots))}
    />
  );
}
