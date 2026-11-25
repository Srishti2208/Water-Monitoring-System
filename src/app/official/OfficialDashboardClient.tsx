'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Play,
  RotateCcw,
  Sparkles,
  BarChart2,
  TrendingDown,
  Building,
  RefreshCw,
  FileText,
  Filter,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

interface OfficialDashboardClientProps {
  initialComplaints: any[];
  lakes: any[];
  initialBreaches: any[];
  reports: any[];
}

export function OfficialDashboardClient({
  initialComplaints,
  lakes,
  initialBreaches,
  reports,
}: OfficialDashboardClientProps) {
  const [complaints, setComplaints] = useState(initialComplaints);
  const [breaches, setBreaches] = useState(initialBreaches);
  const [actioningId, setActioningId] = useState<string | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState<Record<string, string>>({});
  const [showResolutionInput, setShowResolutionInput] = useState<string | null>(null);
  const [runningSla, setRunningSla] = useState(false);
  const [slaResultMsg, setSlaResultMsg] = useState<string | null>(null);
  const [wardFilter, setWardFilter] = useState<string>('ALL');

  // Compute reports per ward for BarChart
  const wardReportMap: Record<string, number> = {};
  for (const r of reports) {
    const wardName = r.lake?.ward?.split(' - ')[1] || r.lake?.ward || 'Other Ward';
    wardReportMap[wardName] = (wardReportMap[wardName] || 0) + 1;
  }

  const wardChartData = Object.entries(wardReportMap).map(([ward, count]) => ({
    ward,
    reports: count,
  }));

  // Trigger manual SLA check
  const handleRunSlaCheck = async () => {
    setRunningSla(true);
    setSlaResultMsg(null);
    try {
      const res = await fetch('/api/admin/sla-check', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setSlaResultMsg(
          `SLA Check Complete: ${data.breachesDetected} breaches evaluated, ${data.escalationsCreated} statutory escalations created.`
        );
        // Refresh complaints
        const refreshed = await fetch('/api/reports');
        if (refreshed.ok) {
          const refData = await refreshed.json();
          // We can reload or re-fetch complaints
        }
      }
    } catch (e: any) {
      setSlaResultMsg('SLA check error: ' + e.message);
    } finally {
      setRunningSla(false);
    }
  };

  // Perform official action: ACKNOWLEDGED, IN_PROGRESS, RESOLVED_CLAIMED
  const handleTransition = async (reportId: string, toStatus: string) => {
    setActioningId(reportId);
    try {
      let note = '';
      if (toStatus === 'ACKNOWLEDGED') {
        note = 'Complaint formally docketed by Ward Executive Engineer. Site engineer assigned.';
      } else if (toStatus === 'IN_PROGRESS') {
        note = 'Remediation initiated: Containment booms deployed and drain inspection team mobilized.';
      } else if (toStatus === 'RESOLVED_CLAIMED') {
        note = resolutionNotes[reportId] || 'Remediation completed: Surface debris removed and inlet valve serviced.';
      }

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
        // Update local state
        setComplaints((prev) =>
          prev.map((c) =>
            c.report.id === reportId
              ? {
                  ...c,
                  report: {
                    ...c.report,
                    status: toStatus,
                  },
                }
              : c
          )
        );
        setShowResolutionInput(null);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setActioningId(null);
    }
  };

  const filteredComplaints = complaints.filter((c) => {
    if (wardFilter !== 'ALL' && c.report.lake?.ward !== wardFilter) return false;
    return true;
  });

  const uniqueWards = Array.from(new Set(lakes.map((l) => l.ward)));

  return (
    <div className="container max-w-6xl py-8 px-4 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Official Desk &amp; Municipal Triage
            </h1>
            <Badge variant="secondary" className="bg-sky-100 text-sky-800 border-sky-300">
              BBMP Lakes Division
            </Badge>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Role: <strong>Ward Executive Engineer / Zonal Joint Commissioner</strong> • Bengaluru Urban Region
          </p>
        </div>

        <Button
          variant="civic"
          size="sm"
          disabled={runningSla}
          onClick={handleRunSlaCheck}
          className="flex items-center gap-1.5 text-xs"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${runningSla ? 'animate-spin' : ''}`} />
          {runningSla ? 'Evaluating SLAs...' : 'Run Statutory SLA Check'}
        </Button>
      </div>

      {slaResultMsg && (
        <div className="p-3 rounded-lg bg-sky-50 border border-sky-200 text-sky-800 text-xs flex items-center justify-between">
          <span>{slaResultMsg}</span>
          <button onClick={() => setSlaResultMsg(null)} className="text-sky-600 hover:underline">
            Dismiss
          </button>
        </div>
      )}

      {/* ANOMALY ALERT BANNER: September Ganesh Visarjan Spike */}
      <div className="bg-amber-50 border border-amber-300 rounded-xl p-4 shadow-xs flex items-start gap-3">
        <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="text-xs space-y-1">
          <div className="font-bold text-amber-900 text-sm">
            Temporal Anomaly Flagged: September Festival Visarjan Spike
          </div>
          <p className="text-amber-800">
            Automated cluster analysis detected a <strong>+340% influx in solid waste &amp; chemical discoloration</strong> reports at{' '}
            <strong>Ulsoor Lake (Halasuru Ward)</strong> coinciding with idol immersion dates. Containment boom deployment and localized silt trapping is requisitioned.
          </p>
        </div>
      </div>

      {/* STATS OVERVIEW CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="p-4 shadow-xs">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Total Complaints
          </div>
          <div className="text-2xl font-black text-slate-900 mt-1">
            {complaints.length}
          </div>
          <div className="text-[10px] text-slate-500 mt-1">Active civic dockets</div>
        </Card>

        <Card className="p-4 shadow-xs">
          <div className="text-[11px] font-bold text-rose-500 uppercase tracking-wider">
            SLA Escalations
          </div>
          <div className="text-2xl font-black text-rose-600 mt-1">
            {breaches.length}
          </div>
          <div className="text-[10px] text-rose-500 font-semibold mt-1">
            Statutory breaches flagged
          </div>
        </Card>

        <Card className="p-4 shadow-xs">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            In Progress
          </div>
          <div className="text-2xl font-black text-amber-600 mt-1">
            {complaints.filter((c) => c.report.status === 'IN_PROGRESS').length}
          </div>
          <div className="text-[10px] text-slate-500 mt-1">Field operations underway</div>
        </Card>

        <Card className="p-4 shadow-xs">
          <div className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider">
            Citizen Verified
          </div>
          <div className="text-2xl font-black text-emerald-600 mt-1">
            {complaints.filter((c) => c.report.status === 'CITIZEN_VERIFIED' || c.report.status === 'CLOSED').length}
          </div>
          <div className="text-[10px] text-emerald-600 font-semibold mt-1">Closed with proof</div>
        </Card>
      </div>

      {/* ANALYTICS CHART: Reports per Ward */}
      <Card className="shadow-xs">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <BarChart2 className="h-4 w-4 text-sky-600" />
            Recurring Civic Analytics: Incident Influx by Administrative Ward
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-56 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={wardChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="ward" tick={{ fontSize: 10, fill: '#64748b' }} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: '#64748b' }} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="reports" fill="#0284c7" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* SLA BREACH QUEUE */}
      <Card className="shadow-xs border-rose-200">
        <CardHeader className="bg-rose-50/50 pb-3 border-b border-rose-100 flex flex-row items-center justify-between">
          <CardTitle className="text-base text-rose-900 flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-rose-600" />
            Statutory SLA Breach &amp; Escalation Queue ({breaches.length})
          </CardTitle>
          <span className="text-xs text-rose-700 font-semibold">Priority Triage Required</span>
        </CardHeader>
        <CardContent className="p-0 divide-y">
          {breaches.length === 0 ? (
            <p className="text-xs text-slate-500 py-6 text-center">
              No statutory SLA breaches detected at this time.
            </p>
          ) : (
            breaches.slice(0, 6).map((b: any) => {
              const complaint = b.complaint;
              const report = complaint?.report;
              return (
                <div key={b.id} className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs hover:bg-rose-50/30">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-rose-800 bg-rose-100 px-2 py-0.5 rounded text-[11px]">
                        Level {b.level} Escalation
                      </span>
                      <strong className="text-slate-900">{report?.lake?.name}</strong>
                      <span className="text-slate-400 font-mono">({complaint?.trackingId})</span>
                    </div>
                    <p className="text-slate-600">{b.reason}</p>
                    <div className="text-[10px] text-slate-400">
                      Escalated on {new Date(b.createdAt).toLocaleDateString('en-IN')}
                    </div>
                  </div>

                  <Link href={`/complaint/${complaint?.trackingId}`}>
                    <Button variant="outline" size="sm" className="text-xs shrink-0">
                      <FileText className="h-3.5 w-3.5 mr-1 text-sky-600" />
                      View Docket
                    </Button>
                  </Link>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>

      {/* COMPLAINT INBOX & ACTIONS */}
      <Card className="shadow-xs">
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b">
          <CardTitle className="text-base flex items-center gap-2">
            <Building className="h-4 w-4 text-sky-600" />
            Ward Complaint Inbox ({filteredComplaints.length})
          </CardTitle>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Filter className="h-3.5 w-3.5 text-slate-400" />
            <select
              value={wardFilter}
              onChange={(e) => setWardFilter(e.target.value)}
              className="text-xs h-8 px-2 rounded border bg-white text-slate-700 font-medium w-full sm:w-auto"
            >
              <option value="ALL">All Wards</option>
              {uniqueWards.map((w: any) => (
                <option key={w} value={w}>
                  {w}
                </option>
              ))}
            </select>
          </div>
        </CardHeader>
        <CardContent className="p-0 divide-y">
          {filteredComplaints.map((c) => {
            const report = c.report;
            const lake = report.lake;
            const vision = report.vision ? JSON.parse(report.vision) : { severity: 3, labels: [] };
            const status = report.status;
            const isActioning = actioningId === report.id;

            return (
              <div key={c.id} className="p-4 text-xs space-y-3 hover:bg-slate-50/50 transition-colors">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-sky-700">{c.trackingId}</span>
                    <strong className="text-sm text-slate-900">{lake?.name}</strong>
                    <span className="text-slate-500 font-medium">({lake?.ward})</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        c.priority === 'CRITICAL'
                          ? 'bg-rose-100 text-rose-800'
                          : c.priority === 'HIGH'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      Priority: {c.priority}
                    </span>
                    <Badge variant="outline" className="font-mono text-[10px]">
                      {status}
                    </Badge>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <img
                    src={JSON.parse(report.photoPaths || '[]')[0] || '/demo-images/solid_waste.jpg'}
                    alt="Evidence"
                    className="w-20 h-16 object-cover rounded border shrink-0 bg-slate-100"
                  />
                  <div className="space-y-1 flex-1">
                    <div className="flex flex-wrap gap-1">
                      {vision.labels?.map((l: string) => (
                        <span key={l} className="bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded text-[9px] uppercase font-semibold">
                          {l.replace('_', ' ')}
                        </span>
                      ))}
                    </div>
                    <p className="text-slate-600 line-clamp-2">
                      {vision.notes || 'Field evidence logged.'}
                    </p>
                    <div className="text-[10px] text-slate-400">
                      Dispatched on {new Date(c.sentAt).toLocaleDateString('en-IN')} by {report.user?.name || 'Citizen'}
                    </div>
                  </div>
                </div>

                {/* Resolution note input if triggered */}
                {showResolutionInput === report.id && (
                  <div className="bg-emerald-50/70 border border-emerald-200 p-3 rounded-lg space-y-2 animate-fade-in">
                    <label className="text-xs font-bold text-emerald-900 block">
                      Mandatory Remediation / Action Taken Log:
                    </label>
                    <textarea
                      rows={2}
                      placeholder="e.g. Cleared 1.5 MT floating waste, deployed containment booms at weir, issued statutory penalty notice to violating tanker."
                      value={resolutionNotes[report.id] || ''}
                      onChange={(e) =>
                        setResolutionNotes({ ...resolutionNotes, [report.id]: e.target.value })
                      }
                      className="w-full text-xs p-2 rounded border bg-white"
                    />
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowResolutionInput(null)}
                        className="text-xs h-7"
                      >
                        Cancel
                      </Button>
                      <Button
                        variant="civic"
                        size="sm"
                        disabled={isActioning}
                        onClick={() => handleTransition(report.id, 'RESOLVED_CLAIMED')}
                        className="text-xs h-7 bg-emerald-600 hover:bg-emerald-700"
                      >
                        Confirm Action Taken
                      </Button>
                    </div>
                  </div>
                )}

                {/* State Machine Action Buttons */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t">
                  <Link href={`/complaint/${c.trackingId}`} className="text-sky-600 hover:underline text-[11px] font-semibold">
                    Open Full Complaint Docket &amp; PDF &rarr;
                  </Link>

                  <div className="flex items-center gap-1.5">
                    {status === 'COMPLAINT_SENT' && (
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={isActioning}
                        onClick={() => handleTransition(report.id, 'ACKNOWLEDGED')}
                        className="text-xs h-7"
                      >
                        <Clock className="h-3 w-3 mr-1 text-sky-600" /> Acknowledge
                      </Button>
                    )}

                    {(status === 'ACKNOWLEDGED' || status === 'REOPENED') && (
                      <Button
                        variant="civic"
                        size="sm"
                        disabled={isActioning}
                        onClick={() => handleTransition(report.id, 'IN_PROGRESS')}
                        className="text-xs h-7"
                      >
                        <Play className="h-3 w-3 mr-1" /> Mark In Progress
                      </Button>
                    )}

                    {status === 'IN_PROGRESS' && showResolutionInput !== report.id && (
                      <Button
                        variant="teal"
                        size="sm"
                        disabled={isActioning}
                        onClick={() => setShowResolutionInput(report.id)}
                        className="text-xs h-7"
                      >
                        <CheckCircle2 className="h-3 w-3 mr-1" /> Mark Action Taken
                      </Button>
                    )}

                    {status !== 'CLOSED' && status !== 'REJECTED' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={isActioning}
                        onClick={() => handleTransition(report.id, 'REJECTED')}
                        className="text-xs h-7 text-rose-600 hover:bg-rose-50"
                      >
                        Reject Spam
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
