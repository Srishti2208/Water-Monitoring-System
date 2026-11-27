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
  PlusCircle,
  Navigation,
  ExternalLink,
  MapPin,
  X,
  CheckCircle2,
} from 'lucide-react';
import { HotspotMap } from '@/components/map/HotspotMap';
import { getHealthBand } from '@/services/healthScore';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface MapClientViewProps {
  initialLakes: any[];
  initialReports: any[];
}

export function MapClientView({ initialLakes, initialReports }: MapClientViewProps) {
  const [lakes, setLakes] = useState<any[]>(initialLakes);
  const [selectedLakeId, setSelectedLakeId] = useState<string | null>(null);
  const [pollutionFilter, setPollutionFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [timeWindowDays, setTimeWindowDays] = useState<number>(90);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(true);

  // Add Lake Modal State
  const [showAddLakeModal, setShowAddLakeModal] = useState<boolean>(false);
  const [newLakeName, setNewLakeName] = useState('');
  const [newLakeWard, setNewLakeWard] = useState('');
  const [newLakeLat, setNewLakeLat] = useState('12.9716');
  const [newLakeLng, setNewLakeLng] = useState('77.5946');
  const [newLakeScore, setNewLakeScore] = useState('75');
  const [isSubmittingLake, setIsSubmittingLake] = useState(false);
  const [lakeSuccessMsg, setLakeSuccessMsg] = useState<string | null>(null);
  const [lakeErrorMsg, setLakeErrorMsg] = useState<string | null>(null);

  const filteredLakes = lakes.filter(
    (lake) =>
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

  const handleCreateLake = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingLake(true);
    setLakeErrorMsg(null);
    setLakeSuccessMsg(null);

    try {
      const res = await fetch('/api/lakes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newLakeName,
          ward: newLakeWard,
          lat: newLakeLat,
          lng: newLakeLng,
          currentHealthScore: newLakeScore,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to create lake');
      }

      setLakes((prev) => [data.lake, ...prev]);
      setSelectedLakeId(data.lake.id);
      setLakeSuccessMsg(`Lake "${data.lake.name}" registered successfully!`);
      setTimeout(() => {
        setShowAddLakeModal(false);
        setLakeSuccessMsg(null);
        setNewLakeName('');
        setNewLakeWard('');
      }, 1500);
    } catch (err: any) {
      setLakeErrorMsg(err.message || 'Error creating lake');
    } finally {
      setIsSubmittingLake(false);
    }
  };

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
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAddLakeModal(true)}
              className="h-7 text-[11px] px-2 flex items-center gap-1 border-sky-300 text-sky-700 hover:bg-sky-50 font-bold"
            >
              <PlusCircle className="h-3.5 w-3.5 text-sky-600" />
              + Add Lake
            </Button>
          </div>

          {/* Quick Jump Dropdown to Navigate Directly on Map */}
          <div>
            <label className="text-[11px] font-bold text-slate-700 flex items-center gap-1 mb-1">
              <Navigation className="h-3 w-3 text-teal-600" /> Jump Directly to Lake on Map
            </label>
            <select
              value={selectedLakeId || ''}
              onChange={(e) => setSelectedLakeId(e.target.value || null)}
              className="w-full text-xs h-8 px-2 rounded-md border border-slate-300 bg-white text-slate-800 font-semibold focus:ring-1 focus:ring-sky-500"
            >
              <option value="">-- Choose a lake to center &amp; navigate --</option>
              {lakes.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name} ({l.ward}) — Score: {l.currentHealthScore}
                </option>
              ))}
            </select>
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
              placeholder={`Search ${lakes.length} Bengaluru lakes or wards...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-xs pl-8 pr-3 py-1.5 rounded border bg-white focus:outline-none focus:ring-1 focus:ring-sky-500"
            />
          </div>
        </div>

        {/* Lake Health Ranking List */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
          <div className="px-4 py-2 bg-slate-100/60 text-[10px] font-bold uppercase text-slate-500 tracking-wider flex justify-between">
            <span>Lake Registry ({lakes.length} Lakes)</span>
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
                      <span title="Improving">
                        <TrendingUp className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                      </span>
                    )}
                    {lake.trend === 'DECLINING' && (
                      <span title="Declining">
                        <TrendingDown className="h-3.5 w-3.5 text-rose-600 shrink-0" />
                      </span>
                    )}
                    {lake.trend === 'STABLE' && (
                      <span title="Stable">
                        <Minus className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-500 truncate">{lake.ward}</div>

                  <div className="flex items-center gap-3 mt-1 text-[10px]">
                    <Link
                      href={`/lake/${lake.id}`}
                      className="text-sky-600 hover:underline font-semibold"
                      onClick={(e) => e.stopPropagation()}
                    >
                      History &rarr;
                    </Link>
                    <a
                      href={`https://www.google.com/maps/dir/?api=1&destination=${lake.lat},${lake.lng}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-teal-700 hover:text-teal-900 font-semibold flex items-center gap-0.5 hover:underline"
                      onClick={(e) => e.stopPropagation()}
                      title="Open Turn-by-Turn GPS Directions in Google Maps"
                    >
                      <span>📍 Directions</span>
                    </a>
                  </div>
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
          lakes={lakes}
          reports={initialReports}
          selectedLakeId={selectedLakeId}
          onSelectLake={(id) => setSelectedLakeId(id)}
          filterLabel={pollutionFilter}
          filterStatus={statusFilter}
          timeWindowDays={timeWindowDays}
        />
      </div>

      {/* ADD NEW LAKE MODAL */}
      {showAddLakeModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-sky-600" />
                <h3 className="font-bold text-base text-slate-900">Register New Lake in Bengaluru</h3>
              </div>
              <button
                onClick={() => setShowAddLakeModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {lakeSuccessMsg && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-lg flex items-center gap-2 font-medium">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                {lakeSuccessMsg}
              </div>
            )}

            {lakeErrorMsg && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-lg font-medium">
                {lakeErrorMsg}
              </div>
            )}

            <form onSubmit={handleCreateLake} className="space-y-3.5 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Lake Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Yelahanka Lake"
                  value={newLakeName}
                  onChange={(e) => setNewLakeName(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-sky-500 font-medium"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Ward / Locality *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ward 4 - Yelahanka Satellite Town"
                  value={newLakeWard}
                  onChange={(e) => setNewLakeWard(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-sky-500 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Latitude (°N) *</label>
                  <input
                    type="number"
                    step="0.0001"
                    required
                    value={newLakeLat}
                    onChange={(e) => setNewLakeLat(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-sky-500 font-mono"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Longitude (°E) *</label>
                  <input
                    type="number"
                    step="0.0001"
                    required
                    value={newLakeLng}
                    onChange={(e) => setNewLakeLng(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-sky-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Baseline Health Score (0–100): <span className="text-sky-700 font-mono">{newLakeScore}</span>
                </label>
                <input
                  type="range"
                  min="10"
                  max="100"
                  value={newLakeScore}
                  onChange={(e) => setNewLakeScore(e.target.value)}
                  className="w-full accent-sky-600"
                />
                <div className="flex justify-between text-[10px] text-slate-400 font-semibold mt-0.5">
                  <span>0 (Critical)</span>
                  <span>50 (Moderate)</span>
                  <span>100 (Clean)</span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowAddLakeModal(false)}
                  disabled={isSubmittingLake}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="civic"
                  disabled={isSubmittingLake}
                  className="flex items-center gap-1.5"
                >
                  {isSubmittingLake ? 'Saving...' : 'Register Lake'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
