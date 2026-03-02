/**
 * 数据同步 Hook
 * 提供轮询和手动刷新功能，确保前端和后端数据一致
 */

import { useEffect, useRef, useCallback } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { useAssetStore } from '@/stores/assetStore';
import { usePositionStore } from '@/stores/positionStore';

export interface SyncOptions {
  /**
   * 是否启用自动同步
   * @default true
   */
  enabled?: boolean;

  /**
   * 同步间隔（毫秒）
   * @default 30000 (30秒)
   */
  interval?: number;

  /**
   * 是否在页面可见时才同步
   * @default true
   */
  syncWhenVisible?: boolean;

  /**
   * 同步前的回调
   */
  onBeforeSync?: () => void;

  /**
   * 同步后的回调
   */
  onAfterSync?: (success: boolean) => void;
}

/**
 * 使用数据同步 Hook
 *
 * @example
 * ```tsx
 * // 自动同步（每30秒）
 * useDataSync();
 *
 * // 自定义同步间隔
 * useDataSync({ interval: 60000 }); // 1分钟
 *
 * // 手动刷新
 * const { refresh, isSyncing } = useDataSync();
 * <button onClick={refresh} disabled={isSyncing}>刷新</button>
 * ```
 */
export function useDataSync(options: SyncOptions = {}) {
  const {
    enabled = true,
    interval = 30000,
    syncWhenVisible = true,
    onBeforeSync,
    onAfterSync,
  } = options;

  const { isLogin, token } = useAuthStore();
  const syncFromBackend = useAssetStore((state) => state.syncFromBackend);
  const syncPositions = usePositionStore((state) => state.syncFromBackend);

  const isSyncingRef = useRef(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * 执行数据同步
   */
  const sync = useCallback(async () => {
    // 检查是否已登录
    if (!isLogin || !token) {
      console.log('[DataSync] User not logged in, skipping sync');
      return;
    }

    // 检查是否正在同步
    if (isSyncingRef.current) {
      console.log('[DataSync] Already syncing, skipping');
      return;
    }

    // 检查页面是否可见
    if (syncWhenVisible && typeof document !== 'undefined') {
      if (document.hidden) {
        console.log('[DataSync] Page hidden, skipping sync');
        return;
      }
    }

    try {
      isSyncingRef.current = true;

      // 调用同步前回调
      onBeforeSync?.();

      console.log('[DataSync] Starting data sync...');

      // 并行同步用户信息、资产和持仓
      const [userResult, assetResult, positionResult] = await Promise.allSettled([
        useAuthStore.getState().syncFromBackend(),
        syncFromBackend(),
        syncPositions(),
      ]);

      // 棃查结果
      const userSuccess = userResult.status === 'fulfilled';
      const assetSuccess = assetResult.status === 'fulfilled';
      const positionSuccess = positionResult.status === 'fulfilled';

      const allSuccess = userSuccess && assetSuccess && positionSuccess;

      console.log('[DataSync] Sync completed:', {
        user: userSuccess,
        asset: assetSuccess,
        position: positionSuccess,
      });

      // 调用同步后回调
      onAfterSync?.(allSuccess);
    } catch (error) {
      console.error('[DataSync] Sync failed:', error);
      onAfterSync?.(false);
    } finally {
      isSyncingRef.current = false;
    }
  }, [isLogin, token, syncFromBackend, syncPositions, syncWhenVisible, onBeforeSync, onAfterSync]);

  /**
   * 手动刷新
   */
  const refresh = useCallback(() => {
    console.log('[DataSync] Manual refresh triggered');
    return sync();
  }, [sync]);

  /**
   * 设置自动同步
   */
  useEffect(() => {
    if (!enabled || !isLogin || !token) {
      // 如果未启用或未登录，清除定时器
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    console.log(`[DataSync] Auto sync enabled, interval: ${interval}ms`);

    // 立即同步一次
    sync();

    // 设置定时器
    intervalRef.current = setInterval(() => {
      sync();
    }, interval);

    // 清理函数
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [enabled, isLogin, token, interval, sync]);

  /**
   * 监听页面可见性变化
   */
  useEffect(() => {
    if (!syncWhenVisible || !enabled || !isLogin || !token) {
      return;
    }

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        console.log('[DataSync] Page became visible, syncing...');
        sync();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [syncWhenVisible, enabled, isLogin, token, sync]);

  return {
    /**
     * 是否正在同步
     */
    isSyncing: isSyncingRef.current,
    /**
     * 手动刷新
     */
    refresh,
    /**
     * 同步函数
     */
    sync,
  };
}

/**
 * 创建数据同步器（用于特定场景）
 */
export class DataSyncManager {
  private intervalRef: NodeJS.Timeout | null = null;
  private isSyncing = false;
  private syncCallback: () => Promise<void>;

  constructor(
    syncCallback: () => Promise<void>,
    private interval: number = 30000,
    private enabled: boolean = false
  ) {
    this.syncCallback = syncCallback;
  }

  /**
   * 启动自动同步
   */
  start() {
    if (this.enabled) {
      console.log('[DataSyncManager] Already started');
      return;
    }

    this.enabled = true;

    // 立即同步一次
    this.sync();

    // 设置定时器
    this.intervalRef = setInterval(() => {
      this.sync();
    }, this.interval);

    console.log(`[DataSyncManager] Started, interval: ${this.interval}ms`);
  }

  /**
   * 停止自动同步
   */
  stop() {
    if (!this.enabled) {
      console.log('[DataSyncManager] Already stopped');
      return;
    }

    this.enabled = false;

    if (this.intervalRef) {
      clearInterval(this.intervalRef);
      this.intervalRef = null;
    }

    console.log('[DataSyncManager] Stopped');
  }

  /**
   * 执行同步
   */
  async sync() {
    if (this.isSyncing) {
      console.log('[DataSyncManager] Already syncing');
      return;
    }

    this.isSyncing = true;

    try {
      await this.syncCallback();
    } catch (error) {
      console.error('[DataSyncManager] Sync failed:', error);
    } finally {
      this.isSyncing = false;
    }
  }

  /**
   * 获取同步状态
   */
  getStatus() {
    return {
      enabled: this.enabled,
      syncing: this.isSyncing,
      interval: this.interval,
    };
  }
}
