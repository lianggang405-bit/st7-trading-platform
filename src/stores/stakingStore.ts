import { create } from 'zustand';
import { useAssetStore } from './assetStore';

// 质押期限类型
export type StakingPeriod = 7 | 30 | 90 | 180 | 365;

// 期限选项配置
export const PERIOD_OPTIONS: { value: StakingPeriod; label: string; bonus: number }[] = [
  { value: 7, label: '7天', bonus: 1.0 },    // 基础收益率
  { value: 30, label: '30天', bonus: 1.1 },  // +10%
  { value: 90, label: '90天', bonus: 1.25 }, // +25%
  { value: 180, label: '180天', bonus: 1.5 }, // +50%
  { value: 365, label: '365天', bonus: 2.0 }, // +100%
];

// 期限对应的收益率加成
export const getPeriodBonus = (period: StakingPeriod): number => {
  const option = PERIOD_OPTIONS.find(opt => opt.value === period);
  return option?.bonus || 1.0;
};

export interface StakingAsset {
  id: string;
  symbol: string;
  name: string;
  icon: string;
  baseApr: number; // 基础年化利率
  minAmount: number;
  maxAmount: number;
  stakingAmount: number; // 已质押数量
  totalStaking: number; // 总质押量
  category: 'crypto' | 'metal' | 'forex'; // 资产类别
  price: number; // 当前价格（USDT）

  // 根据期限获取实际收益率
  getApr: (period: StakingPeriod) => number;

  // 计算质押价值
  getValue: () => number;
}

export interface StakingRecord {
  id: string;
  assetId: string;
  symbol: string;
  amount: number;
  type: 'deposit' | 'withdraw';
  status: 'pending' | 'active' | 'completed';
  timestamp: string;
  reward?: number; // 累计收益
  period?: StakingPeriod; // 质押期限
  apr?: number; // 实际收益率
  unlockTime?: string; // 解锁时间
}

interface StakingState {
  assets: StakingAsset[];
  records: StakingRecord[];
  totalValue: number; // 总质押价值（USDT）
  totalReward: number; // 总收益

  // 初始化质押资产
  initAssets: () => void;

  // 质押操作
  stake: (assetId: string, amount: number, period: StakingPeriod) => void;

  // 解质押操作
  unstake: (assetId: string, amount: number) => void;

  // 更新收益
  updateRewards: () => void;

  // 更新资产价格（模拟实时价格波动）
  updatePrices: () => void;

  // 检查到期的质押记录
  checkExpiredStakes: () => void;

  // 获取即将到期的质押记录（24小时内）
  getExpiringStakes: (hours?: number) => StakingRecord[];
}

