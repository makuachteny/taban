/**
 * Sync Service — manages PouchDB ↔ CouchDB live replication for a single database.
 *
 * Features:
 *  - Live replication with retry
 *  - Connection state tracking
 *  - Conflict resolution (latest-write-wins via updatedAt)
 *  - Org-scoped filter replication
 */

import PouchDB from 'pouchdb-browser';
import type { SyncDirection } from './sync-config';

export type SyncState = 'idle' | 'connecting' | 'active' | 'paused' | 'error' | 'denied';

export interface SyncStatus {
  state: SyncState;
  lastSync: string | null;
  docsWritten: number;
  docsRead: number;
  error: string | null;
}

export interface SyncServiceOptions {
  localDB: PouchDB.Database;
  remoteUrl: string;
  direction: SyncDirection;
  /** If provided, only replicate docs where doc.orgId matches */
  orgId?: string;
  /** Callback when status changes */
  onChange?: (status: SyncStatus) => void;
}

const RETRY_DELAYS = [1000, 2000, 5000, 10000, 30000]; // escalating backoff

export class SyncService {
  private localDB: PouchDB.Database;
  private remoteDB: PouchDB.Database;
  private direction: SyncDirection;
  private orgId?: string;
  private onChange?: (status: SyncStatus) => void;

  private replication: PouchDB.Replication.Sync<object> | PouchDB.Replication.Replication<object> | null = null;
  private retryCount = 0;
  private retryTimer: ReturnType<typeof setTimeout> | null = null;
  private _status: SyncStatus = {
    state: 'idle',
    lastSync: null,
    docsWritten: 0,
    docsRead: 0,
    error: null,
  };

  constructor(opts: SyncServiceOptions) {
    this.localDB = opts.localDB;
    this.remoteDB = new PouchDB(opts.remoteUrl, { skip_setup: true });
    this.direction = opts.direction;
    this.orgId = opts.orgId;
    this.onChange = opts.onChange;
  }

  get status(): SyncStatus {
    return { ...this._status };
  }

  /** Start live replication */
  startSync(): void {
    this.cancelReplication();
    this.updateStatus({ state: 'connecting', error: null });

    const opts: PouchDB.Replication.ReplicateOptions = {
      live: true,
      retry: true,
      batch_size: 100,
      batches_limit: 5,
      // Filter by orgId when org-scoped
      ...(this.orgId ? {
        filter: (doc: Record<string, unknown>) => {
          // Allow design docs & docs without orgId (global)
          if ((doc._id as string)?.startsWith('_design/')) return true;
          if (!doc.orgId) return true;
          return doc.orgId === this.orgId;
        },
      } : {}),
    };

    if (this.direction === 'both') {
      const rep = this.localDB.sync(this.remoteDB, opts);
      this.attachListeners(rep);
      this.replication = rep;
    } else if (this.direction === 'push') {
      const rep = this.localDB.replicate.to(this.remoteDB, opts);
      this.attachListeners(rep);
      this.replication = rep;
    } else {
      const rep = this.localDB.replicate.from(this.remoteDB, opts);
      this.attachListeners(rep);
      this.replication = rep;
    }
  }

  /** Stop replication */
  stopSync(): void {
    this.cancelReplication();
    this.clearRetryTimer();
    this.updateStatus({ state: 'idle' });
  }

