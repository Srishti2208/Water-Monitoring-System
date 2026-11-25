'use client';

import React, { useState, useEffect } from 'react';
import { flushOfflineQueue, offlineDb } from '@/lib/offlineQueue';
import { Wifi, WifiOff, RefreshCw, CheckCircle2 } from 'lucide-react';
import { Button } from './ui/button';

export function OfflineSyncBanner() {
  const [isOnline, setIsOnline] = useState(true);
  const [pendingCount, setPendingCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncSuccessMsg, setSyncSuccessMsg] = useState<string | null>(null);

  const checkPending = async () => {
    if (offlineDb) {
      try {
        const count = await offlineDb.queuedReports.where('status').equals('PENDING').count();
        setPendingCount(count);
      } catch (e) {
        // ignore
      }
    }
  };

  useEffect(() => {
    setIsOnline(navigator.onLine);
    checkPending();

    const handleOnline = async () => {
      setIsOnline(true);
      await triggerSync();
    };

    const handleOffline = () => {
      setIsOnline(false);
      checkPending();
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const interval = setInterval(checkPending, 5000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, []);

  const triggerSync = async () => {
    if (isSyncing) return;
    setIsSyncing(true);
    setSyncSuccessMsg(null);
    try {
      const { syncedCount } = await flushOfflineQueue();
      if (syncedCount > 0) {
        setSyncSuccessMsg(`Successfully synchronized ${syncedCount} queued report(s) to server.`);
        setTimeout(() => setSyncSuccessMsg(null), 6000);
      }
      await checkPending();
    } catch (e) {
      console.error('Sync failed:', e);
    } finally {
      setIsSyncing(false);
    }
  };

  if (isOnline && pendingCount === 0 && !syncSuccessMsg) {
    return null;
  }

  return (
    <div className="w-full bg-slate-900 text-white px-4 py-2 text-sm shadow-md transition-all">
      <div className="container flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {!isOnline ? (
            <>
              <span className="flex h-2.5 w-2.5 rounded-full bg-amber-400 animate-pulse" />
              <WifiOff className="h-4 w-4 text-amber-400" />
              <span className="text-slate-200">
                You are currently offline. New reports will be safely stored in IndexedDB.
              </span>
            </>
          ) : syncSuccessMsg ? (
            <>
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              <span className="text-emerald-300 font-medium">{syncSuccessMsg}</span>
            </>
          ) : (
            <>
              <Wifi className="h-4 w-4 text-emerald-400" />
              <span className="text-slate-200">
                Connection restored. {pendingCount} report(s) ready to synchronize.
              </span>
            </>
          )}
        </div>

        {pendingCount > 0 && isOnline && (
          <Button
            size="sm"
            variant="teal"
            disabled={isSyncing}
            onClick={triggerSync}
            className="h-7 text-xs flex items-center gap-1.5"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
            {isSyncing ? 'Synchronizing...' : `Sync ${pendingCount} Report(s) Now`}
          </Button>
        )}
      </div>
    </div>
  );
}
