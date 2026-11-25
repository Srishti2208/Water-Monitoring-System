'use client';

import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';

interface MiniMapProps {
  lat: number;
  lng: number;
  zoom?: number;
  title?: string;
}

const DynamicLeafletMap = dynamic(
  async () => {
    const L = await import('leaflet');
    const { MapContainer, TileLayer, Marker, Popup, useMap } = await import('react-leaflet');

    // Fix default marker icon in Leaflet
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
      iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    });

    function RecenterMap({ lat, lng }: { lat: number; lng: number }) {
      const map = useMap();
      useEffect(() => {
        map.setView([lat, lng], map.getZoom());
      }, [lat, lng, map]);
      return null;
    }

    return function LeafletMiniMap({ lat, lng, zoom = 14, title = 'Reported Location' }: MiniMapProps) {
      return (
        <MapContainer
          center={[lat, lng]}
          zoom={zoom}
          scrollWheelZoom={false}
          className="h-full w-full rounded-md"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <RecenterMap lat={lat} lng={lng} />
          <Marker position={[lat, lng]}>
            <Popup>{title}</Popup>
          </Marker>
        </MapContainer>
      );
    };
  },
  {
    ssr: false,
    loading: () => (
      <div className="h-full w-full bg-slate-100 flex items-center justify-center text-xs text-slate-500 animate-pulse rounded-md">
        Loading Satellite Map Coordinates...
      </div>
    ),
  }
);

export function MiniMap(props: MiniMapProps) {
  return <DynamicLeafletMap {...props} />;
}
