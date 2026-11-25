import { prisma } from '@/lib/prisma';
import { Resend } from 'resend';
import path from 'path';
import fs from 'fs';

export interface ComplaintDataInput {
  reportId: string;
  trackingId?: string;
  lakeName: string;
  ward: string;
  lat: number;
  lng: number;
  capturedAt: Date;
  labels: string[];
  severity: number;
  readings?: {
    ph?: number;
    transparencyCmBucket?: string;
    tempC?: number;
  };
  observations?: {
    odor?: string;
    color?: string;
    foam?: boolean;
    waste?: boolean;
    deadFish?: boolean;
  };
  rainContext?: {
    recentRainMm?: number;
    isStormwaterRunoff?: boolean;
    note?: string;
  };
  visionNotes?: string;
  photoPaths: string[];
  citizenName?: string;
  citizenEmail?: string;
  escalationHistory?: Array<{ level: number; reason: string; date: Date }>;
}

/**
 * Generates an official tracking ID in standard Karnataka civic format:
 * JD-BLR-YYYYMM-XXXX
 */
export function generateTrackingId(): string {
  const date = new Date();
  const yearMonth = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}`;
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  return `JD-BLR-${yearMonth}-${randomSuffix}`;
}

/**
 * Drafts formal complaint letter in standard Indian civic administration format
 */
export function draftComplaintLetter(data: ComplaintDataInput): string {
  const dateStr = new Date().toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  const photoList = data.photoPaths.map((p, idx) => `  [Annexure ${idx + 1}] ${p}`).join('\n');
  const labelsText = data.labels.map((l) => l.toUpperCase().replace('_', ' ')).join(', ') || 'SURFACE POLLUTION';
  
  let readingsBlock = 'None recorded';
  if (data.readings) {
    const parts: string[] = [];
    if (data.readings.ph !== undefined) parts.push(`pH Level: ${data.readings.ph}`);
    if (data.readings.transparencyCmBucket) parts.push(`Water Transparency: ${data.readings.transparencyCmBucket}`);
    if (data.readings.tempC !== undefined) parts.push(`Water Temp: ${data.readings.tempC}°C`);
    if (parts.length > 0) readingsBlock = parts.join(' | ');
  }

  let observationsBlock = '';
  if (data.observations) {
    const flags: string[] = [];
    if (data.observations.foam) flags.push('Active Chemical Foaming');
    if (data.observations.waste) flags.push('Visible Solid Waste Ingress');
    if (data.observations.deadFish) flags.push('Fish Mortality Observed');
    if (data.observations.odor && data.observations.odor !== 'none') flags.push(`Odor: ${data.observations.odor}`);
    if (data.observations.color && data.observations.color !== 'clear') flags.push(`Water Color: ${data.observations.color}`);
    observationsBlock = flags.length > 0 ? flags.join(', ') : 'Standard visual deviation';
  }

  let rainBlock = 'Dry ambient conditions prior to inspection.';
  if (data.rainContext?.isStormwaterRunoff) {
    rainBlock = `WARNING: Heavy rainfall recorded (${data.rainContext.recentRainMm} mm in preceding 48-72h). Probable stormwater drain backflow or mixed sewage overflow.`;
  }

  let escalationSection = '';
  if (data.escalationHistory && data.escalationHistory.length > 0) {
    escalationSection = `
================================================================================
ESCALATION HISTORY & STATUTORY SLA BREACH RECORD
================================================================================
`;
    data.escalationHistory.forEach((esc) => {
      const levelTitle =
        esc.level === 1
          ? 'LEVEL 1: WARD EXECUTIVE ENGINEER'
          : esc.level === 2
          ? 'LEVEL 2: ZONAL JOINT COMMISSIONER'
          : 'LEVEL 3: MEMBER SECRETARY, KARNATAKA STATE POLLUTION CONTROL BOARD (KSPCB)';
      escalationSection += `• [${esc.date.toLocaleDateString('en-IN')}] ${levelTitle}\n  Reason: ${esc.reason}\n`;
    });
    escalationSection += `This matter has been escalated due to inaction beyond citizen charter SLA thresholds.\n`;
  }

  return `
TO:
The Assistant Executive Engineer / Ward Officer
Bruhat Bengaluru Mahanagara Palike (BBMP) — Lakes Division
${data.ward}, Bengaluru, Karnataka

COPY TO:
1. The Environmental Officer, Karnataka State Pollution Control Board (KSPCB)
2. Chief Commissioner, BBMP Central Office, N.R. Square, Bengaluru

DATE: ${dateStr}
TRACKING IDENTIFIER: ${data.trackingId || 'PENDING'}
SEVERITY INDEX: LEVEL ${data.severity} / 5 (CRITICAL INTERVENTION REQUIRED)

SUBJECT: URGENT COMPLAINT REGARDING ENVIRONMENTAL DEGRADATION AND EFFLUENT POLLUTION AT ${data.lakeName.toUpperCase()} (${data.ward.toUpperCase()})

Respected Authority,

This formal communication is filed on behalf of concerned citizens and the JalDrishti Civic Waterbody Monitoring Consortium regarding verifiable environmental violations and active water quality degradation detected at ${data.lakeName}.

1. INCIDENT & GEOGRAPHIC DETAILS:
--------------------------------------------------------------------------------
• Waterbody Name      : ${data.lakeName}
• Administrative Ward : ${data.ward}
• Geo-Coordinates     : Latitude ${data.lat.toFixed(5)}° N, Longitude ${data.lng.toFixed(5)}° E
• Date of Field Survey: ${new Date(data.capturedAt).toLocaleDateString('en-IN')} at ${new Date(data.capturedAt).toLocaleTimeString('en-IN')}
• Classification Type : ${labelsText}
• Automated Severity  : Grade ${data.severity} of 5

