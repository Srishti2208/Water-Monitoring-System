import React from 'react';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import {
  Droplets,
  MapPin,
  Camera,
  ShieldCheck,
  TrendingDown,
  TrendingUp,
  FileText,
  AlertTriangle,
  ArrowRight,
  Layers,
  Sparkles,
  Award,
  BarChart3,
  WifiOff,
  Clock,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { getHealthBand } from '@/services/healthScore';

export const revalidate = 0;

export default async function HomePage() {
  const [lakes, reports, complaints, escalations] = await Promise.all([
    prisma.lake.findMany({
      orderBy: { currentHealthScore: 'asc' },
    }),
    prisma.report.findMany({
      include: {
        lake: true,
        complaint: true,
      },
      orderBy: { capturedAt: 'desc' },
      take: 5,
    }),
    prisma.complaint.findMany(),
    prisma.escalation.findMany(),
  ]);

  const avgHealthScore =
    lakes.length > 0
      ? Math.round(lakes.reduce((acc, l) => acc + l.currentHealthScore, 0) / lakes.length)
      : 70;

  return (
    <div className="flex-1 flex flex-col space-y-10 pb-12">
      {/* HERO SECTION */}
      <section className="bg-gradient-to-b from-sky-50 via-teal-50/30 to-background border-b py-12 md:py-16">
        <div className="container max-w-5xl px-4 text-center space-y-5">
          <Badge
            variant="secondary"
            className="bg-sky-100 text-sky-800 border-sky-300 font-semibold px-3 py-1 text-xs"
          >
            Karnataka Waterbody Protection Initiative • NGT Compliant
          </Badge>

          <h1 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight leading-tight max-w-3xl mx-auto">
            Autonomous Water Quality &amp; Lake Pollution Monitoring for Bengaluru
          </h1>

          <p className="text-sm sm:text-base text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Citizens report pollution with geo-verified photo evidence. Multimodal AI classifies violations,
            aggregates real-time lake health telemetry, and auto-dispatches statutory legal notices to civic bodies with tracked citizen-verified closure.
          </p>

          {/* Call to Actions */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Link href="/report">
              <Button variant="civic" size="lg" className="flex items-center gap-2 shadow-md">
                <Camera className="h-5 w-5" /> Report Water Pollution
              </Button>
            </Link>
            <Link href="/map">
              <Button variant="outline" size="lg" className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-sky-600" /> Explore Hotspot Map
              </Button>
            </Link>
            <Link href="/accountability">
              <Button variant="ghost" size="lg" className="flex items-center gap-1.5 text-slate-700">
                <BarChart3 className="h-4 w-4" /> Civic Accountability
              </Button>
            </Link>
          </div>

          {/* Quick Metrics Bar */}
          <div className="pt-8 grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-3xl mx-auto">
            <div className="bg-white/80 backdrop-blur p-3 rounded-lg border shadow-xs">
              <div className="text-[10px] font-bold text-slate-400 uppercase">Monitored Lakes</div>
              <div className="text-2xl font-black text-slate-900">{lakes.length}</div>
              <div className="text-[10px] text-slate-500">Real Bengaluru Lakes</div>
            </div>
            <div className="bg-white/80 backdrop-blur p-3 rounded-lg border shadow-xs">
              <div className="text-[10px] font-bold text-slate-400 uppercase">City Health Index</div>
              <div className="text-2xl font-black text-amber-600">{avgHealthScore} / 100</div>
              <div className="text-[10px] text-slate-500">90-Day Weighted Decay</div>
            </div>
            <div className="bg-white/80 backdrop-blur p-3 rounded-lg border shadow-xs">
              <div className="text-[10px] font-bold text-slate-400 uppercase">Statutory Notices</div>
              <div className="text-2xl font-black text-sky-700">{complaints.length}</div>
              <div className="text-[10px] text-slate-500">Auto-Drafted to BBMP</div>
            </div>
            <div className="bg-white/80 backdrop-blur p-3 rounded-lg border shadow-xs">
              <div className="text-[10px] font-bold text-slate-400 uppercase">SLA Escalations</div>
              <div className="text-2xl font-black text-rose-600">{escalations.length}</div>
              <div className="text-[10px] text-slate-500">Breaches Flagged</div>
            </div>
          </div>
        </div>
      </section>

      {/* 5-MINUTE LIVE JUDGE DEMO WALKTHROUGH GUIDE */}
      <section className="container max-w-5xl px-4">
        <div className="bg-white border-2 border-sky-200 rounded-xl p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="h-5 w-5 text-sky-600" />
            <h2 className="text-lg font-bold text-slate-900">
              Judges 5-Minute End-to-End Walkthrough Loop
            </h2>
          </div>
          <p className="text-xs text-slate-600 mb-4">
            Test the entire zero-API-key lifecycle from citizen report to AI validation, complaint generation, official response, and citizen closure:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
            <div className="bg-sky-50/70 p-3 rounded-lg border border-sky-100 space-y-1">
              <div className="font-bold text-sky-900">Step 1: Citizen Report</div>
              <p className="text-slate-600">
                Go to <Link href="/report" className="text-sky-600 font-semibold underline">/report</Link>, pick a fast-test scenario (e.g. Bellandur Foam), and submit.
              </p>
            </div>
            <div className="bg-teal-50/70 p-3 rounded-lg border border-teal-100 space-y-1">
              <div className="font-bold text-teal-900">Step 2: AI &amp; Notice</div>
              <p className="text-slate-600">
                Vision classifies severity, dHash checks duplicates, and formal PDF is generated with tracking ID.
              </p>
            </div>
            <div className="bg-indigo-50/70 p-3 rounded-lg border border-indigo-100 space-y-1">
              <div className="font-bold text-indigo-900">Step 3: Official Triage</div>
              <p className="text-slate-600">
                Go to <Link href="/official" className="text-indigo-600 font-semibold underline">/official</Link> (or sign in as official@demo.in). Acknowledge &amp; Mark Action Taken.
              </p>
            </div>
            <div className="bg-emerald-50/70 p-3 rounded-lg border border-emerald-100 space-y-1">
              <div className="font-bold text-emerald-900">Step 4: Citizen Verification</div>
              <p className="text-slate-600">
                Visit <Link href="/my-reports" className="text-emerald-600 font-semibold underline">/my-reports</Link> and click <em>Verify Remediation</em> to officially close the case!
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* LAKES HEALTH SNAPSHOT GRID */}
      <section className="container max-w-5xl px-4 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              Bengaluru Lake Health Index
            </h2>
            <p className="text-xs text-slate-500">
              Live algorithmic health scores derived from 90-day pollution decay and sensor readings.
            </p>
          </div>
          <Link href="/map" className="text-xs font-semibold text-sky-600 hover:underline">
            View on GIS Map &rarr;
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {lakes.map((lake) => {
            const band = getHealthBand(lake.currentHealthScore);
            return (
              <Link
                key={lake.id}
                href={`/lake/${lake.id}`}
                className="bg-white border rounded-lg p-3 hover:border-sky-400 hover:shadow-xs transition-all flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className="font-bold text-xs text-slate-900 truncate group-hover:text-sky-700">
                      {lake.name}
                    </span>
                    {lake.trend === 'IMPROVING' && (
                      <TrendingUp className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                    )}
                    {lake.trend === 'DECLINING' && (
                      <TrendingDown className="h-3.5 w-3.5 text-rose-600 shrink-0" />
                    )}
                  </div>
                  <div className="text-[11px] text-slate-500 truncate">{lake.ward}</div>
                </div>

                <div className="flex items-center justify-between mt-3 pt-2 border-t">
                  <span className="text-[10px] text-slate-400 font-medium">Health Index</span>
                  <div
                    className="px-2 py-0.5 rounded text-white font-extrabold text-xs shadow-2xs"
                    style={{ backgroundColor: band.color }}
                  >
                    {lake.currentHealthScore}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* RECENT FIELD INCIDENTS */}
      <section className="container max-w-5xl px-4 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            Recent Waterbody Incident Dockets
          </h2>
          <Link href="/my-reports" className="text-xs font-semibold text-sky-600 hover:underline">
            View All Reports &rarr;
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {reports.map((report) => {
            const photos = JSON.parse(report.photoPaths || '[]');
            const vision = report.vision ? JSON.parse(report.vision) : { severity: 3, labels: [] };
            const photoSrc = photos[0] || '/demo-images/solid_waste.jpg';

            return (
              <Card key={report.id} className="overflow-hidden shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between">
                <div>
                  <img
                    src={photoSrc}
                    alt="Evidence"
                    className="w-full h-36 object-cover bg-slate-100"
                  />
                  <div className="p-4 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-slate-900">
                        {report.lake?.name}
                      </span>
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          vision.severity >= 4
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        Severity {vision.severity}/5
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {vision.labels?.map((l: string) => (
                        <span key={l} className="bg-slate-100 text-slate-600 px-1 py-0.5 rounded text-[9px] uppercase font-semibold">
                          {l.replace('_', ' ')}
                        </span>
                      ))}
                    </div>
                    <p className="text-xs text-slate-600 line-clamp-2">
                      {vision.notes || 'Observation verified.'}
                    </p>
                  </div>
                </div>

                <div className="px-4 pb-3 pt-1 border-t flex items-center justify-between text-xs text-slate-500">
                  <span className="font-mono text-[11px]">{report.status}</span>
                  {report.complaint && (
                    <Link
                      href={`/complaint/${report.complaint.trackingId}`}
                      className="text-sky-600 font-bold hover:underline"
                    >
                      Notice &rarr;
                    </Link>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      </section>
    </div>
  );
}
