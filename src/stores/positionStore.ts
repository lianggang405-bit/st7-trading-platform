import { create } from 'zustand';
import * as tradingApi from '@/api/trading';
import { useAssetStore } from './assetStore';
import type { Position as ApiPosition } from '@/api/trading';

export interface Position {
  id: string;
  symbol: string;
  side: 'buy' | 'sell';
  volume: number;
  openPrice: number;
  currentPrice: number;
  profit: number;
  openTime: string;
  leverage?: number; // 杠杆
  margin?: number; // 保证金
  status?: 'open' | 'pending' | 'closed'; // 订单状态
}

interface PositionState {
  positions: Position[]; // 持仓列表（status = 'open'）
  pendingOrders: Position[]; // 挂单列表（status = 'pending'）
  // Actions
  openPosition: (params: {
    symbol: string;
    side: 'buy' | 'sell';
    volume: number;
    price: number;
    orderType?: 'market' | 'limit'; // 订单类型
    leverage?: number; // 杠杆
  }) => Promise<{ success: boolean; position?: Position; error?: string }>;
  closePosition: (id: string) => Promise<{ success: boolean; profit?: number; error?: string }>;
  cancelOrder: (id: string) => Promise<{ success: boolean; error?: string }>; // 取消挂单
  updatePositions: (symbol: string, currentPrice: number) => void;
  syncFromBackend: () => Promise<void>; // 从后端同步持仓
  syncPendingOrders: () => Promise<void>; // 从后端同步挂单
  clearPositions: () => void; // 清空持仓（用于登出）
  clearPendingOrders: () => void; // 清空挂单（用于登出）
}

export const usePositionStore = create<PositionState>((set, get) => ({
  positions: [],
  pendingOrders: [],

  clearPositions: () => set({ positions: [] }),

  clearPendingOrders: () => set({ pendingOrders: [] }),

  openPosition: async ({ symbol, side, volume, price, orderType = 'market', leverage }) => {
    try {
      // 优先使用 API 开仓
      const result = await tradingApi.openPosition({
        symbol,
        side,
        volume,
        price,
        orderType, // 使用传入的 orderType
        leverage,
      });

      if (result.success && result.position) {
        // 根据订单状态决定添加到哪个列表
        if (result.position.status === 'pending') {
          set((state) => ({
            pendingOrders: [...state.pendingOrders, result.position!],
          }));
        } else {
          // 市价单或没有状态字段的订单，默认为持仓
          set((state) => ({
            positions: [...state.positions, result.position!],
          }));

          // 更新保证金（只有持仓才扣除保证金）
          const margin = price * volume / (leverage || 1);
          useAssetStore.getState().onOpenPosition({
            volume,
            price,
            margin,
          });
        }

        return { success: true, position: result.position };
      }

      // API 失败，降级到本地处理
      const newPosition: Position = {
        id: `pos_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        symbol,
        side,
        volume,
        openPrice: price,
        currentPrice: price,
        profit: 0,
        openTime: new Date().toISOString(),
        leverage,
      };

      set((state) => ({
        positions: [...state.positions, newPosition],
      }));

      // 更新保证金
      const margin = price * volume / (leverage || 1);
      useAssetStore.getState().onOpenPosition({
        volume,
        price,
        margin,
      });

      return { success: true, position: newPosition };
    } catch (error) {
      console.error('[PositionStore] Failed to open position:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '开仓失败',
      };
    }
  },

  closePosition: async (id) => {
    try {
      // 优先使用 API 平仓
      const result = await tradingApi.closePosition({ id });

      if (result.success) {
        const position = get().positions.find((pos) => pos.id === id);
        
        set((state) => ({
          positions: state.positions.filter((pos) => pos.id !== id),
        }));

        // 更新资产
        if (position) {
          const margin = position.openPrice * position.volume / (position.leverage || 1);
          useAssetStore.getState().onClosePosition({
            profit: result.profit || position.profit,
            margin,
          });
        }

        return { success: true, profit: result.profit };
      }

      // API 失败，降级到本地处理
      const position = get().positions.find((pos) => pos.id === id);
      if (!position) {
        return { success: false, error: '持仓不存在' };
      }

      set((state) => ({
        positions: state.positions.filter((pos) => pos.id !== id),
      }));

      // 更新资产
      const margin = position.openPrice * position.volume / (position.leverage || 1);
      useAssetStore.getState().onClosePosition({
        profit: position.profit,
        margin,
      });

      return { success: true, profit: position.profit };
    } catch (error) {
      console.error('[PositionStore] Failed to close position:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '平仓失败',
      };
    }
  },

  // 取消挂单
  cancelOrder: async (id) => {
    try {
      const result = await tradingApi.closePosition({ id });

      if (result.success) {
        const pendingOrder = get().pendingOrders.find((pos) => pos.id === id);

        if (pendingOrder) {
          // 计算保证金
          const margin = pendingOrder.openPrice * pendingOrder.volume / (pendingOrder.leverage || 1);

          set((state) => ({
            pendingOrders: state.pendingOrders.filter((pos) => pos.id !== id),
          }));

          // 返还保证金
          useAssetStore.getState().onClosePosition({
            profit: 0,
            margin,
          });
        }

        return { success: true };
      }

      return {
        success: false,
        error: '取消挂单失败',
      };
    } catch (error) {
      console.error('[PositionStore] Failed to cancel order:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '取消挂单失败',
      };
    }
  },

  updatePositions: (symbol, currentPrice) => {
    set((state) => {
      const updatedPositions = state.positions.map((pos) => {
        if (pos.symbol !== symbol) return pos;

        // 计算盈亏
        let profit = 0;
        if (pos.side === 'buy') {
          profit = (currentPrice - pos.openPrice) * pos.volume;
        } else {
          profit = (pos.openPrice - currentPrice) * pos.volume;
        }

        const formattedProfit = parseFloat(profit.toFixed(2));

        // 只在价格或盈亏真正改变时才更新
        if (pos.currentPrice === currentPrice && pos.profit === formattedProfit) {
          return pos;
        }

        return {
          ...pos,
          currentPrice,
          profit: formattedProfit,
        };
      });

      // 检查是否有任何实际变化，如果没有变化则返回原状态
      const hasChanges = updatedPositions.some((pos, index) => {
        const originalPos = state.positions[index];
        return pos !== originalPos;
      });

      if (!hasChanges) {
        return state;
      }

      return { positions: updatedPositions };
    });
  },

  // 从后端同步持仓
  syncFromBackend: async () => {
    try {
      const result = await tradingApi.getPositions();

      if (result.success && result.positions) {
        set({ positions: result.positions });
        console.log('[PositionStore] Synced from backend:', result.positions);
      }
    } catch (error) {
      console.warn('[PositionStore] Failed to sync from backend:', error);
      // 不影响用户体验，静默失败
    }
  },

  // 从后端同步挂单
  syncPendingOrders: async () => {
    try {
      const result = await tradingApi.getOrders({ status: 'pending' });

      if (result.success && result.orders) {
        set({ pendingOrders: result.orders });
        console.log('[PositionStore] Synced pending orders from backend:', result.orders);
      }
    } catch (error) {
      console.warn('[PositionStore] Failed to sync pending orders from backend:', error);
      // 不影响用户体验，静默失败
    }
  },
}));
