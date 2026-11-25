import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Navbar } from '@/components/Navbar';
import { OfflineSyncBanner } from '@/components/OfflineSyncBanner';
import { ServiceWorkerRegister } from '@/components/ServiceWorkerRegister';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'JalDrishti — Bengaluru Lake & Water Quality Monitoring Platform',
  description:
    'Citizen-powered AI water pollution classification, real-time hotspot tracking, and autonomous statutory complaint escalation for Bengaluru lakes.',
  manifest: '/manifest.json',
};

export const viewport: Viewport = {
  themeColor: '#0284c7',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <head>
        <link
          rel="stylesheet"
          href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
          integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
          crossOrigin=""
        />
      </head>
      <body className={`${inter.className} min-h-full flex flex-col bg-slate-50 text-slate-900`}>
        <ServiceWorkerRegister />
        <Navbar />
        <OfflineSyncBanner />
        <main className="flex-1 flex flex-col">{children}</main>
        <footer className="border-t bg-white py-6 text-center text-xs text-slate-500">
          <div className="container flex flex-col sm:flex-row items-center justify-between gap-2">
            <p>© 2026 JalDrishti Platform • Civic-Tech Initiative for Bengaluru Waterbodies</p>
            <div className="flex items-center gap-4">
              <span className="inline-flex items-center gap-1 font-medium text-emerald-600">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" /> DEMO_MODE Active
              </span>
              <span>12 Lakes Tracked</span>
              <span>CPGRAMS / NGT Compliant</span>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
