'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Download,
  Copy,
  Check,
  ExternalLink,
  ShieldCheck,
  AlertTriangle,
  Clock,
  ArrowLeft,
  Share2,
  FileText,
  Mail,
  CheckCircle2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

interface ComplaintViewClientProps {
  complaint: any;
}

export function ComplaintViewClient({ complaint }: ComplaintViewClientProps) {
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const report = complaint.report;
  const lake = report.lake;
  const statusEvents = report.statusEvents || [];
  const escalations = complaint.escalations || [];

  const handleCopyText = async () => {
    try {
      await navigator.clipboard.writeText(complaint.letterText);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch (e) {
      console.error(e);
    }
  };

  const handleDownloadPdf = () => {
    setDownloading(true);
    window.location.href = `/api/complaint/${complaint.trackingId}/pdf`;
    setTimeout(() => setDownloading(false), 2000);
  };

  return (
    <div className="container max-w-4xl py-8 px-4 space-y-6">
      {/* Top Navigation */}
      <div className="flex items-center justify-between">
        <Link
          href="/my-reports"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="h-4 w-4" /> Back to My Reports
        </Link>
        <span className="text-xs text-slate-500 font-mono">
          Tracking ID: <strong className="text-slate-800">{complaint.trackingId}</strong>
        </span>
      </div>

      {/* Header Banner */}
      <div className="bg-white border rounded-xl p-6 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Statutory Civic Notice
            </h1>
            <Badge variant="verified" className="text-xs">
              {complaint.trackingId}
            </Badge>
          </div>
          <p className="text-sm text-slate-600">
            Target: <strong>{lake.name}</strong> ({lake.ward}) • Status:{' '}
            <span className="font-semibold text-sky-700">{report.status}</span>
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <Button
            variant="civic"
            size="sm"
            onClick={handleDownloadPdf}
            disabled={downloading}
            className="flex items-center gap-1.5 text-xs"
          >
            <Download className="h-4 w-4" />
            {downloading ? 'Preparing PDF...' : 'Download PDF Letter'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopyText}
            className="flex items-center gap-1.5 text-xs"
          >
            {copied ? (
              <>
                <Check className="h-4 w-4 text-emerald-600" /> Copied!
              </>
            ) : (
              <>
                <Copy className="h-4 w-4" /> Copy Complaint Text
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Escalation Notification if present */}
      {escalations.length > 0 && (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 text-rose-900 shadow-xs space-y-2">
          <div className="flex items-center gap-2 font-bold text-sm text-rose-700">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            Statutory SLA Breach &amp; Administrative Escalation Record
          </div>
          <p className="text-xs text-rose-700">
            This matter has breached citizen charter response time limits and has been escalated to higher civic authorities:
          </p>
          <div className="space-y-1.5 pt-1">
            {escalations.map((esc: any) => (
              <div key={esc.id} className="text-xs bg-white/80 p-2 rounded border border-rose-200 flex justify-between">
                <div>
                  <span className="font-bold text-rose-800">
                    Level {esc.level}:{' '}
                    {esc.level === 1
                      ? 'Ward Executive Engineer'
                      : esc.level === 2
                      ? 'Zonal Joint Commissioner'
                      : 'Member Secretary, KSPCB'}
                  </span>
                  <p className="text-slate-600 mt-0.5">{esc.reason}</p>
                </div>
                <span className="text-[10px] text-slate-400 shrink-0 ml-2">
                  {new Date(esc.createdAt).toLocaleDateString('en-IN')}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CPGRAMS / pgportal.gov.in Semi-Automated Handoff Box */}
      <div className="bg-tealbrand-50/70 border border-tealbrand-200 rounded-xl p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-tealbrand-600 shrink-0" />
            <h3 className="text-sm font-bold text-tealbrand-900">
              National Grievance Portal Linkage (CPGRAMS / Swachhata)
            </h3>
          </div>
          <a
            href="https://pgportal.gov.in/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-tealbrand-700 hover:text-tealbrand-900 underline"
          >
            Open pgportal.gov.in <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>
        <p className="text-xs text-slate-600 mb-3">
          Need national oversight? Use our pre-formatted text to lodge this grievance directly on the Central Government / NGT PGPortal:
        </p>
        <ol className="text-xs text-slate-700 space-y-1 list-decimal list-inside bg-white p-3 rounded-lg border border-tealbrand-200">
          <li>
            Click <strong>&quot;Copy Complaint Text&quot;</strong> above to copy the formatted grievance letter.
          </li>
          <li>
            Open <a href="https://pgportal.gov.in/" target="_blank" rel="noreferrer" className="text-sky-600 underline">pgportal.gov.in</a> and select <em>Ministry of Environment, Forest and Climate Change</em> or <em>Ministry of Housing and Urban Affairs</em>.
          </li>
          <li>Paste the copied text and attach the downloaded official PDF letter.</li>
        </ol>
      </div>

      {/* Lifecycle Timeline & Status Events */}
      <Card className="shadow-xs">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Clock className="h-4 w-4 text-sky-600" />
            Statutory Audit Trail &amp; Status Transitions ({statusEvents.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
            {statusEvents.map((evt: any, idx: number) => {
              const isLatest = idx === statusEvents.length - 1;
              return (
                <div key={evt.id} className="relative">
                  <div
                    className={`absolute -left-6 top-1 h-4 w-4 rounded-full border-2 border-white flex items-center justify-center ${
                      isLatest ? 'bg-sky-600 ring-4 ring-sky-100' : 'bg-slate-400'
                    }`}
                  />
                  <div className="bg-slate-50 border p-3 rounded-lg text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800">
                        {evt.fromStatus} &rarr; {evt.toStatus}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {new Date(evt.timestamp).toLocaleString('en-IN')}
                      </span>
                    </div>
                    <div className="text-slate-600 font-medium">Actor: {evt.actor}</div>
                    {evt.note && <p className="text-slate-700 pt-1 border-t border-slate-200">{evt.note}</p>}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Formal Letter Text Preview */}
      <Card className="shadow-xs">
        <CardHeader className="pb-2 flex flex-row items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="h-4 w-4 text-slate-700" />
            Official Letter Transcript
          </CardTitle>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Mail className="h-3.5 w-3.5 text-teal-600" />
            Dispatch Status: <strong className="text-slate-800">{complaint.emailStatus}</strong>
          </div>
        </CardHeader>
        <CardContent>
          <pre className="bg-slate-900 text-slate-100 p-5 rounded-lg text-xs font-mono whitespace-pre-wrap leading-relaxed overflow-x-auto">
            {complaint.letterText}
          </pre>
        </CardContent>
      </Card>
    </div>
  );
}
