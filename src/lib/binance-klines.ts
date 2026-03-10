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
 * 生成模拟K线数据
 * 用于在API返回空数据时提供默认数据
 * @param symbol 交易对
 * @param interval 时间周期（如 1M, 5M, 15M, 1H）
 * @param count K线数量（默认80）
 * @returns 模拟K线数据数组
 */
export function generateMockKlines(
  symbol: string,
  interval: string,
  count: number = 80
): KlineResponse[] {
  console.log(`[Klines] 生成模拟K线数据: ${symbol} ${interval} ${count}条`);

  // 获取时间周期对应的秒数
  const intervalSeconds = getIntervalSeconds(interval);

  // 获取基础价格（根据交易对）
  const basePrice = getBasePrice(symbol);

  // 生成当前时间作为结束时间
  const now = Math.floor(Date.now() / 1000);
  const endTime = now - (now % intervalSeconds); // 向下对齐到周期边界

  const klines: KlineResponse[] = [];

  // 从后往前生成数据
  for (let i = 0; i < count; i++) {
    const time = endTime - ((count - 1 - i) * intervalSeconds);

    // 使用正弦波模拟价格波动
    const trend = Math.sin(i / 10) * 0.01; // 1% 的趋势波动
    const noise = (Math.random() - 0.5) * 0.002; // 0.2% 的随机噪声

    const priceChange = basePrice * (trend + noise);

    const open = basePrice + priceChange;
    const high = open * (1 + Math.abs(noise));
    const low = open * (1 - Math.abs(noise));
    const close = open + (Math.random() - 0.5) * (high - low);

    klines.push({
      time,
      open,
      high,
      low,
      close,
      volume: Math.random() * 1000,
    });
  }

  return klines;
}

/**
 * 获取交易对的基础价格
 * @param symbol 交易对
 * @returns 基础价格
 */
function getBasePrice(symbol: string): number {
  const priceMap: Record<string, number> = {
    // 加密货币
    'BTCUSD': 65000,
    'ETHUSD': 3500,
    'SOLUSD': 150,
    'BNBUSD': 600,
    'XRPUSD': 0.5,

    // 贵金属
    'XAUUSD': 5000,
    'XAGUSD': 30,

    // 外汇
    'EURUSD': 1.08,
    'GBPUSD': 1.27,
    'USDJPY': 150,
    'USDCHF': 0.90,

    // 能源
    'USOIL': 75,
    'UKOIL': 80,
    'NGAS': 2.8,

    // 指数
    'US500': 5200,
    'ND25': 19000,
    'AUS200': 8000,
  };

  return priceMap[symbol] || 100;
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
      console.warn(`[Klines] API 返回错误 (${response.status}): ${errorData.error || 'Unknown error'}，将使用模拟数据`);
      // ✅ API 失败时返回空数组，让调用者决定是否生成模拟数据
      return [];
    }

    const data = await response.json();

    if (!data.success) {
      console.warn(`[Klines] API 返回失败: ${data.error || 'Unknown error'}，将使用模拟数据`);
      return [];
    }

    // ✅ 如果返回空数组，返回空数组
    if (!data.data || data.data.length === 0) {
      console.warn(`[Klines] API 返回空数据: ${symbol} ${interval}`);
      return [];
    }

    console.log(`[Klines] 成功获取 ${data.data.length} 条K线数据`);

    return data.data;
  } catch (error) {
    // ✅ 网络错误或其他异常，返回空数组而不是抛出错误
    console.warn(`[Klines] 获取K线数据异常: ${error instanceof Error ? error.message : 'Unknown error'}，将使用模拟数据`);
    return [];
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
