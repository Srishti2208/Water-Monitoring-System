'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  FileText,
  Clock,
  ShieldCheck,
  CheckCircle,
  RotateCcw,
  PlusCircle,
  ExternalLink,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

interface MyReportsClientProps {
  reports: any[];
  currentUserEmail: string;
}

export function MyReportsClient({ reports: initialReports, currentUserEmail }: MyReportsClientProps) {
  const [reports, setReports] = useState(initialReports);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const handleCitizenAction = async (reportId: string, toStatus: 'CITIZEN_VERIFIED' | 'REOPENED') => {
    setProcessingId(reportId);
    try {
      const note =
        toStatus === 'CITIZEN_VERIFIED'
          ? 'Site re-inspected by citizen: Remediation confirmed. Water clarity restored.'
          : 'Citizen inspection shows persistent pollution. Reopening complaint.';

      const res = await fetch('/api/transitions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reportId,
          toStatus,
          note,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setReports((prev) =>
          prev.map((r) => (r.id === reportId ? { ...r, status: toStatus } : r))
        );
      }
    } catch (e) {
      console.error(e);
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="container max-w-5xl py-8 px-4 space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            My Environmental Reports
          </h1>
          <p className="text-xs text-slate-500">
            Authenticated Citizen: <span className="font-mono font-bold text-slate-700">{currentUserEmail}</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/report">
            <Button variant="civic" size="sm" className="flex items-center gap-1.5 text-xs">
              <PlusCircle className="h-4 w-4" /> New Lake Report
            </Button>
          </Link>
          <Link href="/leaderboard">
            <Button variant="outline" size="sm" className="flex items-center gap-1.5 text-xs">
              <TrendingUp className="h-4 w-4 text-teal-600" /> Leaderboard
            </Button>
          </Link>
        </div>
      </div>

      {reports.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-sm text-slate-500 mb-4">You have not submitted any lake reports yet.</p>
          <Link href="/report">
            <Button variant="civic">Submit Your First Field Report</Button>
          </Link>
        </Card>
      ) : (
        <div className="space-y-4">
          {reports.map((report) => {
            const photos = JSON.parse(report.photoPaths || '[]');
            const vision = report.vision ? JSON.parse(report.vision) : { severity: 3, labels: [] };
            const trust = JSON.parse(report.trust || '{}');
            const photoSrc = photos[0] || '/demo-images/solid_waste.jpg';
            const isClaimedResolved = report.status === 'RESOLVED_CLAIMED';

            return (
              <Card key={report.id} className="overflow-hidden shadow-xs hover:border-slate-300 transition-colors">
                <div className="p-4 sm:p-5 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                  <div className="flex gap-4 items-start">
                    <img
                      src={photoSrc}
                      alt="Incident Evidence"
                      className="w-24 h-24 sm:w-28 sm:h-28 object-cover rounded-lg border shrink-0 bg-slate-100"
                    />
                    <div className="space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-bold text-base text-slate-900">
                          {report.lake?.name || 'Lake Spot'}
                        </h3>
                        <Badge
                          variant={
                            report.status === 'CLOSED' || report.status === 'CITIZEN_VERIFIED'
                              ? 'success'
                              : report.status === 'RESOLVED_CLAIMED'
                              ? 'warning'
                              : 'secondary'
                          }
                          className="text-[11px] font-mono"
                        >
                          {report.status}
                        </Badge>
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            vision.severity >= 4
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          Severity {vision.severity}/5
                        </span>
                        {trust.exifVerified ? (
                          <Badge variant="verified" className="text-[10px]">
                            EXIF Verified
                          </Badge>
                        ) : (
                          <Badge variant="unverified" className="text-[10px]">
                            UNVERIFIED
                          </Badge>
                        )}
                      </div>

                      <p className="text-xs text-slate-600 line-clamp-2 max-w-xl">
                        {vision.notes || 'Pollution report logged and active in statutory pipeline.'}
                      </p>

                      <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400">
                        <span>Captured: {new Date(report.capturedAt).toLocaleDateString('en-IN')}</span>
                        {report.complaint && (
                          <span className="font-mono text-sky-700 font-semibold">
                            Tracking: {report.complaint.trackingId}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions Column */}
                  <div className="flex flex-col sm:flex-row md:flex-col items-end gap-2 w-full md:w-auto shrink-0 pt-2 md:pt-0 border-t md:border-t-0">
                    {report.complaint && (
                      <Link href={`/complaint/${report.complaint.trackingId}`} className="w-full sm:w-auto">
                        <Button variant="outline" size="sm" className="w-full text-xs">
                          <FileText className="h-3.5 w-3.5 mr-1.5 text-sky-600" />
                          View Complaint &amp; PDF
                        </Button>
                      </Link>
                    )}

                    {/* Citizen Verification Action if Official claimed resolved */}
                    {isClaimedResolved && (
                      <div className="flex items-center gap-2 w-full sm:w-auto">
                        <Button
                          variant="civic"
                          size="sm"
                          disabled={processingId === report.id}
                          onClick={() => handleCitizenAction(report.id, 'CITIZEN_VERIFIED')}
                          className="text-xs flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700"
                        >
                          <CheckCircle className="h-3.5 w-3.5" /> Verify Remediation
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          disabled={processingId === report.id}
                          onClick={() => handleCitizenAction(report.id, 'REOPENED')}
                          className="text-xs flex items-center gap-1"
                        >
                          <RotateCcw className="h-3.5 w-3.5" /> Reopen
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