// 模拟质押资产数据
const mockStakingAssets: StakingAsset[] = [
  // 加密货币
  {
    id: 'btc',
    symbol: 'BTC',
    name: 'Bitcoin',
    icon: '₿',
    baseApr: 5.5,
    minAmount: 0.001,
    maxAmount: 100,
    stakingAmount: 0,
    totalStaking: 15234.5,
    category: 'crypto',
    price: 95000, // BTC 价格
    getApr: (period: StakingPeriod) => 5.5 * getPeriodBonus(period),
    getValue: function() { return this.stakingAmount * this.price; },
  },
  {
    id: 'eth',
    symbol: 'ETH',
    name: 'Ethereum',
    icon: 'Ξ',
    baseApr: 4.8,
    minAmount: 0.01,
    maxAmount: 1000,
    stakingAmount: 0,
    totalStaking: 89765.2,
    category: 'crypto',
    price: 3500, // ETH 价格
    getApr: (period: StakingPeriod) => 4.8 * getPeriodBonus(period),
    getValue: function() { return this.stakingAmount * this.price; },
  },
  {
    id: 'usdt',
    symbol: 'USDT',
    name: 'Tether',
    icon: '₮',
    baseApr: 6.2,
    minAmount: 10,
    maxAmount: 1000000,
    stakingAmount: 0,
    totalStaking: 5678901.3,
    category: 'crypto',
    price: 1, // USDT 价格
    getApr: (period: StakingPeriod) => 6.2 * getPeriodBonus(period),
    getValue: function() { return this.stakingAmount * this.price; },
  },
  {
    id: 'sol',
    symbol: 'SOL',
    name: 'Solana',
    icon: '◎',
    baseApr: 7.5,
    minAmount: 0.1,
    maxAmount: 10000,
    stakingAmount: 0,
    totalStaking: 234567.8,
    category: 'crypto',
    price: 180, // SOL 价格
    getApr: (period: StakingPeriod) => 7.5 * getPeriodBonus(period),
    getValue: function() { return this.stakingAmount * this.price; },
  },
  // 贵金属
  {
    id: 'xau',
    symbol: 'XAU/USD',
    name: 'Gold',
    icon: '🥇',
    baseApr: 3.2,
    minAmount: 0.01,
    maxAmount: 1000,
    stakingAmount: 0,
    totalStaking: 56789.2,
    category: 'metal',
    price: 2700, // 黄金价格
    getApr: (period: StakingPeriod) => 3.2 * getPeriodBonus(period),
    getValue: function() { return this.stakingAmount * this.price; },
  },
  {
    id: 'xag',
    symbol: 'XAG/USD',
    name: 'Silver',
    icon: '🥈',
    baseApr: 2.8,
    minAmount: 1,
    maxAmount: 10000,
    stakingAmount: 0,
    totalStaking: 345678.9,
    category: 'metal',
    price: 32, // 白银价格
    getApr: (period: StakingPeriod) => 2.8 * getPeriodBonus(period),
    getValue: function() { return this.stakingAmount * this.price; },
  },
  // 外汇
  {
    id: 'eurusd',
    symbol: 'EUR/USD',
    name: 'Euro / US Dollar',
    icon: '€',
    baseApr: 4.0,
    minAmount: 100,
    maxAmount: 1000000,
    stakingAmount: 0,
    totalStaking: 23456789.5,
    category: 'forex',
    price: 1.08, // EUR/USD 价格
    getApr: (period: StakingPeriod) => 4.0 * getPeriodBonus(period),
    getValue: function() { return this.stakingAmount * this.price; },
  },
  {
    id: 'gbpusd',
    symbol: 'GBP/USD',
    name: 'British Pound / US Dollar',
    icon: '£',
    baseApr: 3.8,
    minAmount: 100,
    maxAmount: 1000000,
    stakingAmount: 0,
    totalStaking: 18976543.2,
    category: 'forex',
    price: 1.27, // GBP/USD 价格
    getApr: (period: StakingPeriod) => 3.8 * getPeriodBonus(period),
    getValue: function() { return this.stakingAmount * this.price; },
  },
  {
    id: 'usdjpy',
    symbol: 'USD/JPY',
    name: 'US Dollar / Japanese Yen',
    icon: '¥',
    baseApr: 3.5,
    minAmount: 10000,
    maxAmount: 100000000,
    stakingAmount: 0,
    totalStaking: 897654321.8,
    category: 'forex',
    price: 150, // USD/JPY 价格
    getApr: (period: StakingPeriod) => 3.5 * getPeriodBonus(period),
    getValue: function() { return this.stakingAmount * this.price; },
  },
  {
    id: 'audusd',
    symbol: 'AUD/USD',
    name: 'Australian Dollar / US Dollar',
    icon: 'A$',
    baseApr: 4.2,
    minAmount: 100,
    maxAmount: 1000000,
    stakingAmount: 0,
    totalStaking: 15678923.4,
    category: 'forex',
    price: 0.65, // AUD/USD 价格
    getApr: (period: StakingPeriod) => 4.2 * getPeriodBonus(period),
    getValue: function() { return this.stakingAmount * this.price; },
  },
  {
    id: 'usdchf',
    symbol: 'USD/CHF',
    name: 'US Dollar / Swiss Franc',
    icon: 'Fr',
    baseApr: 3.6,
    minAmount: 100,
    maxAmount: 1000000,
    stakingAmount: 0,
    totalStaking: 12345678.9,
    category: 'forex',
    price: 0.88, // USD/CHF 价格
    getApr: (period: StakingPeriod) => 3.6 * getPeriodBonus(period),
    getValue: function() { return this.stakingAmount * this.price; },
  },
  {
    id: 'usdcad',
    symbol: 'USD/CAD',
    name: 'US Dollar / Canadian Dollar',
    icon: 'C$',
    baseApr: 4.1,
    minAmount: 100,
    maxAmount: 1000000,
    stakingAmount: 0,
    totalStaking: 14567892.3,
    category: 'forex',
    price: 1.36, // USD/CAD 价格
    getApr: (period: StakingPeriod) => 4.1 * getPeriodBonus(period),
    getValue: function() { return this.stakingAmount * this.price; },
  },
];

