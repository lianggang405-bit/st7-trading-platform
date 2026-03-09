/**
 * K线聚合引擎
 * 从 1m K线聚合生成 5m、15m、1h、4h、1d K线
 */

import { getSupabase } from '../config/database';

/**
 * 聚合配置
 */
interface AggregationConfig {
  targetInterval: string;
  sourceInterval: string;
  count: number; // 需要多少根基础K线
}

/**
 * 聚合配置表
 */
const AGGREGATION_CONFIGS: AggregationConfig[] = [
  { targetInterval: '5m', sourceInterval: '1m', count: 5 },
  { targetInterval: '15m', sourceInterval: '1m', count: 15 },
  { targetInterval: '1h', sourceInterval: '1m', count: 60 },
  { targetInterval: '4h', sourceInterval: '1m', count: 240 },
  { targetInterval: '1d', sourceInterval: '1m', count: 1440 },
];

/**
 * K线数据结构
 */
interface KlineData {
  symbol: string;
  interval: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  open_time: number;
  close_time: number;
}

/**
 * K线聚合引擎类
 */
export class KlineAggregator {
  private isRunning: boolean = false;
  private aggregationInterval: NodeJS.Timeout | null = null;

  /**
   * 启动聚合引擎
   */
  public start(): void {
    if (this.isRunning) {
      console.log('[KlineAggregator] Already running');
      return;
    }

    this.isRunning = true;
    console.log('[KlineAggregator] Starting K-line aggregation engine...');

    // 立即执行一次
    this.aggregateAll();

    // 每 30 秒聚合一次
    this.aggregationInterval = setInterval(() => {
      this.aggregateAll();
    }, 30000);
  }

  /**
   * 停止聚合引擎
   */
  public stop(): void {
    if (!this.isRunning) {
      return;
    }

    this.isRunning = false;

    if (this.aggregationInterval) {
      clearInterval(this.aggregationInterval);
      this.aggregationInterval = null;
    }

    console.log('[KlineAggregator] Stopped K-line aggregation engine');
  }

  /**
   * 聚合所有配置的周期
   */
  private async aggregateAll(): Promise<void> {
    try {
      for (const config of AGGREGATION_CONFIGS) {
        await this.aggregate(config);
      }
    } catch (error) {
      console.error('[KlineAggregator] Error in aggregation:', error);
    }
  }

  /**
   * 聚合单个周期
   */
  private async aggregate(config: AggregationConfig): Promise<void> {
    try {
      const { targetInterval, sourceInterval, count } = config;

      console.log(
        `[KlineAggregator] Aggregating ${sourceInterval} → ${targetInterval} ` +
        `(count: ${count})`
      );

      // 获取需要聚合的符号列表
      const supabase = getSupabase();
      const { data: symbols, error: symbolsError } = await supabase
        .from('symbols')
        .select('symbol')
        .limit(100);

      if (symbolsError || !symbols) {
        console.error('[KlineAggregator] Error fetching symbols:', symbolsError);
        return;
      }

      // 对每个符号进行聚合
      for (const { symbol } of symbols) {
        await this.aggregateSymbol(symbol, sourceInterval, targetInterval, count);
      }
    } catch (error) {
      console.error('[KlineAggregator] Error in aggregate:', error);
    }
  }

