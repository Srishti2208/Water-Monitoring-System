'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Droplets,
  Map,
  PlusCircle,
  FileText,
  Trophy,
  ShieldAlert,
  BarChart3,
  Settings,
  Bell,
  UserCheck,
  Menu,
  X,
  WifiOff,
} from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';

export function Navbar() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    setIsOnline(navigator.onLine);
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Fetch notifications
    const fetchNotifications = async () => {
      try {
        const res = await fetch('/api/subscriptions');
        if (res.ok) {
          const data = await res.json();
          if (data.notifications) {
            setNotifications(data.notifications);
            setUnreadCount(data.notifications.length);
          }
        }
      } catch (e) {
        // Silent catch for offline
      }
    };

    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000); // 30s poll

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, []);

  const navLinks = [
    { href: '/map', label: 'Hotspot Map', icon: Map },
    { href: '/report', label: 'Report Pollution', icon: PlusCircle, highlight: true },
    { href: '/my-reports', label: 'My Reports', icon: FileText },
    { href: '/leaderboard', label: 'Leaderboard', icon: Trophy },
    { href: '/official', label: 'Official Desk', icon: ShieldAlert, role: 'OFFICIAL' },
    { href: '/accountability', label: 'Accountability', icon: BarChart3 },
    { href: '/admin', label: 'Admin', icon: Settings },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80 shadow-xs">
      {!isOnline && (
        <div className="bg-amber-500 text-white text-xs px-4 py-1 text-center font-medium flex items-center justify-center gap-2">
          <WifiOff className="h-3.5 w-3.5" />
          Offline Mode Active — Reports will be saved locally to IndexedDB and automatically synchronized when reconnected.
        </div>
      )}

      <div className="container flex h-16 items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 font-bold text-slate-900 group">
          <div className="h-9 w-9 rounded-lg bg-gradient-to-tr from-sky-600 to-teal-500 flex items-center justify-center text-white shadow-sm group-hover:scale-105 transition-transform">
            <Droplets className="h-5 w-5" />
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-extrabold tracking-tight bg-gradient-to-r from-sky-800 to-teal-700 bg-clip-text text-transparent">
              JalDrishti
            </span>
            <span className="text-[10px] text-slate-500 font-semibold tracking-wider uppercase -mt-1">
              Autonomous Lake &amp; Water Quality Governance
            </span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-1 text-sm font-medium">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href || (link.href !== '/' && pathname.startsWith(link.href));
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-colors ${
                  link.highlight
                    ? 'bg-sky-600 text-white hover:bg-sky-700 font-semibold shadow-xs'
                    : isActive
                    ? 'bg-sky-50 text-sky-800 font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Icon className={`h-4 w-4 ${link.highlight ? 'text-white' : isActive ? 'text-sky-700' : 'text-slate-400'}`} />
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Right Actions: Notifications + Role Switcher / Login */}
        <div className="flex items-center gap-2">
          {/* Notification Bell */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-full relative transition-colors"
              title="Lake Subscriptions & Updates"
            >
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 h-4 w-4 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {/* Notifications Dropdown */}
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white border rounded-lg shadow-xl p-3 z-50 text-left">
                <div className="flex items-center justify-between pb-2 border-b">
                  <h4 className="font-semibold text-xs text-slate-800 uppercase tracking-wider">
                    Subscribed Lake Updates
                  </h4>
                  <button
                    onClick={() => setUnreadCount(0)}
                    className="text-[11px] text-sky-600 hover:underline"
                  >
                    Mark read
                  </button>
                </div>
                <div className="max-h-72 overflow-y-auto divide-y mt-2">
                  {notifications.length === 0 ? (
                    <p className="text-xs text-slate-500 py-4 text-center">
                      No recent updates on subscribed lakes.
                    </p>
                  ) : (
                    notifications.map((n) => (
                      <div key={n.id} className="py-2.5 text-xs">
                        <div className="flex items-center justify-between font-medium text-slate-900">
                          <span>{n.report?.lake?.name || 'Lake Update'}</span>
                          <span className="text-[10px] text-slate-400">
                            {new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-slate-600 text-[11px] mt-0.5">{n.note || `${n.fromStatus} → ${n.toStatus}`}</p>
                        <span className="inline-block mt-1 text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-mono">
                          {n.toStatus}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Quick Demo Mode Badge */}
          <Link href="/login" className="hidden sm:flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 hover:bg-slate-200 border transition-colors">
            <UserCheck className="h-3.5 w-3.5 text-teal-600" />
            <span>Accounts</span>
          </Link>

          {/* Mobile menu button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-slate-600 hover:text-slate-900"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b bg-white px-4 pt-2 pb-4 space-y-1">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href || (link.href !== '/' && pathname.startsWith(link.href));
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-md text-sm font-medium ${
                  link.highlight
                    ? 'bg-sky-600 text-white'
                    : isActive
                    ? 'bg-sky-50 text-sky-800 font-semibold'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <Icon className="h-4 w-4" />
                {link.label}
              </Link>
            );
          })}
          <div className="pt-2 border-t mt-2">
            <Link
              href="/login"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2 px-3 py-2 text-sm text-slate-700 font-medium hover:bg-slate-100 rounded-md"
            >
              <UserCheck className="h-4 w-4 text-teal-600" />
              Switch Demo Role (Citizen / Official / Admin)
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
