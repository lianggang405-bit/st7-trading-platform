import express from 'express';
import { getSupabase } from '../config/database';

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

    console.log(
      `[TradingView API] Fetching history: ${symbol}, interval: ${interval}, ` +
      `from: ${fromTimestamp}, to: ${toTimestamp}`
    );

    // 从数据库查询 K 线数据（使用 DESC 查询提升性能，然后在代码中反转）
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('klines')
      .select('*')
      .eq('symbol', symbol.toUpperCase())
      .eq('interval', interval)
      .gte('open_time', fromTimestamp)
      .lte('open_time', toTimestamp)
      .order('open_time', { ascending: false }) // DESC 查询，性能更好
      .limit(MAX_BARS);

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
      const intervalMs = getIntervalMs(interval);

      return res.json({
        s: 'no_data',
        nextTime: currentTime // 建议从当前时间开始请求
      });
    }

    // 反转数据为升序（TradingView 需要升序）
    const ascendingData = data.reverse();

    // 转换数据格式（TradingView 需要的格式）
    const t: number[] = [];
    const o: number[] = [];
    const h: number[] = [];
    const l: number[] = [];
    const c: number[] = [];
    const v: number[] = [];

    ascendingData.forEach((kline) => {
      // open_time 已经是毫秒时间戳，直接转换为秒
      t.push(Math.floor(kline.open_time / 1000));
      o.push(parseFloat(kline.open));
      h.push(parseFloat(kline.high));
      l.push(parseFloat(kline.low));
      c.push(parseFloat(kline.close));
      v.push(parseFloat(kline.volume) || 0);
    });

    console.log(
      `[TradingView API] ✅ Fetched ${data.length} candles for ${symbol}`
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

export default router;
