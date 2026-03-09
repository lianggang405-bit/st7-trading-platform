/**
 * K线数据获取工具（通过后端API代理）
 * 使用行情聚合层，自动选择数据源
 */

// 统一的K线数据格式
export interface KlineResponse {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

/**
 * 补全缺失的 K 线数据
 * 确保返回的数据是连续的，避免 TradingView 显示异常
 * @param klines K线数据数组
 * @param interval 时间周期（秒）
 * @returns 补全后的K线数据数组
 */
export function fillMissingKlines(
  klines: KlineResponse[],
  interval: number = 60
): KlineResponse[] {
  if (klines.length === 0) {
    return klines;
  }

  console.log(`[Klines] 补全缺失的K线数据: ${klines.length} 条原始数据`);

  const filledKlines: KlineResponse[] = [];
  let prevKline: KlineResponse | null = null;

  for (const kline of klines) {
    if (!prevKline) {
      // 第一根 K 线，直接添加
      filledKlines.push(kline);
      prevKline = kline;
      continue;
    }

    // 检查时间间隔
    const timeDiff = kline.time - prevKline.time;
    const expectedDiff = interval;

    if (timeDiff > expectedDiff) {
      // 发现缺失的 K 线，需要补全
      const missingCount = Math.floor(timeDiff / expectedDiff) - 1;

      console.log(
        `[Klines] 发现缺失的K线: ${missingCount} 根, ` +
        `时间从 ${prevKline.time} 到 ${kline.time}`
      );

      // 补全缺失的 K 线
      for (let i = 1; i <= missingCount; i++) {
        const missingTime = prevKline.time + (i * expectedDiff);
        const missingKline: KlineResponse = {
          time: missingTime,
          open: prevKline.close,      // 使用前一根的收盘价作为开盘价
          high: prevKline.close,      // 使用前一根的收盘价作为最高价
          low: prevKline.close,       // 使用前一根的收盘价作为最低价
          close: prevKline.close,     // 使用前一根的收盘价作为收盘价
          volume: 0,                  // 成交量为0
        };
        filledKlines.push(missingKline);
      }
    }

    // 添加当前 K 线
    filledKlines.push(kline);
    prevKline = kline;
  }

  console.log(`[Klines] 补全后的K线数据: ${filledKlines.length} 条`);

  return filledKlines;
}

/**
 * 从后端API获取历史K线数据
 * @param symbol 交易对（如 XAUUSD, BTCUSD）
 * @param interval 时间周期（如 1M, 5M, 15M, 1H）
 * @param limit K线数量（默认80，最大1000）
 * @returns K线数据数组
 */
export async function fetchBinanceKlines(
  symbol: string,
  interval: string,
  limit: number = 80
): Promise<KlineResponse[]> {
  try {
    const url = `/api/klines?symbol=${encodeURIComponent(symbol)}&interval=${encodeURIComponent(interval)}&limit=${limit}`;

    console.log(`[Klines] 请求: ${url}`);

    const response = await fetch(url);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`API error: ${response.status} - ${errorData.error || 'Unknown error'}`);
    }

    const data = await response.json();

    if (!data.success) {
      throw new Error(`API error: ${data.error || 'Unknown error'}`);
    }

    // ✅ 如果返回空数组，抛出错误以触发模拟数据生成
    if (!data.data || data.data.length === 0) {
      console.warn(`[Klines] API 返回空数据，将使用模拟数据`);
      throw new Error(`No data available for ${symbol} ${interval}`);
    }

    console.log(`[Klines] 成功获取 ${data.data.length} 条K线数据`);

    return data.data;
  } catch (error) {
    console.error('[Klines] 获取K线数据失败:', error);
    throw error;
  }
}

/**
 * K线缓存
 * 避免频繁请求API
 */
interface KlineCache {
  [key: string]: {
    data: KlineResponse[];
    timestamp: number;
  };
}

const klineCache: KlineCache = {};
const CACHE_DURATION = 60 * 1000; // 缓存1分钟

/**
 * 获取K线数据（带缓存）
 * @param symbol 交易对
 * @param interval 时间周期
 * @param limit K线数量
 * @returns K线数据数组
 */
export async function getKlinesWithCache(
  symbol: string,
  interval: string,
  limit: number = 80
): Promise<KlineResponse[]> {
  const cacheKey = `${symbol}_${interval}_${limit}`;
  const cached = klineCache[cacheKey];

  // 检查缓存是否有效
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    console.log('[Klines] 使用缓存数据');
    return cached.data;
  }

  // 从API获取新数据
  const data = await fetchBinanceKlines(symbol, interval, limit);

  // ✅ 补全缺失的 K 线数据，确保数据连续性
  const intervalSeconds = getIntervalSeconds(interval);
  const filledData = fillMissingKlines(data, intervalSeconds);

  // 更新缓存
  klineCache[cacheKey] = {
    data: filledData,
    timestamp: Date.now(),
  };

  return filledData;
}

/**
 * 获取时间周期对应的秒数
 * @param interval 时间周期（如 1M, 5M, 15M, 1H）
 * @returns 秒数
 */
function getIntervalSeconds(interval: string): number {
  const intervalMap: Record<string, number> = {
    '1M': 60,
    '5M': 300,
    '15M': 900,
    '1H': 3600,
    '1D': 86400,
  };
  return intervalMap[interval] || 60;
}

/**
 * 清除K线缓存
 * @param symbol 交易对（可选，不传则清除所有）
 * @param interval 时间周期（可选）
 */
export function clearKlineCache(symbol?: string, interval?: string) {
  if (!symbol) {
    // 清除所有缓存
    Object.keys(klineCache).forEach(key => {
      delete klineCache[key];
    });
    console.log('[Klines] 清除所有缓存');
  } else {
    const prefix = `${symbol}_${interval || ''}`;
    Object.keys(klineCache).forEach(key => {
      if (key.startsWith(prefix)) {
        delete klineCache[key];
      }
    });
    console.log(`[Klines] 清除缓存: ${prefix}`);
  }
}
