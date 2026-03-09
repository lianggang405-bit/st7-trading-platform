/**
 * 实时行情缓存类型定义
 */
export interface Ticker {
  symbol: string;
  price: number;
  bid: number;
  ask: number;
  high: number;
  low: number;
  volume: number;
  change: number;
  changePercent: number;
  time: number;
}

/**
 * K线缓存类型定义
 */
export interface KlineCache {
  symbol: string;
  interval: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  openTime: number;
  closeTime: number;
}

/**
 * 行情缓存（内存）
 * key: symbol, value: Ticker
 */
const marketCache: Record<string, Ticker> = {};

/**
 * K线缓存（内存）
 * key: symbol_interval, value: KlineCache
 */
const klineCache: Record<string, KlineCache> = {};

/**
 * 更新行情缓存
 * @param symbol 交易对
 * @param price 当前价格
 * @param volume 成交量（可选）
 */
export function updateMarket(
  symbol: string,
  price: number,
  volume: number = 0
): void {
  const now = Date.now();
  const existing = marketCache[symbol];

  // 计算涨跌幅
  let change = 0;
  let changePercent = 0;
  let high = price;
  let low = price;

  if (existing) {
    change = price - existing.price;
    changePercent = (change / existing.price) * 100;
    high = Math.max(existing.high, price);
    low = Math.min(existing.low, price);
  }

  // 模拟买价和卖价
  const spread = price * 0.001; // 0.1% 点差
  const bid = price - spread;
  const ask = price + spread;

  marketCache[symbol] = {
    symbol,
    price,
    bid,
    ask,
    high,
    low,
    volume,
    change,
    changePercent,
    time: now,
  };

  // 每10次更新输出一次日志
  if (Math.random() < 0.1) {
    console.log(
      `[MarketCache] 📊 ${symbol}: $${price.toFixed(2)} ` +
      `(${changePercent >= 0 ? '+' : ''}${changePercent.toFixed(2)}%)`
    );
  }
}

/**
 * 获取单个交易对行情
 * @param symbol 交易对
 */
export function getMarket(symbol: string): Ticker | undefined {
  return marketCache[symbol];
}

/**
 * 获取所有交易对行情
 */
export function getAllMarkets(): Record<string, Ticker> {
  return { ...marketCache }; // 返回副本，避免外部修改
}

/**
 * 获取行情缓存大小
 */
export function getCacheSize(): number {
  return Object.keys(marketCache).length;
}

/**
 * 清空行情缓存（仅用于测试）
 */
export function clearMarketCache(): void {
  for (const key in marketCache) {
    delete marketCache[key];
  }
  console.log('[MarketCache] 🧹 Market cache cleared');
}

/**
 * 更新K线缓存
 * @param kline K线数据
 */
export function updateKlineCache(kline: KlineCache): void {
  const cacheKey = `${kline.symbol}_${kline.interval}`;
  klineCache[cacheKey] = kline;
}

/**
 * 获取K线缓存
 * @param symbol 交易对
 * @param interval 时间周期
 */
export function getKlineCache(
  symbol: string,
  interval: string
): KlineCache | undefined {
  return klineCache[`${symbol}_${interval}`];
}

/**
 * 获取所有K线缓存
 */
export function getAllKlinesCache(): Record<string, KlineCache> {
  return { ...klineCache };
}

/**
 * 获取K线缓存大小
 */
export function getKlineCacheSize(): number {
  return Object.keys(klineCache).length;
}

/**
 * 清空K线缓存（仅用于测试）
 */
export function clearKlineCache(): void {
  for (const key in klineCache) {
    delete klineCache[key];
  }
  console.log('[MarketCache] 🧹 K-line cache cleared');
}
