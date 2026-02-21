/**
 * Sync Manager — coordinates PouchDB ↔ CouchDB sync across all databases.
 *
 * Usage:
 *   const manager = new SyncManager({ orgId: 'org-123', onChange: cb });
 *   manager.startAll();    // begin syncing all databases
 *   manager.stopAll();     // tear down on logout
 *   manager.syncNow();     // force one-time sync
 */

import { getDB } from '../db';
import { SyncService, type SyncStatus } from './sync-service';
import {
  DATABASE_SYNC_CONFIGS,
  getRemoteUrl,
  getCouchDBUrl,
  isSyncEnabled,
} from './sync-config';

export type AggregateState = 'disabled' | 'idle' | 'syncing' | 'synced' | 'error' | 'offline';

export interface AggregateStatus {
  state: AggregateState;
  lastSync: string | null;
  totalDocsWritten: number;
  totalDocsRead: number;
  activeDatabases: number;
  errorDatabases: number;
  /** Per-database status keyed by local DB name */
  databases: Record<string, SyncStatus>;
}

export interface SyncManagerOptions {
  orgId?: string;
  onChange?: (status: AggregateStatus) => void;
}

export class SyncManager {
  private services: Map<string, SyncService> = new Map();
  private statuses: Map<string, SyncStatus> = new Map();
  private orgId?: string;
  private onChange?: (status: AggregateStatus) => void;
  private _started = false;

  constructor(opts: SyncManagerOptions = {}) {
    this.orgId = opts.orgId;
    this.onChange = opts.onChange;
  }

  /** Whether sync is enabled and the manager is running */
  get isRunning(): boolean {
    return this._started;
  }

  /** Start live sync for all configured databases */
  startAll(): void {
    if (!isSyncEnabled()) {
      this.notifyChange();
      return;
    }

    const couchdbUrl = getCouchDBUrl();

    for (const config of DATABASE_SYNC_CONFIGS) {
      const localDB = getDB(config.localName);
      const remoteUrl = getRemoteUrl(config.localName, couchdbUrl);

      const service = new SyncService({
        localDB,
        remoteUrl,
        direction: config.direction,
        orgId: config.orgScoped ? this.orgId : undefined,
        onChange: (status) => {
          this.statuses.set(config.localName, status);
          this.notifyChange();
        },
      });

      this.services.set(config.localName, service);
      service.startSync();
    }

    this._started = true;
    this.notifyChange();
  }

  /** Stop all sync services (call on logout) */
  stopAll(): void {
    for (const service of this.services.values()) {
      service.destroy();
    }
    this.services.clear();
    this.statuses.clear();
    this._started = false;
    this.notifyChange();
  }

  /** Force a one-shot sync on all databases */
  async syncNow(): Promise<void> {
    if (!isSyncEnabled()) return;

    const promises = Array.from(this.services.values()).map(service =>
      service.syncNow().catch(() => {
        // Individual failures are tracked per-DB
      })
    );
    await Promise.allSettled(promises);
  }

  /** Get the current aggregate status */
  getStatus(): AggregateStatus {
    if (!isSyncEnabled()) {
      return {
        state: 'disabled',
        lastSync: null,
        totalDocsWritten: 0,
        totalDocsRead: 0,
        activeDatabases: 0,
        errorDatabases: 0,
        databases: {},
      };
    }

    const databases: Record<string, SyncStatus> = {};
    let latestSync: string | null = null;
    let totalDocsWritten = 0;
    let totalDocsRead = 0;
    let activeDatabases = 0;
    let errorDatabases = 0;

    for (const [name, status] of this.statuses) {
      databases[name] = status;
      totalDocsWritten += status.docsWritten;
      totalDocsRead += status.docsRead;

      if (status.lastSync && (!latestSync || status.lastSync > latestSync)) {
        latestSync = status.lastSync;
      }
      if (status.state === 'active' || status.state === 'connecting') {
        activeDatabases++;
      }
      if (status.state === 'error' || status.state === 'denied') {
        errorDatabases++;
      }
    }

    let state: AggregateState;
    if (!navigator.onLine) {
      state = 'offline';
    } else if (errorDatabases > 0 && activeDatabases === 0) {
      state = 'error';
    } else if (activeDatabases > 0) {
      state = 'syncing';
    } else if (latestSync) {
      state = 'synced';
    } else {
      state = 'idle';
    }

    return {
      state,
      lastSync: latestSync,
      totalDocsWritten,
      totalDocsRead,
      activeDatabases,
      errorDatabases,
      databases,
    };
  }

  /** Get status for a specific database */
  getDatabaseStatus(dbName: string): SyncStatus | null {
    return this.statuses.get(dbName) || null;
  }

  private notifyChange(): void {
    this.onChange?.(this.getStatus());
  }
}

// Singleton instance — created once, shared across the app
let _instance: SyncManager | null = null;

export function getSyncManager(): SyncManager | null {
  return _instance;
}

export function createSyncManager(opts: SyncManagerOptions): SyncManager {
  if (_instance) {
    _instance.stopAll();
  }
  _instance = new SyncManager(opts);
  return _instance;
}

export function destroySyncManager(): void {
  if (_instance) {
    _instance.stopAll();
    _instance = null;
  }
}