  /** Force a one-time sync (non-live) and return when complete */
  async syncNow(): Promise<void> {
    const opts: PouchDB.Replication.ReplicateOptions = {
      batch_size: 200,
      ...(this.orgId ? {
        filter: (doc: Record<string, unknown>) => {
          if ((doc._id as string)?.startsWith('_design/')) return true;
          if (!doc.orgId) return true;
          return doc.orgId === this.orgId;
        },
      } : {}),
    };

    this.updateStatus({ state: 'active', error: null });

    try {
      if (this.direction === 'both') {
        const result = await this.localDB.sync(this.remoteDB, opts);
        this.updateStatus({
          state: 'idle',
          lastSync: new Date().toISOString(),
          docsWritten: this._status.docsWritten + (result.push?.docs_written || 0),
          docsRead: this._status.docsRead + (result.pull?.docs_read || 0),
        });
      } else if (this.direction === 'push') {
        const result = await this.localDB.replicate.to(this.remoteDB, opts);
        this.updateStatus({
          state: 'idle',
          lastSync: new Date().toISOString(),
          docsWritten: this._status.docsWritten + (result.docs_written || 0),
        });
      } else {
        const result = await this.localDB.replicate.from(this.remoteDB, opts);
        this.updateStatus({
          state: 'idle',
          lastSync: new Date().toISOString(),
          docsRead: this._status.docsRead + (result.docs_read || 0),
        });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Sync failed';
      this.updateStatus({ state: 'error', error: msg });
      throw err;
    }
  }

  /** Resolve conflicts using latest-write-wins (updatedAt timestamp) */
  async resolveConflicts(docId: string): Promise<void> {
    try {
      const doc = await this.localDB.get(docId, { conflicts: true }) as PouchDB.Core.IdMeta & PouchDB.Core.GetMeta & { updatedAt?: string; _conflicts?: string[] };
      const conflicts = doc._conflicts;
      if (!conflicts || conflicts.length === 0) return;

      // Fetch all conflicting revisions
      const revDocs = await Promise.all(
        conflicts.map(rev => this.localDB.get(docId, { rev }) as Promise<PouchDB.Core.IdMeta & PouchDB.Core.GetMeta & { updatedAt?: string }>)
      );

      // Find the winner: the one with the latest updatedAt
      let winner = doc;
      for (const revDoc of revDocs) {
        if (revDoc.updatedAt && (!winner.updatedAt || revDoc.updatedAt > winner.updatedAt)) {
          winner = revDoc;
        }
      }

      // Delete losing revisions
      const losers = [doc, ...revDocs].filter(d => d._rev !== winner._rev);
      for (const loser of losers) {
        await this.localDB.remove(loser._id, loser._rev);
      }

      // If the winner wasn't the current doc, put it as the new head
      if (winner._rev !== doc._rev) {
        const winnerObj = winner as unknown as Record<string, unknown>;
        const { _rev: _unusedRev, ...data } = winnerObj;
        void _unusedRev;
        await this.localDB.put({ ...data, _id: docId } as PouchDB.Core.PutDocument<object>);
      }
    } catch {
      // Conflict resolution is best-effort
    }
  }

  destroy(): void {
    this.stopSync();
  }

  // --- Private helpers ---

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private attachListeners(rep: any): void {
    rep.on('change', (info: unknown) => {
      this.retryCount = 0;
      const changeInfo = info as { docs_written?: number; docs_read?: number; change?: { docs_read?: number; docs_written?: number } };
      const docsWritten = changeInfo.docs_written || changeInfo.change?.docs_written || 0;
      const docsRead = changeInfo.docs_read || changeInfo.change?.docs_read || 0;
      this.updateStatus({
        state: 'active',
        lastSync: new Date().toISOString(),
        docsWritten: this._status.docsWritten + docsWritten,
        docsRead: this._status.docsRead + docsRead,
      });
    });

    rep.on('paused', () => {
      // Paused means replication is up to date (or went offline)
      this.updateStatus({
        state: 'paused',
        lastSync: this._status.lastSync || new Date().toISOString(),
      });
    });

    rep.on('active', () => {
      this.updateStatus({ state: 'active', error: null });
    });

    rep.on('denied', (err: unknown) => {
      const msg = err instanceof Error ? err.message : 'Access denied';
      this.updateStatus({ state: 'denied', error: msg });
    });

    rep.on('error', (err: unknown) => {
      const msg = err instanceof Error ? err.message : 'Replication error';
      this.updateStatus({ state: 'error', error: msg });
      this.scheduleRetry();
    });

    rep.on('complete', () => {
      // Only fires when replication is cancelled or non-live ends
      if (this._status.state !== 'idle') {
        this.updateStatus({ state: 'idle' });
      }
    });
  }

  private scheduleRetry(): void {
    this.clearRetryTimer();
    const delay = RETRY_DELAYS[Math.min(this.retryCount, RETRY_DELAYS.length - 1)];
    this.retryCount++;
    this.retryTimer = setTimeout(() => {
      this.startSync();
    }, delay);
  }

  private cancelReplication(): void {
    if (this.replication) {
      (this.replication as { cancel?: () => void }).cancel?.();
      this.replication = null;
    }
  }

  private clearRetryTimer(): void {
    if (this.retryTimer) {
      clearTimeout(this.retryTimer);
      this.retryTimer = null;
    }
  }

  private updateStatus(partial: Partial<SyncStatus>): void {
    this._status = { ...this._status, ...partial };
    this.onChange?.(this.status);
  }
}
