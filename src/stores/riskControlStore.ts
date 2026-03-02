import { create } from 'zustand';

/**
 * 持仓数据接口（用于强平时访问持仓信息）
 */
export interface Position {
  id: string;
  symbol: string;
  side: 'buy' | 'sell';
  volume: number;
  openPrice: number;
  currentPrice: number;
  profit: number;
  openTime: string;
}

/**
 * 风控控制 Store
 *
 * 职责：
 * 1. 计算保证金率 (Margin Level = Equity / Used Margin × 100%)
 * 2. 判断预警/危险状态
 * 3. 执行强平逻辑
 */
interface RiskControlState {
  // ========== 状态 ==========

  /** 保证金率 (%) - 无持仓时为 0 */
  marginLevel: number;

  /** 是否处于预警状态 (80% ≤ Margin Level < 100%) */
  warning: boolean;

  /** 是否处于危险状态 (Margin Level < 50%) - 需要强平 */
  danger: boolean;

  /** 内部锁：防止强平重复触发 */
  isLiquidating: boolean;

  // ========== 方法 ==========

  /**
   * 更新风控状态
   * @param params - 资产数据
   */
  updateRisk: (params: { equity: number; usedMargin: number }) => void;

  /**
   * 检查并执行强平
   * @param positions - 当前持仓列表
   * @param closePosition - 关闭持仓的方法（来自 positionStore）
   * @param onClosePosition - 结算资产的方法（来自 assetStore）
   */
  checkAndForceClose: (
    positions: Position[],
    closePosition: (id: string) => void,
    onClosePosition: (data: { profit: number; margin: number }) => void
  ) => void;

  /**
   * 重置强平锁（用于测试或特殊场景）
   */
  resetLiquidating: () => void;
}

export const useRiskControlStore = create<RiskControlState>((set, get) => ({
  // ========== 初始状态 ==========

  marginLevel: 0,
  warning: false,
  danger: false,
  isLiquidating: false,

  // ========== 方法实现 ==========

  /**
   * 更新风控状态
   *
   * 保证金率计算：
   * Margin Level = Equity / Used Margin × 100%
   *
   * 风险等级：
   * - 健康：Margin Level ≥ 100%
   * - 预警：80% ≤ Margin Level < 100%（禁止开新仓）
   * - 危险：Margin Level < 50%（强制平仓）
   *
   * 特殊情况：
   * - 无持仓（usedMargin = 0）：Margin Level = 0，不触发 warning/danger
   */
  updateRisk: ({ equity, usedMargin }) => {
    // 特殊情况：无持仓
    if (usedMargin === 0) {
      set({
        marginLevel: 0,
        warning: false,
        danger: false,
      });
      return;
    }

    // 计算保证金率
    const marginLevel = (equity / usedMargin) * 100;

    // 判断风险等级
    const warning = marginLevel >= 80 && marginLevel < 100;
    const danger = marginLevel < 50;

    set({
      marginLevel,
      warning,
      danger,
    });
  },

  /**
   * 检查并执行强平
   *
   * 当保证金率 < 50% 时，强制平掉所有持仓
   * 使用内部锁防止重复触发
   */
  checkAndForceClose: (positions, closePosition, onClosePosition) => {
    const state = get();

    // 如果不在危险状态，不做任何事
    if (!state.danger) {
      return;
    }

    // 如果正在强平，不做任何事（防止重复触发）
    if (state.isLiquidating) {
      return;
    }

    // 加锁
    set({ isLiquidating: true });

    // 执行强平：强平所有持仓
    positions.forEach((pos) => {
      const margin = pos.openPrice * pos.volume * 0.1;

      // 结算盈亏并释放保证金
      onClosePosition({
        profit: pos.profit,
        margin: margin,
      });

      // 关闭持仓
      closePosition(pos.id);
    });

    // 延迟解锁（确保强平完成）
    setTimeout(() => {
      set({ isLiquidating: false });
    }, 100);
  },

  /**
   * 重置强平锁
   */
  resetLiquidating: () => {
    set({ isLiquidating: false });
  },
}));
