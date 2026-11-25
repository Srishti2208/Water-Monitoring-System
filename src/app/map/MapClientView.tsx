'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  SlidersHorizontal,
  Layers,
  ChevronRight,
  Filter,
  Calendar,
  AlertOctagon,
  Search,
} from 'lucide-react';
import { HotspotMap } from '@/components/map/HotspotMap';
import { getHealthBand } from '@/services/healthScore';
import { Badge } from '@/components/ui/badge';

interface MapClientViewProps {
  initialLakes: any[];
  initialReports: any[];
}

export function MapClientView({ initialLakes, initialReports }: MapClientViewProps) {
  const [selectedLakeId, setSelectedLakeId] = useState<string | null>(null);
  const [pollutionFilter, setPollutionFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [timeWindowDays, setTimeWindowDays] = useState<number>(90);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(true);

  const filteredLakes = initialLakes.filter((lake) =>
    lake.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    lake.ward.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const timeOptions = [
    { label: '24 Hours', days: 1 },
    { label: '7 Days', days: 7 },
    { label: '30 Days', days: 30 },
    { label: '90 Days', days: 90 },
  ];

  const pollutionTypes = [
    { label: 'All Violations', value: 'ALL' },
    { label: 'Foam', value: 'foam' },
    { label: 'Sewage Inflow', value: 'sewage_inflow' },
    { label: 'Algal Bloom', value: 'algal_bloom' },
    { label: 'Solid Waste', value: 'solid_waste' },
    { label: 'Construction Debris', value: 'construction_debris' },
    { label: 'Dead Fish', value: 'dead_fish' },
  ];

  return (
    <div className="flex-1 flex flex-col md:flex-row h-full overflow-hidden relative">
      {/* Sidebar Controls & Lake Rankings */}
      <div
        className={`w-full md:w-80 lg:w-96 bg-white border-r flex flex-col h-full z-20 transition-all ${
          sidebarOpen ? 'flex' : 'hidden md:flex'
        }`}
      >
        {/* Filter Controls Header */}
        <div className="p-4 border-b space-y-3 bg-slate-50/70">
          <div className="flex items-center justify-between">
            <h2 className="font-extrabold text-sm text-slate-900 flex items-center gap-1.5 uppercase tracking-wider">
              <Layers className="h-4 w-4 text-sky-600" />
              Hotspot Telemetry
            </h2>
            <span className="text-xs text-slate-500 font-medium">
              {initialReports.length} Reports Logged
            </span>
          </div>

          {/* Time Slider / Segmented Controls */}
          <div>
            <div className="flex items-center justify-between text-xs mb-1 text-slate-600 font-semibold">
              <span className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5 text-teal-600" /> Time Aggregation
              </span>
              <span className="text-sky-700 font-bold">{timeWindowDays} Days</span>
            </div>
            <div className="grid grid-cols-4 gap-1 bg-slate-200/80 p-0.5 rounded-md">
              {timeOptions.map((opt) => (
                <button
                  key={opt.days}
                  onClick={() => setTimeWindowDays(opt.days)}
                  className={`py-1 text-[11px] font-semibold rounded transition-all ${
                    timeWindowDays === opt.days
                      ? 'bg-white text-sky-800 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Pollution Category Filter */}
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-slate-600 flex items-center gap-1">
              <Filter className="h-3 w-3 text-sky-600" /> Filter by Pollution Signature
            </label>
            <select
              value={pollutionFilter}
              onChange={(e) => setPollutionFilter(e.target.value)}
              className="w-full text-xs h-8 px-2 rounded border bg-white text-slate-800 font-medium focus:ring-1 focus:ring-sky-500"
            >
              {pollutionTypes.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          {/* Lake Search Input */}
          <div className="relative">
            <Search className="h-3.5 w-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            <input
              type="text"
              placeholder="Search 12 Bengaluru lakes or wards..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-xs pl-8 pr-3 py-1.5 rounded border bg-white focus:outline-none focus:ring-1 focus:ring-sky-500"
            />
          </div>
        </div>

        {/* Lake Health Ranking List */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
          <div className="px-4 py-2 bg-slate-100/60 text-[10px] font-bold uppercase text-slate-500 tracking-wider flex justify-between">
            <span>Lake Registry (Ranked by Vulnerability)</span>
            <span>Health Score</span>
          </div>

          {filteredLakes.map((lake) => {
            const band = getHealthBand(lake.currentHealthScore);
            const isSelected = selectedLakeId === lake.id;

            return (
              <div
                key={lake.id}
                onClick={() => setSelectedLakeId(lake.id)}
                className={`p-3 cursor-pointer transition-colors hover:bg-sky-50/50 flex items-center justify-between ${
                  isSelected ? 'bg-sky-50 border-l-4 border-sky-600' : ''
                }`}
              >
                <div className="min-w-0 pr-2">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-xs text-slate-900 truncate">
                      {lake.name}
                    </span>
                    {lake.trend === 'IMPROVING' && (
                      <span title="Improving"><TrendingUp className="h-3.5 w-3.5 text-emerald-600 shrink-0" /></span>
                    )}
                    {lake.trend === 'DECLINING' && (
                      <span title="Declining"><TrendingDown className="h-3.5 w-3.5 text-rose-600 shrink-0" /></span>
                    )}
                    {lake.trend === 'STABLE' && (
                      <span title="Stable"><Minus className="h-3.5 w-3.5 text-slate-400 shrink-0" /></span>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-500 truncate">{lake.ward}</div>
                  <Link
                    href={`/lake/${lake.id}`}
                    className="text-[10px] text-sky-600 hover:underline font-semibold inline-block mt-0.5"
                    onClick={(e) => e.stopPropagation()}
                  >
                    View History &rarr;
                  </Link>
                </div>

                <div className="flex flex-col items-end shrink-0">
                  <div
                    className="h-8 w-11 rounded font-extrabold text-xs flex items-center justify-center text-white shadow-xs"
                    style={{ backgroundColor: band.color }}
                  >
                    {lake.currentHealthScore}
                  </div>
                  <span className="text-[9px] text-slate-400 mt-0.5 font-medium">/ 100</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Interactive Map Canvas */}
      <div className="flex-1 h-full w-full relative">
        <HotspotMap
          lakes={initialLakes}
          reports={initialReports}
          selectedLakeId={selectedLakeId}
          onSelectLake={(id) => setSelectedLakeId(id)}
          filterLabel={pollutionFilter}
          filterStatus={statusFilter}
          timeWindowDays={timeWindowDays}
        />
      </div>
    </div>
  );
}
