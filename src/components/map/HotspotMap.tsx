'use client';

import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { getHealthBand } from '@/services/healthScore';

export interface HotspotMapProps {
  lakes: Array<{
    id: string;
    name: string;
    ward: string;
    lat: number;
    lng: number;
    currentHealthScore: number;
    trend: string;
  }>;
  reports: Array<{
    id: string;
    lat: number;
    lng: number;
    photoPaths: string;
    status: string;
    capturedAt: string;
    readings: string;
    observations: string;
    vision: string | null;
    trust: string;
    complaint?: {
      id: string;
      trackingId: string;
      priority: string;
    } | null;
    lake?: {
      id: string;
      name: string;
    };
  }>;
  selectedLakeId?: string | null;
  onSelectLake?: (lakeId: string) => void;
  filterLabel?: string;
  filterStatus?: string;
  timeWindowDays?: number; // 1, 7, 30, 90
}

const DynamicInteractiveMap = dynamic(
  async () => {
    const L = await import('leaflet');
    const { MapContainer, TileLayer, Marker, Popup, Circle, CircleMarker, useMap } = await import('react-leaflet');

    // Default icon fix
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
      iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    });

    // Custom colored div icons for lakes
    function createLakeIcon(score: number, name: string) {
      const band = getHealthBand(score);
      return L.divIcon({
        className: 'custom-lake-pin',
        html: `
          <div style="
            background-color: ${band.color};
            color: white;
            font-weight: bold;
            font-size: 11px;
            width: 32px;
            height: 32px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            border: 2.5px solid white;
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
          ">
            ${score}
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });
    }

    function createReportIcon(severity: number) {
      const color = severity >= 4 ? '#ef4444' : severity === 3 ? '#f59e0b' : '#3b82f6';
      return L.divIcon({
        className: 'custom-report-pin',
        html: `
          <div style="
            background-color: ${color};
            width: 14px;
            height: 14px;
            border-radius: 50%;
            border: 2px solid white;
            box-shadow: 0 1px 4px rgba(0,0,0,0.4);
          "></div>
        `,
        iconSize: [14, 14],
        iconAnchor: [7, 7],
      });
    }

    function MapController({ selectedLake, lakes }: { selectedLake?: any; lakes: any[] }) {
      const map = useMap();
      useEffect(() => {
        if (selectedLake) {
          map.flyTo([selectedLake.lat, selectedLake.lng], 15, { duration: 1.2 });
        }
      }, [selectedLake, map]);
      return null;
    }

    return function InteractiveMapComponent({
      lakes,
      reports,
      selectedLakeId,
      onSelectLake,
      filterLabel = 'ALL',
      filterStatus = 'ALL',
      timeWindowDays = 90,
    }: HotspotMapProps) {
      const [showHeatmap, setShowHeatmap] = useState(true);
      const [showReports, setShowReports] = useState(true);

      const selectedLake = lakes.find((l) => l.id === selectedLakeId);

      // Filter reports by time window, label, and status
      const now = new Date().getTime();
      const cutoffTime = now - timeWindowDays * 24 * 60 * 60 * 1000;

      const filteredReports = reports.filter((r) => {
        const repTime = new Date(r.capturedAt).getTime();
        if (repTime < cutoffTime) return false;

        const vision = r.vision ? JSON.parse(r.vision) : { labels: [] };
        if (filterLabel !== 'ALL' && !vision.labels?.includes(filterLabel.toLowerCase())) {
          return false;
        }
        if (filterStatus !== 'ALL' && r.status !== filterStatus) {
          return false;
        }
        return true;
      });

      return (
        <div className="relative h-full w-full">
          {/* Map Layer Controls floating top-right */}
          <div className="absolute top-3 right-3 z-[1000] bg-white/95 backdrop-blur rounded-lg p-2 shadow-md border text-xs flex items-center gap-2">
            <button
              onClick={() => setShowHeatmap(!showHeatmap)}
              className={`px-2.5 py-1 rounded font-medium transition-colors ${
                showHeatmap ? 'bg-sky-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {showHeatmap ? '✓ Heatmap' : 'Heatmap'}
            </button>
            <button
              onClick={() => setShowReports(!showReports)}
              className={`px-2.5 py-1 rounded font-medium transition-colors ${
                showReports ? 'bg-teal-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {showReports ? '✓ Reports' : 'Reports'}
            </button>
          </div>

          <MapContainer
            center={[12.9716, 77.6412]} // Central Bengaluru
            zoom={12}
            scrollWheelZoom={true}
            className="h-full w-full"
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            <MapController selectedLake={selectedLake} lakes={lakes} />

            {/* Heatmap overlay represented via severity-scaled semi-transparent radial gradient circles */}
            {showHeatmap &&
              filteredReports.map((r) => {
                const vision = r.vision ? JSON.parse(r.vision) : { severity: 3 };
                const severity = vision.severity || 3;
                const radius = 200 + severity * 80; // 280m to 600m
                const color = severity >= 4 ? '#ef4444' : severity === 3 ? '#f59e0b' : '#38bdf8';
                const opacity = 0.15 + (severity / 5) * 0.25;

                return (
                  <Circle
                    key={`heat-${r.id}`}
                    center={[r.lat, r.lng]}
                    radius={radius}
                    pathOptions={{
                      fillColor: color,
                      fillOpacity: opacity,
                      color: color,
                      weight: 1,
                      opacity: opacity * 1.2,
                    }}
                  />
                );
              })}

            {/* Individual Report Markers */}
            {showReports &&
              filteredReports.map((r) => {
                const photos = JSON.parse(r.photoPaths || '[]');
                const vision = r.vision ? JSON.parse(r.vision) : { severity: 3, labels: [], notes: '' };
                const trust = JSON.parse(r.trust || '{}');
                const photoSrc = photos[0] || '/demo-images/solid_waste.jpg';

                return (
                  <Marker
                    key={`rep-${r.id}`}
                    position={[r.lat, r.lng]}
                    icon={createReportIcon(vision.severity || 3)}
                  >
                    <Popup className="custom-report-popup">
                      <div className="w-56 text-xs text-slate-800">
                        <img
                          src={photoSrc}
                          alt="Evidence"
                          className="w-full h-28 object-cover rounded-md mb-2 border"
                        />
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold text-slate-900 text-sm">
                            {r.lake?.name || 'Lake Spot'}
                          </span>
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                              vision.severity >= 4
                                ? 'bg-red-100 text-red-700'
                                : 'bg-amber-100 text-amber-700'
                            }`}
                          >
                            Severity {vision.severity}/5
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-1 mb-1.5">
                          {vision.labels?.map((l: string) => (
                            <span key={l} className="bg-slate-100 text-slate-600 px-1 py-0.5 rounded text-[9px] uppercase font-semibold">
                              {l.replace('_', ' ')}
                            </span>
                          ))}
                        </div>
                        <p className="text-[11px] text-slate-600 line-clamp-2 mb-2">
                          {vision.notes}
                        </p>
                        <div className="flex items-center justify-between text-[10px] border-t pt-1.5 text-slate-500">
                          <span>Status: <strong className="text-slate-800">{r.status}</strong></span>
                          <div className="flex items-center gap-2">
                            <a
                              href={`https://www.google.com/maps/dir/?api=1&destination=${r.lat},${r.lng}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-teal-700 font-bold hover:underline"
                            >
                              📍 GPS
                            </a>
                            {r.complaint && (
                              <Link
                                href={`/complaint/${r.complaint.trackingId}`}
                                className="text-sky-600 font-bold hover:underline"
                              >
                                Notice &rarr;
                              </Link>
                            )}
                          </div>
                        </div>
                      </div>
                    </Popup>
                  </Marker>
                );
              })}

            {/* 12 Bengaluru Lakes Centroid Markers */}
            {lakes.map((lake) => {
              const band = getHealthBand(lake.currentHealthScore);
              return (
                <Marker
                  key={`lake-${lake.id}`}
                  position={[lake.lat, lake.lng]}
                  icon={createLakeIcon(lake.currentHealthScore, lake.name)}
                  eventHandlers={{
                    click: () => onSelectLake && onSelectLake(lake.id),
                  }}
                >
                  <Popup>
                    <div className="text-xs w-48 text-slate-800">
                      <h4 className="font-bold text-sm text-slate-900">{lake.name}</h4>
                      <p className="text-slate-500 text-[11px] mb-2">{lake.ward}</p>
                      <div className="flex items-center justify-between bg-slate-50 p-2 rounded border mb-2">
                        <div>
                          <div className="text-[10px] text-slate-400 font-semibold uppercase">Health Score</div>
                          <div className="text-lg font-extrabold" style={{ color: band.color }}>
                            {lake.currentHealthScore} / 100
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider bg-slate-200 text-slate-700">
                            {lake.trend}
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-col gap-1.5 mt-2">
                        <Link
                          href={`/lake/${lake.id}`}
                          className="block text-center bg-sky-600 text-white font-semibold py-1 rounded hover:bg-sky-700 transition-colors text-[11px]"
                        >
                          View Lake Analytics &rarr;
                        </Link>
                        <a
                          href={`https://www.google.com/maps/dir/?api=1&destination=${lake.lat},${lake.lng}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block text-center bg-teal-50 border border-teal-200 text-teal-800 font-semibold py-1 rounded hover:bg-teal-100 transition-colors text-[11px]"
                        >
                          📍 Navigate (Google Maps) ↗
                        </a>
                      </div>
                    </div>
                  </Popup>
                </Marker>
              );
            })}
          </MapContainer>
        </div>
      );
    };
  },
  {
    ssr: false,
    loading: () => (
      <div className="h-full w-full bg-slate-100 flex flex-col items-center justify-center gap-2 text-slate-500 animate-pulse">
        <div className="h-8 w-8 rounded-full border-2 border-sky-600 border-t-transparent animate-spin" />
        <span className="text-xs font-medium">Initializing Bengaluru GIS Engine &amp; Satellite Layer...</span>
      </div>
    ),
  }
);

export function HotspotMap(props: HotspotMapProps) {
  return <DynamicInteractiveMap {...props} />;
}