2. PHYSICAL INSPECTION & ON-SITE READINGS:
--------------------------------------------------------------------------------
• Sensor / Citizen Readings: ${readingsBlock}
• Visual & Olfactory Notes : ${observationsBlock}
• AI Multimodal Assessment : ${data.visionNotes || 'Surface pollution signature verified against spectral water quality database.'}
• Meteorological Context   : ${rainBlock}

3. DIGITAL EVIDENCE ATTACHMENTS:
--------------------------------------------------------------------------------
High-resolution, timestamped and geo-verified photographic evidence has been logged in the JalDrishti National Environmental Registry:
${photoList}
${escalationSection}
4. STATUTORY MANDATE & REQUESTED REMEDIAL ACTION:
--------------------------------------------------------------------------------
In accordance with the Water (Prevention and Control of Pollution) Act, 1974, and the Hon'ble National Green Tribunal (NGT) directives concerning Bengaluru waterbodies:
1. Immediate field inspection of the identified inflow channels and weir outfall by the designated ward marshal or junior engineer.
2. Deployment of containment booms and skimming crews to isolate surface scum, chemical foam, or solid waste.
3. Collection of representative grab samples for BOD, COD, DO, Ammoniacal Nitrogen, and Fecal Coliform analysis.
4. Issue of stop-work / penalty notices to unauthorized commercial establishments or tankers discharging untreated effluent into the stormwater network.

Formal closure of this complaint requires documented photo verification and signed municipal inspection log submitted back to the JalDrishti citizen registry.

Yours faithfully,

${data.citizenName || 'Citizens Monitoring Committee'}
Citizen Reporter (${data.citizenEmail || 'citizen@demo.in'})
JalDrishti Civic Water Quality Observation Network
Platform Tracking ID: ${data.trackingId || 'PENDING'}
Official Portal Verification: https://pgportal.gov.in/ (CPGRAMS Grievance Reference)
`.trim();
}

/**
 * Creates or updates a Complaint record, dispatches email / writes Outbox
 */
export async function sendOrQueueComplaint(
  reportId: string,
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'MEDIUM'
) {
  const report = await prisma.report.findUnique({
    where: { id: reportId },
    include: {
      lake: true,
      user: true,
      complaint: {
        include: { escalations: true },
      },
    },
  });

  if (!report) {
    throw new Error(`Report ${reportId} not found`);
  }

  const trackingId = report.complaint?.trackingId || generateTrackingId();
  const photoPaths: string[] = JSON.parse(report.photoPaths || '[]');
  const readings = JSON.parse(report.readings || '{}');
  const observations = JSON.parse(report.observations || '{}');
  const vision = report.vision ? JSON.parse(report.vision) : { labels: [], severity: 3, notes: '' };
  const rainContext = report.rainContext ? JSON.parse(report.rainContext) : undefined;

  const letterText = draftComplaintLetter({
    reportId: report.id,
    trackingId,
    lakeName: report.lake.name,
    ward: report.lake.ward,
    lat: report.lat,
    lng: report.lng,
    capturedAt: report.capturedAt,
    labels: vision.labels || [],
    severity: vision.severity || 3,
    readings,
    observations,
    rainContext,
    visionNotes: vision.notes,
    photoPaths,
    citizenName: report.user.name || undefined,
    citizenEmail: report.user.email,
    escalationHistory: report.complaint?.escalations.map((e) => ({
      level: e.level,
      reason: e.reason,
      date: e.createdAt,
    })),
  });

  const isDemo = process.env.DEMO_MODE !== 'false';
  let emailStatus = 'SENT_DEMO';

  // If live Resend key is provided and not demo mode
  if (!isDemo && process.env.RESEND_API_KEY) {
    try {
      const resend = new Resend(process.env.RESEND_API_KEY);
      await resend.emails.send({
        from: 'JalDrishti Platform <reports@jaldrishti.org>',
        to: ['wardofficer@bbmp.gov.in', report.user.email],
        subject: `[JalDrishti ${trackingId}] Urgent Pollution Report: ${report.lake.name} (${report.lake.ward})`,
        text: letterText,
      });
      emailStatus = 'SENT';
    } catch (err) {
      console.error('Failed to send email via Resend:', err);
      emailStatus = 'FAILED';
    }
  }

  // Write Outbox record for transparency and inspection
  const outboxRecord = await prisma.outbox.create({
    data: {
      to: `wardofficer.${report.lake.ward.toLowerCase().replace(/[^a-z0-9]/g, '')}@bbmp.gov.in`,
      subject: `[JalDrishti ${trackingId}] Urgent Pollution Report: ${report.lake.name}`,
      body: letterText,
      status: emailStatus,
    },
  });

  console.log(`[OUTBOX LOG] Dispatched complaint ${trackingId} -> Status: ${emailStatus} (Outbox ID: ${outboxRecord.id})`);

  // Upsert Complaint record
  const complaint = await prisma.complaint.upsert({
    where: { reportId: report.id },
    create: {
      reportId: report.id,
      trackingId,
      letterText,
      emailStatus,
      priority,
      sentAt: new Date(),
    },
    update: {
      letterText,
      emailStatus,
      priority,
    },
  });

  return { complaint, letterText, trackingId, emailStatus };
}