  /**
   * 聚合单个符号的K线
   */
  private async aggregateSymbol(
    symbol: string,
    sourceInterval: string,
    targetInterval: string,
    count: number
  ): Promise<void> {
    try {
      const supabase = getSupabase();

      // 获取最近 count 根 1m K线
      const { data: sourceKlines, error } = await supabase
        .from('klines')
        .select('*')
        .eq('symbol', symbol)
        .eq('interval', sourceInterval)
        .order('open_time', { ascending: false })
        .limit(count * 2); // 获取更多数据以确保能聚合出足够的K线

      if (error || !sourceKlines || sourceKlines.length < count) {
        // 数据不足，跳过
        return;
      }

      // 按时间升序排列
      const sortedKlines = sourceKlines.sort((a, b) =>
        a.open_time - b.open_time
      );

      // 聚合K线
      const aggregatedKlines: KlineData[] = [];

      // 计算目标周期的时间间隔（毫秒）
      const targetIntervalMs = this.getIntervalMs(targetInterval);

      // 分组聚合
      let currentGroup: typeof sourceKlines = [];
      let currentGroupOpenTime = sortedKlines[0].open_time;

      for (const kline of sortedKlines) {
        // 检查是否属于同一组
        const timeDiff = kline.open_time - currentGroupOpenTime;

        if (timeDiff < targetIntervalMs) {
          // 同一组
          currentGroup.push(kline);
        } else {
          // 新的一组
          if (currentGroup.length >= count) {
            // 数据量足够，可以聚合
            aggregatedKlines.push(
              this.mergeKlines(currentGroup, targetInterval)
            );
          }

          // 开始新组
          currentGroup = [kline];
          currentGroupOpenTime = kline.open_time;
        }
      }

      // 处理最后一组
      if (currentGroup.length >= count) {
        aggregatedKlines.push(
          this.mergeKlines(currentGroup, targetInterval)
        );
      }

      // 写入数据库（upsert）
      if (aggregatedKlines.length > 0) {
        const { error: upsertError } = await supabase
          .from('klines')
          .upsert(
            aggregatedKlines.map(kline => ({
              symbol: kline.symbol,
              interval: kline.interval,
              open: kline.open,
              high: kline.high,
              low: kline.low,
              close: kline.close,
              volume: kline.volume,
              open_time: kline.open_time,
              close_time: kline.close_time,
            })),
            {
              onConflict: 'symbol,interval,open_time'
            }
          );

        if (upsertError) {
          console.error(
            `[KlineAggregator] Error upserting ${symbol} ${targetInterval}:`,
            upsertError
          );
        } else {
          console.log(
            `[KlineAggregator] ✅ Aggregated ${aggregatedKlines.length} ` +
            `${targetInterval} candles for ${symbol}`
          );
        }
      }
    } catch (error) {
      console.error(
        `[KlineAggregator] Error aggregating ${symbol} ${targetInterval}:`,
        error
      );
    }
  }

  /**
   * 合并多根K线为一根
   */
  private mergeKlines(klines: any[], targetInterval: string): KlineData {
    const sortedKlines = klines.sort((a, b) => a.open_time - b.open_time);

    const first = sortedKlines[0];
    const last = sortedKlines[sortedKlines.length - 1];

    return {
      symbol: first.symbol,
      interval: targetInterval,
      open: first.open,
      high: Math.max(...sortedKlines.map(k => k.high)),
      low: Math.min(...sortedKlines.map(k => k.low)),
      close: last.close,
      volume: sortedKlines.reduce((sum, k) => sum + k.volume, 0),
      open_time: first.open_time,
      close_time: last.close_time,
    };
  }

  /**
   * 获取周期对应的毫秒数
   */
  private getIntervalMs(interval: string): number {
    const intervalMap: Record<string, number> = {
      '1m': 60 * 1000,
      '5m': 5 * 60 * 1000,
      '15m': 15 * 60 * 1000,
      '30m': 30 * 60 * 1000,
      '1h': 60 * 60 * 1000,
      '2h': 2 * 60 * 60 * 1000,
      '4h': 4 * 60 * 60 * 1000,
      '6h': 6 * 60 * 60 * 1000,
      '12h': 12 * 60 * 60 * 1000,
      '1d': 24 * 60 * 60 * 1000,
      '1w': 7 * 24 * 60 * 60 * 1000,
      '1M': 30 * 24 * 60 * 60 * 1000,
    };

    return intervalMap[interval] || 60 * 1000;
  }

  /**
   * 手动触发聚合（用于测试）
   */
  public async aggregateOnce(): Promise<void> {
    console.log('[KlineAggregator] Manual aggregation triggered');
    await this.aggregateAll();
  }
}

// 导出单例
export const klineAggregator = new KlineAggregator();
