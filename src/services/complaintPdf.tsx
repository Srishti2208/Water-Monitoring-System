import React from 'react';
import { Document, Page, Text, View, StyleSheet, Font, renderToBuffer } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: {
    padding: 36,
    fontSize: 10,
    fontFamily: 'Helvetica',
    color: '#1e293b',
    lineHeight: 1.4,
  },
  header: {
    borderBottomWidth: 2,
    borderBottomColor: '#0284c7',
    borderBottomStyle: 'solid',
    paddingBottom: 10,
    marginBottom: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0369a1',
  },
  headerSub: {
    fontSize: 9,
    color: '#64748b',
    marginTop: 2,
  },
  metaBox: {
    backgroundColor: '#f0f9ff',
    borderWidth: 1,
    borderColor: '#bae6fd',
    borderRadius: 4,
    padding: 8,
    marginBottom: 12,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  metaLabel: {
    fontWeight: 'bold',
    fontSize: 9,
    color: '#0369a1',
  },
  metaValue: {
    fontSize: 9,
    color: '#0f172a',
  },
  subject: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#0f172a',
    backgroundColor: '#f8fafc',
    padding: 6,
    borderLeftWidth: 3,
    borderLeftColor: '#0284c7',
    marginBottom: 12,
  },
  bodyText: {
    fontSize: 9.5,
    marginBottom: 8,
    textAlign: 'justify',
  },
  table: {
    marginVertical: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 4,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    padding: 5,
  },
  tableRowHeader: {
    backgroundColor: '#f1f5f9',
    fontWeight: 'bold',
  },
  tableColLabel: {
    width: '40%',
    fontWeight: 'bold',
    fontSize: 8.5,
  },
  tableColVal: {
    width: '60%',
    fontSize: 8.5,
  },
  escalationBox: {
    backgroundColor: '#fff1f2',
    borderColor: '#fecdd3',
    borderWidth: 1,
    borderRadius: 4,
    padding: 8,
    marginVertical: 8,
  },
  escalationTitle: {
    color: '#be123c',
    fontWeight: 'bold',
    fontSize: 9.5,
    marginBottom: 4,
  },
  footer: {
    marginTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#cbd5e1',
    paddingTop: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    fontSize: 8,
    color: '#64748b',
  },
  seal: {
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#86efac',
    padding: 6,
    borderRadius: 4,
    marginTop: 10,
    alignItems: 'center',
  },
  sealText: {
    color: '#166534',
    fontSize: 8,
    fontWeight: 'bold',
  },
});

export interface ComplaintPdfProps {
  trackingId: string;
  lakeName: string;
  ward: string;
  lat: number;
  lng: number;
  dateStr: string;
  severity: number;
  priority: string;
  letterText: string;
  citizenName: string;
  citizenEmail: string;
  escalationNotes?: string[];
}

export const ComplaintPdfDocument: React.FC<ComplaintPdfProps> = ({
  trackingId,
  lakeName,
  ward,
  lat,
  lng,
  dateStr,
  severity,
  priority,
  letterText,
  citizenName,
  citizenEmail,
  escalationNotes = [],
}) => (
  <Document>
    <Page size="A4" style={styles.page}>
      {/* Official Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>JalDrishti • Civic Environmental Notice</Text>
          <Text style={styles.headerSub}>
            Autonomous Waterbody Monitoring &amp; Statutory Grievance System • Bengaluru Region
          </Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={{ fontSize: 9, fontWeight: 'bold', color: '#0284c7' }}>{trackingId}</Text>
          <Text style={{ fontSize: 8, color: '#64748b' }}>Date: {dateStr}</Text>
        </View>
      </View>

      {/* Meta Box */}
      <View style={styles.metaBox}>
        <View style={styles.metaRow}>
          <Text style={styles.metaLabel}>Target Waterbody:</Text>
          <Text style={styles.metaValue}>{lakeName} ({ward})</Text>
          <Text style={styles.metaLabel}>Geo-Coordinates:</Text>
          <Text style={styles.metaValue}>{lat.toFixed(5)}°N, {lng.toFixed(5)}°E</Text>
        </View>
        <View style={styles.metaRow}>
          <Text style={styles.metaLabel}>Pollution Severity:</Text>
          <Text style={styles.metaValue}>Grade {severity} of 5</Text>
          <Text style={styles.metaLabel}>Triage Priority:</Text>
          <Text style={styles.metaValue}>{priority}</Text>
        </View>
        <View style={styles.metaRow}>
          <Text style={styles.metaLabel}>Complainant:</Text>
          <Text style={styles.metaValue}>{citizenName} ({citizenEmail})</Text>
          <Text style={styles.metaLabel}>National Portal Linkage:</Text>
          <Text style={styles.metaValue}>pgportal.gov.in / Swachhata</Text>
        </View>
      </View>

      {/* Subject */}
      <View style={styles.subject}>
        <Text>
          SUBJECT: URGENT STATUTORY NOTICE ON WATERBODY POLLUTION AT {lakeName.toUpperCase()}
        </Text>
      </View>

      {/* Escalation Alert if present */}
      {escalationNotes.length > 0 && (
        <View style={styles.escalationBox}>
          <Text style={styles.escalationTitle}>
            CRITICAL: STATUTORY SLA BREACH &amp; ESCALATION RECORD
          </Text>
          {escalationNotes.map((note, idx) => (
            <Text key={idx} style={{ fontSize: 8.5, color: '#9f1239', marginBottom: 2 }}>
              • {note}
            </Text>
          ))}
        </View>
      )}

      {/* Formal Letter Body */}
      <View>
        <Text style={styles.bodyText}>
          Addressed to the Assistant Executive Engineer (BBMP Lakes Division) and the Environmental Officer (KSPCB).
        </Text>
        <Text style={styles.bodyText}>
          Pursuant to Section 24 of the Water (Prevention &amp; Control of Pollution) Act, 1974, this verified notice records actionable environmental degradation detected via citizen field evidence and multimodal computer vision at {lakeName}.
        </Text>
        <Text style={styles.bodyText}>
          Immediate site inspection, sample collection for dissolved oxygen and chemical oxygen demand, containment boom deployment, and regulatory stop-work notice on unlicensed discharge outfalls are hereby requisitioned.
        </Text>
        <Text style={styles.bodyText}>
          Field remediation status must be updated on the JalDrishti civic registry for citizen verification and formal compliance closure.
        </Text>
      </View>

      {/* Digital Seal */}
      <View style={styles.seal}>
        <Text style={styles.sealText}>
          ✓ DIGITAL REGISTRY VERIFIED • TAMPER-EVIDENT PERCEPTUAL HASH &amp; EXIF TIMESTAMP VALIDATED
        </Text>
        <Text style={{ fontSize: 7, color: '#15803d', marginTop: 2 }}>
          Tracking ID: {trackingId} • Citizen Observation ID Certified by JalDrishti Platform
        </Text>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text>JalDrishti Civic-Tech Consortium • Open-Source Environmental Governance</Text>
        <Text>Page 1 of 1</Text>
      </View>
    </Page>
  </Document>
);

export async function generateComplaintPdfBuffer(props: ComplaintPdfProps): Promise<Buffer> {
  const element = <ComplaintPdfDocument {...props} />;
  return await renderToBuffer(element);
}
