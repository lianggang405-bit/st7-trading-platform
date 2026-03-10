import express from 'express';
import { getSupabase } from '../config/database';
import { isRedisEnabled } from '../config/redis';
import { aggregateCandles } from '../engine/kline-engine';
import {
  getAggregatedKlinesFromRedis,
  setAggregatedKlinesToRedis
} from '../cache/redis-cache';
import { getAggregatedKlineList } from '../engine/kline-engine';

const router = express.Router();

/**
 * TradingView UDF API - Config
 * 返回支持的配置信息
 */
router.get('/config', (req, res) => {
  res.json({
    supported_resolutions: ['1', '5', '15', '60', '240', '1D'],
    supports_group_request: false,
    supports_marks: false,
    supports_search: false,
    supports_time: true,
  });
});

/**
 * TradingView UDF API - Time
 * 返回服务器时间戳（秒）
 */
router.get('/time', (req, res) => {
  res.json(Math.floor(Date.now() / 1000));
});

/**
 * TradingView UDF API - Symbols
 * 返回交易对信息
 */
router.get('/symbols', async (req, res) => {
  try {
    const symbol = req.query.symbol as string;

    if (!symbol) {
      return res.status(400).json({
        s: 'error',
        errmsg: 'Symbol is required'
      });
    }

    // 从数据库查询交易对信息
    const supabase = getSupabase();
    const { data: symbolData, error } = await supabase
      .from('symbols')
      .select('*')
      .eq('symbol', symbol.toUpperCase())
      .single();

    if (error || !symbolData) {
      // 如果数据库中没有，返回默认配置
      return res.json({
        name: symbol,
        ticker: symbol,
        description: symbol,
        type: 'crypto',
        session: '24x7',
        exchange: 'ST7',
        minmov: 1,
        pricescale: 100,
        has_intraday: true,
        supported_resolutions: ['1', '5', '15', '60', '240', '1D'],
        timezone: 'Asia/Shanghai',
        data_status: 'streaming',
      });
    }

    // 根据 type 返回不同的配置
    let type = 'crypto';
    if (symbolData.type === 'forex') {
      type = 'forex';
    } else if (symbolData.type === 'metal') {
      type = 'crypto';
    } else if (symbolData.type === 'oil') {
      type = 'crypto';
    } else if (symbolData.type === 'index') {
      type = 'index';
    }

    // 根据 price_precision 设置 pricescale
    const pricescale = Math.pow(10, symbolData.price_precision || 2);

    res.json({
      name: symbol,
      ticker: symbol,
      description: symbolData.name || symbol,
      type,
      session: '24x7',
      exchange: 'ST7',
      minmov: 1,
      pricescale,
      has_intraday: true,
      supported_resolutions: ['1', '5', '15', '60', '240', '1D'],
      timezone: 'Asia/Shanghai',
      data_status: 'streaming',
    });
  } catch (error) {
    console.error('[TradingView API] Error in /symbols:', error);
    res.status(500).json({
      s: 'error',
      errmsg: 'Internal server error'
    });
  }
});

/**
 * TradingView UDF API - History
 * 返回历史 K 线数据
 */
