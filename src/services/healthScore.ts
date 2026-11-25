export interface ReportForHealthCalc {
  severity: number;
  capturedAt: Date;
  readings?: {
    ph?: number;
    transparencyCmBucket?: string;
    tempC?: number;
  };
  trust?: {
    duplicateOfId?: string | null;
    exifVerified?: boolean;
    communityVerified?: boolean;
  };
}

/**
 * Calculates Lake Health Score based on 90-day reports:
 * score = round(100 - min(100, 8 * SUM(severity_i * exp(-ageDays_i / 14))))
 * Modifiers: pH < 6 or > 9 subtracts 5, transparency < 30cm subtracts 5
 */
export function calculateLakeHealthScore(
  reports: ReportForHealthCalc[],
  referenceDate: Date = new Date()
): number {
  const ninetyDaysAgo = new Date(referenceDate.getTime() - 90 * 24 * 60 * 60 * 1000);

  // Filter valid reports in the last 90 days, excluding duplicates
  const eligibleReports = reports.filter((r) => {
    if (r.trust?.duplicateOfId) return false;
    const reportDate = new Date(r.capturedAt);
    return reportDate >= ninetyDaysAgo && reportDate <= referenceDate;
  });

  if (eligibleReports.length === 0) {
    return 85; // Clean baseline if no pollution reported
  }

  let weightedPollutionSum = 0;
  let hasAbnormalPh = false;
  let hasLowTransparency = false;

  for (const r of eligibleReports) {
    const ageMs = referenceDate.getTime() - new Date(r.capturedAt).getTime();
    const ageDays = Math.max(0, ageMs / (1000 * 60 * 60 * 24));
    
    // Severity decay factor: exp(-ageDays / 14)
    const decay = Math.exp(-ageDays / 14);
    const severity = Math.max(1, Math.min(5, r.severity || 1));
    weightedPollutionSum += severity * decay;

    // Check recent modifiers (within last 30 days)
    if (ageDays <= 30 && r.readings) {
      if (r.readings.ph !== undefined && (r.readings.ph < 6 || r.readings.ph > 9)) {
        hasAbnormalPh = true;
      }
      if (r.readings.transparencyCmBucket === '<30cm') {
        hasLowTransparency = true;
      }
    }
  }

  const basePenalty = Math.min(100, 8 * weightedPollutionSum);
  let score = 100 - basePenalty;

  // Modifiers
  if (hasAbnormalPh) score -= 5;
  if (hasLowTransparency) score -= 5;

  // Clamp 0 to 100
  return Math.round(Math.max(0, Math.min(100, score)));
}

/**
 * Returns color category based on health score:
 * 0-40: red (critical)
 * 40-70: amber (moderate)
 * 70-100: green (good)
 */
export function getHealthBand(score: number): {
  color: string;
  badgeClass: string;
  label: string;
  textClass: string;
  borderClass: string;
} {
  if (score < 40) {
    return {
      color: '#ef4444',
      badgeClass: 'bg-red-100 text-red-800 border-red-300 dark:bg-red-950/50 dark:text-red-300 dark:border-red-800',
      textClass: 'text-red-600 dark:text-red-400',
      borderClass: 'border-red-500',
      label: 'Critical / Severely Degraded',
    };
  }
  if (score < 70) {
    return {
      color: '#f59e0b',
      badgeClass: 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800',
      textClass: 'text-amber-600 dark:text-amber-400',
      borderClass: 'border-amber-500',
      label: 'Moderate / Caution',
    };
  }
  return {
    color: '#10b981',
    badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800',
    textClass: 'text-emerald-600 dark:text-emerald-400',
    borderClass: 'border-emerald-500',
    label: 'Good / Clean',
  };
}

/**
 * Trend arrow classification based on 7-day score delta:
 * > +2: IMPROVING
 * < -2: DECLINING
 * otherwise: STABLE
 */
export function calculateTrend(currentScore: number, score7DaysAgo: number): 'IMPROVING' | 'DECLINING' | 'STABLE' {
  const delta = currentScore - score7DaysAgo;
  if (delta > 2) return 'IMPROVING';
  if (delta < -2) return 'DECLINING';
  return 'STABLE';
}