export const useStakingStore = create<StakingState>((set, get) => ({
  assets: [],
  records: [],
  totalValue: 0,
  totalReward: 0,

  initAssets: () => {
    set({ assets: mockStakingAssets });
  },

  stake: (assetId, amount, period) => {
    set((state) => {
      const asset = state.assets.find(a => a.id === assetId);
      if (!asset) return state;

      const actualApr = asset.getApr(period);
      const unlockTime = new Date(Date.now() + period * 24 * 60 * 60 * 1000).toISOString();
      const stakeValue = amount * asset.price; // 质押价值（USDT）

      // 调用 assetStore 锁定余额
      useAssetStore.getState().onStake(stakeValue);

      // 创建质押记录
      const record: StakingRecord = {
        id: `stake_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        assetId,
        symbol: asset.symbol,
        amount,
        type: 'deposit',
        status: 'active',
        timestamp: new Date().toISOString(),
        period,
        apr: actualApr,
        unlockTime,
      };

      // 更新资产质押数量
      const updatedAssets = state.assets.map(a =>
        a.id === assetId
          ? { ...a, stakingAmount: a.stakingAmount + amount }
          : a
      );

      // 计算新的总质押价值
      const newTotalValue = updatedAssets.reduce((sum, a) => sum + a.getValue(), 0);

      return {
        assets: updatedAssets,
        records: [record, ...state.records],
        totalValue: parseFloat(newTotalValue.toFixed(2)),
      };
    });
  },

  unstake: (assetId, amount) => {
    set((state) => {
      const asset = state.assets.find(a => a.id === assetId);
      if (!asset || asset.stakingAmount < amount) return state;

      // 查找最近的质押记录来估算收益
      const activeDeposit = state.records.find(
        r => r.assetId === assetId && r.type === 'deposit' && r.status === 'active'
      );

      // 计算收益（简化计算，使用记录中的实际收益率）
      const reward = activeDeposit?.apr
        ? amount * (activeDeposit.apr / 100) * 0.01 // 假设质押了约3.65天
        : amount * (asset.baseApr / 100) * 0.01;

      const stakeValue = amount * asset.price; // 质押本金价值（USDT）
      const totalReturn = stakeValue + reward; // 总返还金额（本金 + 收益）

      // 调用 assetStore 解锁余额并增加收益
      useAssetStore.getState().onUnstake(stakeValue, reward);

      // 创建解质押记录
      const record: StakingRecord = {
        id: `unstake_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        assetId,
        symbol: asset.symbol,
        amount,
        type: 'withdraw',
        status: 'completed',
        timestamp: new Date().toISOString(),
        reward,
      };

      // 更新资产质押数量
      const updatedAssets = state.assets.map(a =>
        a.id === assetId
          ? { ...a, stakingAmount: Math.max(0, a.stakingAmount - amount) }
          : a
      );

      // 计算新的总质押价值
      const newTotalValue = updatedAssets.reduce((sum, a) => sum + a.getValue(), 0);

      // 更新总收益
      const newTotalReward = state.totalReward + reward;

      return {
        assets: updatedAssets,
        records: [record, ...state.records],
        totalValue: parseFloat(newTotalValue.toFixed(2)),
        totalReward: parseFloat(newTotalReward.toFixed(4)),
      };
    });
  },

  updateRewards: () => {
    set((state) => {
      // 模拟收益增长
      const newReward = state.totalReward + 0.001;
      return {
        totalReward: parseFloat(newReward.toFixed(4)),
      };
    });
  },

  // 更新资产价格（模拟实时价格波动）
  updatePrices: () => {
    set((state) => {
      // 模拟价格波动（±2%）
      const updatedAssets = state.assets.map(asset => {
        const fluctuation = (Math.random() - 0.5) * 0.04; // -2% 到 +2%
        const newPrice = asset.price * (1 + fluctuation);
        return { ...asset, price: parseFloat(newPrice.toFixed(2)) };
      });

      // 重新计算总质押价值
      const newTotalValue = updatedAssets.reduce((sum, a) => sum + a.getValue(), 0);

      return {
        assets: updatedAssets,
        totalValue: parseFloat(newTotalValue.toFixed(2)),
      };
    });
  },

  // 检查到期的质押记录
  checkExpiredStakes: () => {
    set((state) => {
      const now = Date.now();

      // 查找所有到期的活跃质押记录
      const expiredRecords = state.records.filter(
        (record: StakingRecord) =>
          record.type === 'deposit' &&
          record.status === 'active' &&
          record.unlockTime &&
          new Date(record.unlockTime).getTime() <= now
      );

      if (expiredRecords.length === 0) {
        return state;
      }

      // 更新到期记录的状态
      const updatedRecords: StakingRecord[] = state.records.map((record: StakingRecord) => {
        if (
          record.type === 'deposit' &&
          record.status === 'active' &&
          record.unlockTime &&
          new Date(record.unlockTime).getTime() <= now
        ) {
          return { ...record, status: 'completed' as const };
        }
        return record;
      });

      return {
        records: updatedRecords,
      };
    });
  },

  // 获取即将到期的质押记录（默认24小时内）
  getExpiringStakes: (hours = 24): StakingRecord[] => {
    const now = Date.now();
    const threshold = now + hours * 60 * 60 * 1000;
    const state = get();

    return state.records.filter(
      (record: StakingRecord) =>
        record.type === 'deposit' &&
        record.status === 'active' &&
        record.unlockTime &&
        new Date(record.unlockTime).getTime() <= threshold &&
        new Date(record.unlockTime).getTime() > now
    );
  },
}));