router.get('/history', async (req, res) => {
  try {
    const { symbol, resolution, from, to } = req.query;
    const MAX_BARS = 1000; // 最多返回1000根K线

    if (!symbol || !resolution || !from || !to) {
      return res.status(400).json({
        s: 'error',
        errmsg: 'Missing required parameters'
      });
    }

    // 转换 resolution 格式（TradingView 使用 "1", "5" 等，数据库使用 "1m", "5m" 等）
    const interval = `${resolution}m`;
    const fromTimestamp = Number(from) * 1000; // 转换为毫秒
    const toTimestamp = Number(to) * 1000;

    // ✅ 转换交易对格式：XAUUSDT → XAUUSD, EURUSDT → EURUSD
    const symbolStr = symbol as string;
    let dbSymbol = symbolStr.toUpperCase();
    if (dbSymbol.endsWith('USDT')) {
      dbSymbol = dbSymbol.replace('USDT', 'USD');
    }

    console.log(
      `[TradingView API] Fetching history: ${symbol} -> ${dbSymbol}, resolution: ${resolution}, ` +
      `from: ${fromTimestamp} (${new Date(fromTimestamp).toISOString()}), to: ${toTimestamp} (${new Date(toTimestamp).toISOString()})`
    );

    // 📊 K线聚合策略：如果请求的不是 1m，则从 1m 聚合
    if (resolution !== '1') {
      console.log(`[TradingView API] 🔄 Need to aggregate from 1m to ${interval}`);

      // 🎯 统一数据源策略：只从增量聚合获取数据，避免重复
      let aggregated: any[] | null = null;

      if (isRedisEnabled()) {
        const incrementalCandles = await getAggregatedKlineList(
          dbSymbol,
          resolution as any,
          MAX_BARS * 2  // 获取更多数据，避免时间范围不足
        );

        if (incrementalCandles && incrementalCandles.length > 0) {
          console.log(
            `[TradingView API] ⚡ Got ${incrementalCandles.length} incremental ${interval} candles from Redis`
          );

          // 过滤时间范围（注意：增量聚合返回的是秒级时间戳）
          aggregated = incrementalCandles.filter((c: any) => {
            const candleTime = c.time * 1000; // 转换为毫秒
            return candleTime >= fromTimestamp && candleTime <= toTimestamp;
          });

          // 🔍 去重：基于时间戳去重
          const uniqueMap = new Map();
          aggregated.forEach((c: any) => {
            uniqueMap.set(c.time, c);
          });
          aggregated = Array.from(uniqueMap.values()).sort((a, b) => a.time - b.time);

          console.log(
            `[TradingView API] 📊 After filtering & deduplication: ${aggregated.length} ${interval} candles`
          );
        }
      }

      // 如果增量聚合未命中，尝试从缓存读取
      if ((!aggregated || aggregated.length === 0) && isRedisEnabled()) {
        const cached = await getAggregatedKlinesFromRedis(dbSymbol, resolution);
        if (cached && cached.length > 0) {
          console.log(
            `[TradingView API] ✅ Got ${cached.length} cached ${interval} candles from Redis`
          );

          // 过滤时间范围
          aggregated = cached.filter((c: any) => {
            const candleTime = c.open_time; // 毫秒时间戳
            return candleTime >= fromTimestamp && candleTime <= toTimestamp;
          });

          // 🔍 去重：基于时间戳去重
          const uniqueMap = new Map();
          aggregated.forEach((c: any) => {
            uniqueMap.set(c.open_time, c);
          });
          aggregated = Array.from(uniqueMap.values()).sort((a, b) => a.open_time - b.open_time);

          console.log(
            `[TradingView API] 📊 After filtering & deduplication: ${aggregated.length} ${interval} candles`
          );
        }
      }

      // 如果缓存未命中或数据不足，实时聚合
      if (!aggregated || aggregated.length === 0) {
        console.log(`[TradingView API] 🔍 Cache miss, aggregating from 1m...`);

        // 🔍 查询更多 1m K 线（需要聚合，所以查询数量要多一些）
        // 例如：请求 100 根 5m K 线，需要查询 500 根 1m K 线
        const aggregationCount = getAggregationCount(resolution);
        const queryLimit = MAX_BARS * aggregationCount;

        console.log(`[TradingView API] 📊 Querying ${queryLimit} 1m candles for aggregation`);

        const supabase = getSupabase();
        const result = await supabase
          .from('klines')
          .select('*')
          .eq('symbol', dbSymbol)
          .eq('interval', '1m')
          .gte('open_time', fromTimestamp - (aggregationCount * 60000)) // 扩大时间范围，确保有足够的数据聚合
          .lte('open_time', toTimestamp)
          .order('open_time', { ascending: true }) // 必须升序，聚合需要
          .limit(queryLimit);

        const data = result.data;
        const error = result.error;

        console.log(
          `[TradingView API] Query result: error=${!!error}, 1m data.length=${data?.length || 0}`
        );

        if (error || !data || data.length === 0) {
          console.log('[TradingView API] No 1m data found for aggregation');
          return res.json({
            s: 'no_data',
            nextTime: Math.floor(Date.now() / 1000)
          });
        }

        // ✅ 聚合 K 线
        aggregated = aggregateCandles(data, interval as any);

        if (aggregated.length === 0) {
          console.log('[TradingView API] No aggregated data');
          return res.json({
            s: 'no_data',
            nextTime: Math.floor(Date.now() / 1000)
          });
        }

        console.log(`[TradingView API] ✅ Aggregated ${aggregated.length} ${interval} candles`);

        // ✅ 缓存聚合结果到 Redis
        if (isRedisEnabled()) {
          const cacheData = aggregated.map((c: any) => ({
            open_time: c.time * 1000, // 转换为毫秒
            open: c.open,
            high: c.high,
            low: c.low,
            close: c.close,
            volume: c.volume
          }));

          await setAggregatedKlinesToRedis(dbSymbol, resolution, cacheData);
        }
      }

      if (aggregated.length === 0) {
        console.log('[TradingView API] No aggregated data in time range');
        return res.json({
          s: 'no_data',
          nextTime: Math.floor(Date.now() / 1000)
        });
      }

      console.log(`[TradingView API] ✅ Returning ${aggregated.length} ${interval} candles`);

      // 转换为 TradingView 格式
      return formatTradingViewResponse(aggregated, res);
    }

    // 📊 如果是 1m K 线，直接查询数据库
    console.log(`[TradingView API] 📊 Querying 1m candles directly`);

    // 查询数据库
    const supabase = getSupabase();
    const result = await supabase
      .from('klines')
      .select('*')
      .eq('symbol', dbSymbol)
      .eq('interval', interval)
      .gte('open_time', fromTimestamp)
      .lte('open_time', toTimestamp)
      .order('open_time', { ascending: false }) // DESC 查询，性能更好
      .limit(MAX_BARS);

    const data = result.data;
    const error = result.error;

    console.log(`[TradingView API] Query result: error=${!!error}, data.length=${data?.length || 0}`);

    if (error) {
      console.error('[TradingView API] Error fetching history:', error);
      return res.json({
        s: 'error',
        errmsg: error.message
      });
    }

    if (!data || data.length === 0) {
      console.log('[TradingView API] No data found');

      // 计算 nextTime（建议从当前时间开始）
      const currentTime = Math.floor(Date.now() / 1000); // 秒级时间戳

      return res.json({
        s: 'no_data',
        nextTime: currentTime // 建议从当前时间开始请求
      });
    }

    // 反转数据为升序（TradingView 需要升序）
    const ascendingData = data.reverse();

    // 转换为 TradingView 格式
    return formatTradingViewResponse(ascendingData, res);
  } catch (error) {
    console.error('[TradingView API] Error in /history:', error);
    res.status(500).json({
      s: 'error',
      errmsg: 'Internal server error'
    });
  }
});

