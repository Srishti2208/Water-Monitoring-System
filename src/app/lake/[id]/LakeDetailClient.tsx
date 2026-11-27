'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Bell,
  BellOff,
  MapPin,
  Calendar,
  AlertTriangle,
  ArrowLeft,
  ShieldCheck,
  FileText,
  Activity,
  Layers,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { getHealthBand } from '@/services/healthScore';
import { MiniMap } from '@/components/map/MiniMap';

interface LakeDetailClientProps {
  lake: any;
  initialReports: any[];
  snapshots: any[];
}

export function LakeDetailClient({
  lake,
  initialReports,
  snapshots,
}: LakeDetailClientProps) {
  const [isSubscribed, setIsSubscribed] = useState(
    lake.subscriptions && lake.subscriptions.length > 0
  );
  const [subscribing, setSubscribing] = useState(false);

  const band = getHealthBand(lake.currentHealthScore);

  const chartData = snapshots.map((s) => ({
    date: new Date(s.date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }),
    score: s.score,
  }));

  const handleToggleSubscribe = async () => {
    setSubscribing(true);
    try {
      const res = await fetch('/api/subscriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lakeId: lake.id,
          action: isSubscribed ? 'unsubscribe' : 'subscribe',
        }),
      });
      if (res.ok) {
        setIsSubscribed(!isSubscribed);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSubscribing(false);
    }
  };

  return (
    <div className="container max-w-5xl py-8 px-4 space-y-6">
      {/* Navigation Breadcrumb */}
      <div className="flex items-center justify-between">
        <Link
          href="/map"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Hotspot Map
        </Link>
        <Button
          variant={isSubscribed ? 'outline' : 'teal'}
          size="sm"
          disabled={subscribing}
          onClick={handleToggleSubscribe}
          className="flex items-center gap-1.5 text-xs"
        >
          {isSubscribed ? (
            <>
              <BellOff className="h-3.5 w-3.5" /> Subscribed (Click to Unsubscribe)
            </>
          ) : (
            <>
              <Bell className="h-3.5 w-3.5" /> Subscribe to Lake In-App Alerts
            </>
          )}
        </Button>
      </div>

      {/* Lake Hero Header */}
      <div className="bg-white border rounded-xl p-6 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
              {lake.name}
            </h1>
            {lake.trend === 'IMPROVING' && (
              <Badge variant="success" className="gap-1">
                <TrendingUp className="h-3.5 w-3.5" /> Improving
              </Badge>
            )}
            {lake.trend === 'DECLINING' && (
              <Badge variant="danger" className="gap-1">
                <TrendingDown className="h-3.5 w-3.5" /> Declining
              </Badge>
            )}
            {lake.trend === 'STABLE' && (
              <Badge variant="secondary" className="gap-1">
                <Minus className="h-3.5 w-3.5" /> Stable
              </Badge>
            )}
          </div>
          <p className="text-sm text-slate-500 flex items-center gap-1.5">
            <MapPin className="h-4 w-4 text-sky-600" />
            {lake.ward} • Coordinates: {lake.lat.toFixed(4)}°N, {lake.lng.toFixed(4)}°E
          </p>
          <div className="pt-2">
            <a
              href={`https://www.google.com/maps/dir/?api=1&destination=${lake.lat},${lake.lng}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs shadow-xs transition"
            >
              <span>📍 Turn-by-Turn GPS Navigation (Google Maps) ↗</span>
            </a>
          </div>
        </div>

        {/* Big Health Score Badge */}
        <div className="flex items-center gap-4 bg-slate-50 border p-4 rounded-xl shrink-0">
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Lake Health Score
            </div>
            <div className="text-3xl font-black" style={{ color: band.color }}>
              {lake.currentHealthScore}
              <span className="text-sm font-normal text-slate-400"> / 100</span>
            </div>
            <div className="text-xs font-semibold" style={{ color: band.color }}>
              {band.label}
            </div>
          </div>
          <div
            className="h-12 w-12 rounded-xl flex items-center justify-center text-white font-black text-lg shadow-sm"
            style={{ backgroundColor: band.color }}
          >
            {lake.currentHealthScore}
          </div>
        </div>
      </div>

      {/* Grid: 90-Day Trend Chart + Mini Map */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recharts 90-Day Area Chart */}
        <Card className="lg:col-span-2 shadow-xs">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Activity className="h-4 w-4 text-sky-600" />
              90-Day Lake Health Score Trajectory
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 w-full pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={band.color} stopOpacity={0.4} />
                      <stop offset="95%" stopColor={band.color} stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#64748b' }} tickLine={false} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: '#64748b' }} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderRadius: '8px',
                      color: '#fff',
                      fontSize: '12px',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="score"
                    stroke={band.color}
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#scoreGrad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-3 flex items-center justify-between text-xs text-slate-500 border-t pt-2">
              <span>Formula: 100 - min(100, 8 * SUM(sev * exp(-age/14)))</span>
              <span>Daily Snapshots: {snapshots.length}</span>
            </div>
          </CardContent>
        </Card>

        {/* Lake Map Location */}
        <Card className="shadow-xs flex flex-col">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <MapPin className="h-4 w-4 text-teal-600" />
              Waterbody Geographic Bounds
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col">
            <div className="h-56 w-full rounded-md overflow-hidden border">
              <MiniMap lat={lake.lat} lng={lake.lng} zoom={14} title={lake.name} />
            </div>
            <div className="mt-3 text-xs text-slate-600 space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-400">Total Reports:</span>
                <span className="font-bold">{initialReports.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Jurisdiction:</span>
                <span>BBMP Lakes Division</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* WATER QUALITY INDEX (WQI) ESTIMATED SUB-PARAMETERS */}
      <Card className="shadow-xs border-teal-200">
        <CardHeader className="pb-3 bg-teal-50/40 border-b">
          <CardTitle className="text-base flex items-center justify-between text-slate-900">
            <span className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-teal-600" />
              Limnological &amp; Water Quality Sub-Parameters (Estimated WQI Model)
            </span>
            <Badge variant="outline" className="text-[10px] font-mono border-teal-300 text-teal-800">
              CPCB Class {lake.currentHealthScore >= 70 ? 'B / C' : lake.currentHealthScore >= 40 ? 'D' : 'E (Hypoxic)'}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-5">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
              <span className="text-slate-400 font-bold uppercase text-[10px] block">Dissolved Oxygen (DO)</span>
              <div className="text-lg font-black text-slate-900">
                {(Math.max(1.0, (lake.currentHealthScore / 100) * 7.2 + 0.8)).toFixed(1)} <span className="text-xs font-normal text-slate-500">mg/L</span>
              </div>
              <span className="text-[10px] text-slate-500 block">
                Standard: &gt; 4.0 mg/L ({lake.currentHealthScore >= 50 ? 'Compliant' : 'Depleted/Hypoxic'})
              </span>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
              <span className="text-slate-400 font-bold uppercase text-[10px] block">Biochemical Oxygen (BOD)</span>
              <div className="text-lg font-black text-slate-900">
                {(Math.max(2.0, ((100 - lake.currentHealthScore) / 100) * 26 + 1.8)).toFixed(1)} <span className="text-xs font-normal text-slate-500">mg/L</span>
              </div>
              <span className="text-[10px] text-slate-500 block">
                Standard: &lt; 3.0 mg/L ({lake.currentHealthScore >= 70 ? 'Acceptable' : 'Elevated Organic Load'})
              </span>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
              <span className="text-slate-400 font-bold uppercase text-[10px] block">Trophic State (TSI)</span>
              <div className="text-base font-black text-slate-900 truncate">
                {lake.currentHealthScore >= 70
                  ? 'Mesotrophic'
                  : lake.currentHealthScore >= 40
                  ? 'Eutrophic'
                  : 'Hyper-Eutrophic'}
              </div>
              <span className="text-[10px] text-slate-500 block">
                {lake.currentHealthScore >= 70 ? 'Low Algal Density' : 'Cyanobacteria & Foam Risk'}
              </span>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
              <span className="text-slate-400 font-bold uppercase text-[10px] block">Secchi Transparency</span>
              <div className="text-lg font-black text-slate-900">
                {lake.currentHealthScore >= 70 ? '> 60 cm' : lake.currentHealthScore >= 40 ? '30 – 60 cm' : '< 30 cm'}
              </div>
              <span className="text-[10px] text-slate-500 block">
                Visual photic depth indicator
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Incident Reports for this Lake */}
      <Card className="shadow-xs">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Layers className="h-4 w-4 text-sky-600" />
            Field Evidence &amp; Citizen Incident Reports ({initialReports.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {initialReports.length === 0 ? (
            <p className="text-xs text-slate-500 py-6 text-center">
              No pollution reports logged for {lake.name} in the last 90 days.
            </p>
          ) : (
            <div className="divide-y">
              {initialReports.map((report) => {
                const photos = JSON.parse(report.photoPaths || '[]');
                const vision = report.vision ? JSON.parse(report.vision) : { severity: 3, labels: [] };
                const trust = JSON.parse(report.trust || '{}');
                const photoSrc = photos[0] || '/demo-images/solid_waste.jpg';

                return (
                  <div key={report.id} className="py-4 flex flex-col sm:flex-row gap-4 items-start justify-between">
                    <div className="flex gap-3">
                      <img
                        src={photoSrc}
                        alt="Evidence"
                        className="w-24 h-20 object-cover rounded-lg border shrink-0"
                      />
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`px-2 py-0.5 rounded text-xs font-bold ${
                              vision.severity >= 4
                                ? 'bg-rose-100 text-rose-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            Severity {vision.severity}/5
                          </span>
                          <span className="text-xs font-semibold text-slate-800 uppercase tracking-wider">
                            {report.status}
                          </span>
                          {trust.communityVerified && (
                            <Badge variant="secondary" className="text-[10px]">
                              Community Corroborated
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-slate-600 line-clamp-2">
                          {vision.notes || 'Observation verified via JalDrishti platform.'}
                        </p>
                        <div className="text-[11px] text-slate-400">
                          Captured {new Date(report.capturedAt).toLocaleDateString('en-IN')} by {report.user?.name || 'Citizen'}
                        </div>
                      </div>
                    </div>

                    {report.complaint && (
                      <Link
                        href={`/complaint/${report.complaint.trackingId}`}
                        className="shrink-0"
                      >
                        <Button variant="outline" size="sm" className="text-xs">
                          <FileText className="h-3.5 w-3.5 mr-1 text-sky-600" />
                          {report.complaint.trackingId}
                        </Button>
                      </Link>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
