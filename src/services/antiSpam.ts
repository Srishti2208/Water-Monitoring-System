import { prisma } from '@/lib/prisma';
import { hammingDistance, calculateDistanceMeters } from './dhash';

export interface TrustEvaluationInput {
  userId: string;
  lat: number;
  lng: number;
  capturedAt: Date;
  uploadedAt: Date;
  hasExifGps: boolean;
  hasExifTimestamp: boolean;
  dHash?: string;
}

export interface TrustEvaluationResult {
  exifVerified: boolean;
  communityVerified: boolean;
  duplicateOfId: string | null;
  severityBonus: number; // +1 if communityVerified (cap 5 in caller)
  rateLimitExceeded: boolean;
  reason?: string;
}

/**
 * Evaluates anti-spam, duplicate hashing, EXIF validation, and community cross-validation.
 */
export async function evaluateReportTrust(
  input: TrustEvaluationInput
): Promise<TrustEvaluationResult> {
  const {
    userId,
    lat,
    lng,
    capturedAt,
    uploadedAt,
    hasExifGps,
    hasExifTimestamp,
    dHash,
  } = input;

  // 1. Rate limit: Max 5 reports per user per day
  const startOfDay = new Date(uploadedAt);
  startOfDay.setHours(0, 0, 0, 0);

  const reportsToday = await prisma.report.count({
    where: {
      userId,
      uploadedAt: {
        gte: startOfDay,
      },
    },
  });

  if (reportsToday >= 5) {
    return {
      exifVerified: false,
      communityVerified: false,
      duplicateOfId: null,
      severityBonus: 0,
      rateLimitExceeded: true,
      reason: 'Rate limit exceeded: Maximum 5 submissions per citizen per 24-hour cycle.',
    };
  }

  // 2. EXIF Check: missing GPS/timestamp or capture-time skew > 15 minutes from upload
  let exifVerified = true;
  if (!hasExifGps || !hasExifTimestamp) {
    exifVerified = false;
  } else {
    const skewMinutes = Math.abs(uploadedAt.getTime() - capturedAt.getTime()) / (1000 * 60);
    if (skewMinutes > 15) {
      exifVerified = false;
    }
  }

  // 3. dHash duplicate check:
  // Hamming distance <= 8 vs any report within 500m in the last 7 days -> mark duplicate
  let duplicateOfId: string | null = null;
  const sevenDaysAgo = new Date(uploadedAt.getTime() - 7 * 24 * 60 * 60 * 1000);

  if (dHash) {
    // Find candidate reports in last 7 days
    const recentReports = await prisma.report.findMany({
      where: {
        uploadedAt: {
          gte: sevenDaysAgo,
        },
        dHash: {
          not: null,
        },
      },
      select: {
        id: true,
        lat: true,
        lng: true,
        dHash: true,
      },
    });

    for (const other of recentReports) {
      if (!other.dHash) continue;
      const distance = calculateDistanceMeters(lat, lng, other.lat, other.lng);
      if (distance <= 500) {
        const hDist = hammingDistance(dHash, other.dHash);
        if (hDist <= 8) {
          duplicateOfId = other.id;
          break;
        }
      }
    }
  }

  // 4. Community cross-validation:
  // >= 2 distinct users reporting within 250m and 48h -> communityVerified = true
  const fortyEightHoursAgo = new Date(uploadedAt.getTime() - 48 * 60 * 60 * 1000);
  const clusterReports = await prisma.report.findMany({
    where: {
      uploadedAt: {
        gte: fortyEightHoursAgo,
      },
      status: {
        notIn: ['REJECTED'],
      },
    },
    select: {
      userId: true,
      lat: true,
      lng: true,
    },
  });

  const distinctUsersInProximity = new Set<string>();
  distinctUsersInProximity.add(userId);

  for (const item of clusterReports) {
    if (item.userId !== userId) {
      const distance = calculateDistanceMeters(lat, lng, item.lat, item.lng);
      if (distance <= 250) {
        distinctUsersInProximity.add(item.userId);
      }
    }
  }

  const communityVerified = distinctUsersInProximity.size >= 2;
  const severityBonus = communityVerified ? 1 : 0;

  return {
    exifVerified,
    communityVerified,
    duplicateOfId,
    severityBonus,
    rateLimitExceeded: false,
  };
}
