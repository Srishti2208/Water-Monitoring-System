import React from 'react';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import {
  ShieldAlert,
  CheckCircle2,
  Clock,
  TrendingDown,
  Building,
  BarChart3,
  Award,
  AlertOctagon,
  FileSpreadsheet,
  Printer,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { getHealthBand } from '@/services/healthScore';

export const revalidate = 0;

export default async function AccountabilityPage() {
  const [lakes, reports, complaints, escalations] = await Promise.all([
    prisma.lake.findMany({
      orderBy: { currentHealthScore: 'asc' }, // worst first
    }),
    prisma.report.findMany({
      include: {
        lake: true,
        complaint: true,
        statusEvents: true,
      },
    }),
    prisma.complaint.findMany({
      include: {
        report: {
          include: { lake: true, statusEvents: true },
        },
      },
    }),
    prisma.escalation.findMany(),
  ]);

  // Calculations
  const totalComplaints = complaints.length;
  const closedComplaints = complaints.filter(
    (c) => c.report.status === 'CLOSED' || c.report.status === 'CITIZEN_VERIFIED'
  );
  const openComplaints = complaints.filter(
    (c) => c.report.status !== 'CLOSED' && c.report.status !== 'CITIZEN_VERIFIED' && c.report.status !== 'REJECTED'
  );

  const citizenVerifiedCount = reports.filter((r) => r.status === 'CITIZEN_VERIFIED' || r.status === 'CLOSED').length;
  const citizenVerificationRate =
    totalComplaints > 0 ? Math.round((citizenVerifiedCount / totalComplaints) * 100) : 0;

  // Average response time per ward (in days)
  const wardResponseTimes: Record<string, { totalDays: number; count: number }> = {};
  for (const c of complaints) {
    const ward = c.report?.lake?.ward || 'General';
    const sent = new Date(c.sentAt).getTime();
    const ackEvents = c.report?.statusEvents?.filter((e: any) => e.toStatus === 'ACKNOWLEDGED') || [];
    if (ackEvents.length > 0) {
      const ackTime = new Date(ackEvents[0].timestamp).getTime();
      const diffDays = Math.max(0.5, (ackTime - sent) / (1000 * 60 * 60 * 24));
      if (!wardResponseTimes[ward]) {
        wardResponseTimes[ward] = { totalDays: 0, count: 0 };
      }
      wardResponseTimes[ward].totalDays += diffDays;
      wardResponseTimes[ward].count += 1;
    }
  }

  const wardAverages = Object.entries(wardResponseTimes).map(([ward, data]) => ({
    ward,
    avgDays: (data.totalDays / data.count).toFixed(1),
    cases: data.count,
  }));

  return (
    <div className="container max-w-5xl py-8 px-4 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b pb-6">
        <div>
          <Badge variant="secondary" className="mb-1.5 bg-tealbrand-100 text-tealbrand-800 border-tealbrand-300">
            Public Civic Ledger • Bengaluru Waterbodies
          </Badge>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Municipal Environmental Accountability
          </h1>
          <p className="text-xs text-slate-500 mt-1 max-w-xl">
            Independent, tamper-evident audit of civic responses, statutory SLA adherence, and lake health indices across Bruhat Bengaluru Mahanagara Palike (BBMP) wards.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/map">
            <Button variant="civic" size="sm" className="text-xs">
              Live Hotspot Map &rarr;
            </Button>
          </Link>
        </div>
      </div>

      {/* KEY METRIC CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="p-4 shadow-xs border-slate-200">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Total Civic Notices
          </div>
          <div className="text-3xl font-black text-slate-900 mt-1">
            {totalComplaints}
          </div>
          <p className="text-[10px] text-slate-500 mt-0.5">Dispatched to BBMP / KSPCB</p>
        </Card>

        <Card className="p-4 shadow-xs border-slate-200">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Resolution Status
          </div>
          <div className="text-3xl font-black text-sky-700 mt-1">
            {closedComplaints.length}{' '}
            <span className="text-xs font-normal text-slate-400">/ {openComplaints.length} open</span>
          </div>
          <p className="text-[10px] text-slate-500 mt-0.5">Formal cases closed</p>
        </Card>

        <Card className="p-4 shadow-xs border-emerald-200 bg-emerald-50/20">
          <div className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">
            Citizen Verification Rate
          </div>
          <div className="text-3xl font-black text-emerald-600 mt-1">
            {citizenVerificationRate}%
          </div>
          <p className="text-[10px] text-emerald-700 mt-0.5">Verified on-ground by citizens</p>
        </Card>

        <Card className="p-4 shadow-xs border-rose-200 bg-rose-50/20">
          <div className="text-[11px] font-bold text-rose-700 uppercase tracking-wider">
            Statutory Escalations
          </div>
          <div className="text-3xl font-black text-rose-600 mt-1">
            {escalations.length}
          </div>
          <p className="text-[10px] text-rose-700 mt-0.5">SLA breaches escalated to KSPCB</p>
        </Card>
      </div>

      {/* WORST LAKES RANKING */}
      <Card className="shadow-xs overflow-hidden border-rose-200">
        <CardHeader className="bg-rose-50/50 pb-3 border-b border-rose-100 flex flex-row items-center justify-between">
          <CardTitle className="text-base text-rose-950 flex items-center gap-2">
            <AlertOctagon className="h-5 w-5 text-rose-600" />
            Worst Impacted Lakes Ranking (By Health Index)
          </CardTitle>
          <span className="text-xs text-rose-700 font-semibold">Priority Ecological Danger</span>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100/70 text-slate-600 uppercase text-[10px] font-bold">
                <tr>
                  <th className="py-2.5 px-4">Rank</th>
                  <th className="py-2.5 px-4">Waterbody Name</th>
                  <th className="py-2.5 px-4">Administrative Ward</th>
                  <th className="py-2.5 px-4">Health Score</th>
                  <th className="py-2.5 px-4">7-Day Trend</th>
                  <th className="py-2.5 px-4 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {lakes.slice(0, 6).map((lake, idx) => {
                  const band = getHealthBand(lake.currentHealthScore);
                  return (
                    <tr key={lake.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-bold text-slate-700">#{idx + 1}</td>
                      <td className="py-3 px-4 font-bold text-slate-900">{lake.name}</td>
                      <td className="py-3 px-4 text-slate-600">{lake.ward}</td>
                      <td className="py-3 px-4">
                        <span
                          className="px-2.5 py-1 rounded-md text-white font-black text-xs inline-block"
                          style={{ backgroundColor: band.color }}
                        >
                          {lake.currentHealthScore} / 100
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-semibold text-[11px] text-slate-700">{lake.trend}</span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Link
                          href={`/lake/${lake.id}`}
                          className="text-sky-600 font-bold hover:underline"
                        >
                          Telemetry &rarr;
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* AVERAGE RESPONSE TIME PER WARD */}
      <Card className="shadow-xs overflow-hidden">
        <CardHeader className="pb-3 border-b">
          <CardTitle className="text-base flex items-center gap-2">
            <Building className="h-4 w-4 text-sky-600" />
            Average Civic Response Time by Administrative Ward
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100/70 text-slate-600 uppercase text-[10px] font-bold">
                <tr>
                  <th className="py-2.5 px-4">Ward Designation</th>
                  <th className="py-2.5 px-4">Average Acknowledgment Delay</th>
                  <th className="py-2.5 px-4">Sample Complaints</th>
                  <th className="py-2.5 px-4 text-right">SLA Compliance Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {wardAverages.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-4 text-center text-slate-500">
                      No response time records available yet.
                    </td>
                  </tr>
                ) : (
                  wardAverages.map((wa) => {
                    const days = parseFloat(wa.avgDays);
                    const isBreached = days > 7.0;
                    return (
                      <tr key={wa.ward} className="hover:bg-slate-50/80">
                        <td className="py-3 px-4 font-bold text-slate-800">{wa.ward}</td>
                        <td className="py-3 px-4 font-mono font-semibold">
                          {wa.avgDays} business days
                        </td>
                        <td className="py-3 px-4 text-slate-500">{wa.cases} cases</td>
                        <td className="py-3 px-4 text-right">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              isBreached
                                ? 'bg-rose-100 text-rose-800'
                                : 'bg-emerald-100 text-emerald-800'
                            }`}
                          >
                            {isBreached ? 'SLA Breached (>7 Days)' : 'Within SLA Standard'}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
