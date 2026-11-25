'use client';

import React, { useState } from 'react';
import {
  Settings,
  Database,
  RefreshCw,
  Mail,
  ShieldCheck,
  ToggleLeft,
  ToggleRight,
  AlertTriangle,
  FileText,
  Clock,
  CheckCircle2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface AdminClientViewProps {
  stats: {
    lakesCount: number;
    reportsCount: number;
    complaintsCount: number;
    escalationsCount: number;
  };
  initialOutbox: any[];
}

export function AdminClientView({ stats, initialOutbox }: AdminClientViewProps) {
  const [seeding, setSeeding] = useState(false);
  const [seedResult, setSeedResult] = useState<string | null>(null);

  const [runningSla, setRunningSla] = useState(false);
  const [slaResult, setSlaResult] = useState<string | null>(null);

  const [outbox, setOutbox] = useState(initialOutbox);
  const [selectedOutboxItem, setSelectedOutboxItem] = useState<any | null>(null);

  const handleSeed = async (force: boolean) => {
    setSeeding(true);
    setSeedResult(null);
    try {
      const res = await fetch(`/api/admin/seed?force=${force}`);
      const data = await res.json();
      if (data.success) {
        setSeedResult(`Database Seeded Successfully! Counts: ${data.counts.lakes} Lakes, ${data.counts.reports} Reports, ${data.counts.complaints} Complaints.`);
      } else {
        setSeedResult('Error: ' + data.error);
      }
    } catch (e: any) {
      setSeedResult('Seed failed: ' + e.message);
    } finally {
      setSeeding(false);
    }
  };

  const handleSlaCheck = async () => {
    setRunningSla(true);
    setSlaResult(null);
    try {
      const res = await fetch('/api/admin/sla-check', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setSlaResult(`SLA Scan Executed: ${data.breachesDetected} breaches evaluated, ${data.escalationsCreated} escalations created.`);
      } else {
        setSlaResult('SLA check error: ' + data.error);
      }
    } catch (e: any) {
      setSlaResult('SLA scan failed: ' + e.message);
    } finally {
      setRunningSla(false);
    }
  };

  return (
    <div className="container max-w-5xl py-8 px-4 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <Settings className="h-6 w-6 text-sky-600" />
            Platform Operations &amp; Administration
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            JalDrishti Infrastructure Control, Database Re-seed, SLA Engine, and Civic Outbox
          </p>
        </div>
        <Badge variant="verified" className="text-xs">
          Role: System Administrator
        </Badge>
      </div>

      {/* QUICK STATS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="p-4 shadow-xs">
          <div className="text-[10px] font-bold text-slate-400 uppercase">Lakes Registered</div>
          <div className="text-2xl font-black text-slate-900 mt-1">{stats.lakesCount}</div>
        </Card>
        <Card className="p-4 shadow-xs">
          <div className="text-[10px] font-bold text-slate-400 uppercase">Total Reports</div>
          <div className="text-2xl font-black text-sky-600 mt-1">{stats.reportsCount}</div>
        </Card>
        <Card className="p-4 shadow-xs">
          <div className="text-[10px] font-bold text-slate-400 uppercase">Statutory Notices</div>
          <div className="text-2xl font-black text-teal-600 mt-1">{stats.complaintsCount}</div>
        </Card>
        <Card className="p-4 shadow-xs">
          <div className="text-[10px] font-bold text-slate-400 uppercase">Active Escalations</div>
          <div className="text-2xl font-black text-rose-600 mt-1">{stats.escalationsCount}</div>
        </Card>
      </div>

      {/* OPERATIONS ACTIONS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Seed Database Control */}
        <Card className="shadow-xs">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold flex items-center gap-2 text-slate-900">
              <Database className="h-4 w-4 text-sky-600" />
              Demo Data Seeding Engine
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-xs text-slate-600">
              Instantly re-populates the 12 Bengaluru lakes with 3 months of realistic monsoon telemetry, festival spikes, and before/after pairs.
            </p>
            {seedResult && (
              <div className="p-2.5 rounded bg-sky-50 border border-sky-200 text-sky-800 text-xs">
                {seedResult}
              </div>
            )}
            <div className="flex gap-2">
              <Button
                variant="civic"
                size="sm"
                disabled={seeding}
                onClick={() => handleSeed(true)}
                className="text-xs"
              >
                <RefreshCw className={`h-3 w-3 mr-1.5 ${seeding ? 'animate-spin' : ''}`} />
                {seeding ? 'Seeding Database...' : 'Force Re-Seed All Data'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* SLA Check Control */}
        <Card className="shadow-xs">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold flex items-center gap-2 text-slate-900">
              <Clock className="h-4 w-4 text-rose-600" />
              Statutory SLA Monitor Engine
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-xs text-slate-600">
              Triggers the statutory SLA audit (normally run every 15 min by node-cron). Evaluates 7-day and 14-day breaches and creates Level 1/2/3 escalations.
            </p>
            {slaResult && (
              <div className="p-2.5 rounded bg-rose-50 border border-rose-200 text-rose-800 text-xs">
                {slaResult}
              </div>
            )}
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={runningSla}
                onClick={handleSlaCheck}
                className="text-xs"
              >
                <RefreshCw className={`h-3 w-3 mr-1.5 ${runningSla ? 'animate-spin' : ''}`} />
                {runningSla ? 'Running SLA Audit...' : 'Execute Manual SLA Scan'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* OUTBOX TABLE (DEMO_MODE Fallback Inspection) */}
      <Card className="shadow-xs overflow-hidden">
        <CardHeader className="pb-3 border-b flex flex-row items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Mail className="h-4 w-4 text-teal-600" />
            Civic Outbox Audit Ledger ({outbox.length})
          </CardTitle>
          <Badge variant="secondary" className="text-xs">
            DEMO_MODE=true Fallback
          </Badge>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100/70 text-slate-600 uppercase text-[10px] font-bold">
                <tr>
                  <th className="py-2.5 px-4">Recipient</th>
                  <th className="py-2.5 px-4">Subject</th>
                  <th className="py-2.5 px-4">Status</th>
                  <th className="py-2.5 px-4">Timestamp</th>
                  <th className="py-2.5 px-4 text-right">Inspect</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {outbox.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-4 text-center text-slate-500">
                      Outbox is empty.
                    </td>
                  </tr>
                ) : (
                  outbox.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-mono font-semibold text-slate-800">
                        {item.to}
                      </td>
                      <td className="py-3 px-4 text-slate-700 max-w-xs truncate">{item.subject}</td>
                      <td className="py-3 px-4">
                        <Badge
                          variant={item.status === 'SENT_DEMO' ? 'verified' : 'success'}
                          className="text-[10px] font-mono"
                        >
                          {item.status}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-slate-400">
                        {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => setSelectedOutboxItem(item)}
                          className="text-sky-600 font-bold hover:underline"
                        >
                          View Transcript
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Outbox Modal Inspection */}
      {selectedOutboxItem && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[80vh] flex flex-col overflow-hidden animate-fade-in">
            <div className="p-4 border-b flex items-center justify-between bg-slate-50">
              <div>
                <h3 className="font-bold text-sm text-slate-900">
                  Outbox Dispatch: {selectedOutboxItem.subject}
                </h3>
                <p className="text-xs text-slate-500 font-mono">To: {selectedOutboxItem.to}</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedOutboxItem(null)}
                className="text-xs"
              >
                Close
              </Button>
            </div>
            <div className="p-4 overflow-y-auto flex-1">
              <pre className="bg-slate-900 text-slate-100 p-4 rounded-lg text-xs font-mono whitespace-pre-wrap leading-relaxed">
                {selectedOutboxItem.body}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