/**
 * TradingView UDF API - Search (可选)
 * 搜索交易对
 */
router.get('/search', async (req, res) => {
  try {
    const { query, type, limit = 30 } = req.query;

    console.log(`[TradingView API] Search: query=${query}, type=${type}`);

    // 构建查询
    const supabase = getSupabase();
    let queryBuilder = supabase
      .from('symbols')
      .select('symbol, name, type, base_asset, quote_asset')
      .limit(Number(limit));

    // 如果有查询条件
    if (query) {
      queryBuilder = queryBuilder.or(
        `symbol.ilike.%${query}%,name.ilike.%${query}%`
      );
    }

    // 如果有类型过滤
    if (type && type !== 'all') {
      queryBuilder = queryBuilder.eq('type', type);
    }

    const { data, error } = await queryBuilder;

    if (error) {
      console.error('[TradingView API] Error in search:', error);
      return res.json([]);
    }

    // 转换为 TradingView 格式
    const symbols = (data || []).map((s) => ({
      symbol: s.symbol,
      full_name: s.symbol,
      description: s.name,
      exchange: 'ST7',
      type: s.type,
    }));

    res.json(symbols);
  } catch (error) {
    console.error('[TradingView API] Error in /search:', error);
    res.json([]);
  }
});

/**
 * 辅助函数：获取周期对应的毫秒数
 */
function getIntervalMs(interval: string): number {
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

  return intervalMap[interval] || 60 * 1000; // 默认 1 分钟
}

/**
 * 辅助函数：获取聚合系数（1m → targetInterval）
 * @param resolution TradingView 分辨率（5, 15, 60, 240, 1D）
 * @returns 需要聚合的 1m K 线数量
 */
function getAggregationCount(resolution: string): number {
  const resolutionMap: Record<string, number> = {
    '5': 5,      // 5 分钟 = 5 根 1m
    '15': 15,    // 15 分钟 = 15 根 1m
    '30': 30,    // 30 分钟 = 30 根 1m
    '60': 60,    // 1 小时 = 60 根 1m
    '240': 240,  // 4 小时 = 240 根 1m
    '1D': 1440,  // 1 天 = 1440 根 1m (24 * 60)
  };

  return resolutionMap[resolution] || 1;
}

/**
 * 辅助函数：转换为 TradingView 格式
 * @param candles K 线数据数组
 * @param res Express Response 对象
 */
function formatTradingViewResponse(
  candles: Array<{ time: number; open: number; high: number; low: number; close: number; volume: number } | { open_time: string | number; open: number; high: number; low: number; close: number; volume: number }>,
  res: any
): void {
  const t: number[] = [];
  const o: number[] = [];
  const h: number[] = [];
  const l: number[] = [];
  const c: number[] = [];
  const v: number[] = [];

  candles.forEach((kline) => {
    // 判断是聚合后的数据还是原始数据
    const time = 'time' in kline ? kline.time : Math.floor(new Date(kline.open_time).getTime() / 1000);

    t.push(time);
    o.push(parseFloat(kline.open));
    h.push(parseFloat(kline.high));
    l.push(parseFloat(kline.low));
    c.push(parseFloat(kline.close));
    v.push(parseFloat(kline.volume) || 0);
  });

  console.log(
    `[TradingView API] ✅ Formatted ${candles.length} candles for TradingView`
  );

  res.json({
    s: 'ok',
    t,
    o,
    h,
    l,
    c,
    v
  });
}

export default router;
