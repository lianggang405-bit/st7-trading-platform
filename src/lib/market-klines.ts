/**
 * 行情聚合器
 * 根据交易对自动选择数据源，返回统一的K线数据
 */

import {
  getSymbolSource,
  getUnifiedInterval,
  UnifiedKline,
  DataSource,
} from './symbol-map';
import { getBinanceKlines } from './binance-source';
import { getGoldKlines } from './gold-klines';
import { getForexKlines } from './forex-klines';
import { getEnergyKlines, getCfdKlines } from './other-klines';

/**
 * 获取K线数据（行情聚合）
 * @param symbol 交易对（如 XAUUSD, BTCUSD）
 * @param interval 时间周期（如 1M, 5M, 15M, 1H）
 * @param limit K线数量（默认80）
 * @returns 统一格式的K线数据
 */
export async function getKlines(
  symbol: string,
  interval: string,
  limit: number = 80
): Promise<UnifiedKline[]> {
  console.log(`[MarketKlines] 获取 ${symbol} K线数据，interval=${interval}, limit=${limit}`);

  // 转换时间周期格式
  const unifiedInterval = getUnifiedInterval(interval);

  // 获取数据源
  const source = getSymbolSource(symbol);

  console.log(`[MarketKlines] 数据源: ${source}`);

  try {
    // 根据数据源选择相应的获取方法
    switch (source) {
      case 'binance':
        return await getBinanceKlines(symbol, unifiedInterval, limit);

      case 'gold':
        return await getGoldKlines(symbol, unifiedInterval, limit);

      case 'forex':
        return await getForexKlines(symbol, unifiedInterval, limit);

      case 'energy':
        return await getEnergyKlines(symbol, unifiedInterval, limit);

      case 'cfd':
        return await getCfdKlines(symbol, unifiedInterval, limit);

      default:
        throw new Error(`不支持的数据源: ${source}`);
    }
  } catch (error) {
    console.error(`[MarketKlines] 获取 ${symbol} 数据失败:`, error);
    throw error;
  }
}

/**
 * 获取交易对列表（包含数据源信息）
 */
export function getSymbolsWithSource(): Array<{
  symbol: string;
  source: DataSource;
}> {
  const symbolMap = require('./symbol-map').SYMBOL_SOURCE;
  return Object.entries(symbolMap).map(([symbol, source]) => ({
    symbol,
    source: source as DataSource,
  }));
}

/**
 * 批量获取多个交易对的K线数据
 */
export async function getBatchKlines(
  requests: Array<{ symbol: string; interval: string; limit?: number }>
): Promise<Map<string, UnifiedKline[]>> {
  const results = new Map<string, UnifiedKline[]>();

  // 并行获取所有数据
  await Promise.all(
    requests.map(async (req) => {
      try {
        const klines = await getKlines(req.symbol, req.interval, req.limit || 80);
        results.set(req.symbol, klines);
      } catch (error) {
        console.error(`[MarketKlines] 批量获取 ${req.symbol} 失败:`, error);
        // 即使失败也设置空数组，避免 Promise.all 失败
        results.set(req.symbol, []);
      }
    })
  );

  return results;
}
