import { create } from 'zustand';
import type { User } from './authStore';
import * as assetsApi from '@/api/assets';

interface AssetState {
  balance: number;
  equity: number;
  usedMargin: number;
  freeMargin: number;
  floatingProfit: number;
  lockedBalance: number; // 质押锁定的余额

  // Actions
  init: () => void;
  initWithUser: (user: User) => void;
  onOpenPosition: (params: { volume: number; price: number; margin?: number }) => void;
  onClosePosition: (params: { profit: number; margin: number }) => void;
  updateFloatingProfit: (totalProfit: number) => void;
  onStake: (value: number) => void;
  onUnstake: (value: number, reward: number) => void;
  syncFromBackend: () => Promise<void>; // 从后端同步资产信息
  updateBalance: (newBalance: number) => void; // 更新余额（用于数据同步）
}

const INITIAL_BALANCE = 100000;

export const useAssetStore = create<AssetState>((set, get) => ({
  balance: INITIAL_BALANCE,
  equity: INITIAL_BALANCE,
  usedMargin: 0,
  freeMargin: INITIAL_BALANCE,
  floatingProfit: 0,
  lockedBalance: 0,

  // 初始化资产（默认模拟账户）
  init: () => {
    set({
      balance: INITIAL_BALANCE,
      equity: INITIAL_BALANCE,
      usedMargin: 0,
      freeMargin: INITIAL_BALANCE,
      floatingProfit: 0,
      lockedBalance: 0,
    });
  },

  // 根据用户信息初始化资产
  initWithUser: (user: User) => {
    set({
      balance: user.balance,
      equity: user.balance,
      usedMargin: 0,
      freeMargin: user.balance,
      floatingProfit: 0,
      lockedBalance: 0,
    });
  },

  // 开仓时计算保证金
  onOpenPosition: ({ volume, price, margin }) => {
    // 如果提供了 margin（考虑杠杆），使用它；否则使用默认计算
    const finalMargin = margin || (price * volume * 0.1);

    console.log('[AssetStore] onOpenPosition called:', {
      volume,
      price,
      margin: finalMargin,
      oldUsedMargin: get().usedMargin,
      oldFreeMargin: get().freeMargin,
      oldBalance: get().balance,
    });

    set((state) => {
      const newUsedMargin = state.usedMargin + finalMargin;
      const newFreeMargin = state.balance - newUsedMargin;

      console.log('[AssetStore] onOpenPosition updating:', {
        newUsedMargin,
        newFreeMargin,
        finalMargin,
      });

      return {
        usedMargin: newUsedMargin,
        freeMargin: newFreeMargin,
      };
    });

    console.log('[AssetStore] onOpenPosition after update:', {
      usedMargin: get().usedMargin,
      freeMargin: get().freeMargin,
      balance: get().balance,
    });
  },

  // 平仓时更新余额和保证金
  onClosePosition: ({ profit, margin }) => {
    set((state) => {
      const newBalance = state.balance + profit;
      const newUsedMargin = Math.max(0, state.usedMargin - margin); // 防止负数
      const newFreeMargin = newBalance - newUsedMargin;
      const newEquity = newBalance + state.floatingProfit; // 更新 equity

      return {
        balance: newBalance,
        usedMargin: newUsedMargin,
        freeMargin: newFreeMargin,
        equity: newEquity,
      };
    });
  },

  // 更新浮动盈亏
  updateFloatingProfit: (totalProfit) => {
    set((state) => {
      const newEquity = state.balance + totalProfit;

      return {
        floatingProfit: totalProfit,
        equity: newEquity,
      };
    });
  },

  // 质押时锁定余额
  onStake: (value) => {
    set((state) => {
      if (value > state.freeMargin + state.lockedBalance) {
        console.warn('质押金额超过可用余额');
        return state;
      }

      const newLockedBalance = state.lockedBalance + value;
      const newFreeMargin = state.balance - state.usedMargin - newLockedBalance;

      return {
        lockedBalance: newLockedBalance,
        freeMargin: Math.max(0, newFreeMargin),
      };
    });
  },

  // 解质押时释放余额并增加收益
  onUnstake: (value, reward) => {
    set((state) => {
      if (value > state.lockedBalance) {
        console.warn('解质押金额超过已锁定余额');
        return state;
      }

      const newLockedBalance = state.lockedBalance - value;
      const newBalance = state.balance + value + reward;
      const newFreeMargin = newBalance - state.usedMargin - newLockedBalance;

      return {
        balance: newBalance,
        lockedBalance: newLockedBalance,
        equity: newBalance + state.floatingProfit,
        freeMargin: Math.max(0, newFreeMargin),
      };
    });
  },

  // 从后端同步资产信息
  syncFromBackend: async () => {
    try {
      const result = await assetsApi.getAssets();

      if (result.success && result.assets) {
        const assets = result.assets;

        set({
          balance: assets.balance,
          equity: assets.equity,
          usedMargin: assets.usedMargin,
          freeMargin: assets.freeMargin,
          floatingProfit: assets.floatingProfit,
          lockedBalance: assets.lockedBalance,
        });

        console.log('[AssetStore] Synced from backend:', assets);
      }
    } catch (error) {
      console.warn('[AssetStore] Failed to sync from backend:', error);
      // 不影响用户体验，静默失败
    }
  },

  // 更新余额（用于数据同步）
  updateBalance: (newBalance: number) => {
    set((state) => {
      const newFreeMargin = newBalance - state.usedMargin - state.lockedBalance;

      return {
        balance: newBalance,
        equity: newBalance + state.floatingProfit,
        freeMargin: Math.max(0, newFreeMargin),
      };
    });
  },
}));
