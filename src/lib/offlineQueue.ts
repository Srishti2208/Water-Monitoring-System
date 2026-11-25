import Dexie, { Table } from 'dexie';

export interface QueuedReport {
  id?: number;
  photoBlob?: Blob;
  photoName?: string;
  photoDataUrl?: string;
  hasExifGps: boolean;
  hasExifTimestamp: boolean;
  lat: number;
  lng: number;
  capturedAt: string; // ISO string
  readings: {
    ph?: number;
    transparencyCmBucket?: string;
    tempC?: number;
  };
  observations: {
    odor: string;
    color: string;
    foam: boolean;
    waste: boolean;
    deadFish: boolean;
  };
  lakeId?: string;
  queuedAt: string;
  status: 'PENDING' | 'SYNCING' | 'FAILED';
  errorMessage?: string;
}

export class JalDrishtiOfflineDb extends Dexie {
  queuedReports!: Table<QueuedReport, number>;

  constructor() {
    super('JalDrishtiOfflineDB');
    this.version(1).stores({
      queuedReports: '++id, queuedAt, status',
    });
  }
}

export const offlineDb = typeof window !== 'undefined' ? new JalDrishtiOfflineDb() : null;

/**
 * Queue a report offline in IndexedDB
 */
export async function queueOfflineReport(report: Omit<QueuedReport, 'id' | 'queuedAt' | 'status'>): Promise<number> {
  if (!offlineDb) throw new Error('IndexedDB offline storage not available');
  
  return await offlineDb.queuedReports.add({
    ...report,
    queuedAt: new Date().toISOString(),
    status: 'PENDING',
  });
}

/**
 * Sync all pending queued reports to server
 */
export async function flushOfflineQueue(
  onProgress?: (synced: number, total: number) => void
): Promise<{ syncedCount: number; errors: any[] }> {
  if (!offlineDb) return { syncedCount: 0, errors: [] };

  const pending = await offlineDb.queuedReports.where('status').equals('PENDING').toArray();
  if (pending.length === 0) return { syncedCount: 0, errors: [] };

  let syncedCount = 0;
  const errors: any[] = [];

  for (let i = 0; i < pending.length; i++) {
    const item = pending[i];
    try {
      await offlineDb.queuedReports.update(item.id!, { status: 'SYNCING' });

      const formData = new FormData();
      if (item.photoBlob) {
        formData.append('photo', item.photoBlob, item.photoName || 'evidence.jpg');
      }

      formData.append(
        'data',
        JSON.stringify({
          lat: item.lat,
          lng: item.lng,
          capturedAt: item.capturedAt,
          hasExifGps: item.hasExifGps,
          hasExifTimestamp: item.hasExifTimestamp,
          readings: item.readings,
          observations: item.observations,
          lakeId: item.lakeId,
        })
      );

      const res = await fetch('/api/reports', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || `HTTP ${res.status}`);
      }

      // Success: Remove from offline queue
      await offlineDb.queuedReports.delete(item.id!);
      syncedCount++;
      if (onProgress) onProgress(syncedCount, pending.length);
    } catch (err: any) {
      console.error('Failed to sync offline report:', err);
      errors.push({ id: item.id, error: err.message });
      await offlineDb.queuedReports.update(item.id!, {
        status: 'FAILED',
        errorMessage: err.message,
      });
    }
  }

  return { syncedCount, errors };
}
