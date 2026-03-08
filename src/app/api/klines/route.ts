import { NextRequest, NextResponse } from 'next/server';
import { getKlines } from '@/lib/market-klines';
import { klineCache } from '@/lib/kline-cache';

/**
 * GET /api/klines
 * 行情聚合API - 自动选择数据源并返回统一K线数据
 *
 * Query参数：
 * - symbol: 交易对（如 XAUUSD, BTCUSD, EURUSD）
 * - interval: 时间周期（如 1M, 5M, 15M, 1H）
 * - limit: K线数量（默认200，最大1000）
 * - format: 数据格式（object/array，默认object）
 * - noCache: 是否禁用缓存（true/false，默认false）
 * - before: 加载指定时间之前的K线（用于分页加载历史数据）
 * - after: 加载指定时间之后的K线（用于分页加载未来数据）
 *
 * 返回统一格式的K线数据：
 * [
 *   {
 *     time: 1772999460,
 *     open: 2850.5,
 *     high: 2852.0,
 *     low: 2848.0,
 *     close: 2851.5,
 *     volume: 1234.5
 *   },
 *   ...
 * ]
 *
 * 或压缩格式（format=array）：
 * [
 *   [time, open, high, low, close, volume],
 *   ...
 * ]
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const symbol = searchParams.get('symbol');
    const interval = searchParams.get('interval');
    const limit = parseInt(searchParams.get('limit') || '200', 10);
    const format = searchParams.get('format') || 'object';
    const noCache = searchParams.get('noCache') === 'true';
    const before = searchParams.get('before');
    const after = searchParams.get('after');

    // 验证参数
    if (!symbol || !interval) {
      return NextResponse.json(
        { error: '缺少必要参数：symbol 和 interval' },
        { status: 400 }
      );
    }

    if (limit < 1 || limit > 1000) {
      return NextResponse.json(
        { error: 'limit 参数必须在 1-1000 之间' },
        { status: 400 }
      );
    }

    console.log(`[Klines API] 请求: symbol=${symbol}, interval=${interval}, limit=${limit}, before=${before}, after=${after}`);

    // 尝试从缓存获取（分页加载时不使用缓存）
    let klines: any[] = [];
    let fromCache = false;

    if (!noCache && !before && !after) {
      const cachedData = klineCache.get(symbol, interval, limit);
      if (cachedData) {
        klines = cachedData;
        fromCache = true;
        console.log(`[Klines API] 从缓存返回 ${klines.length} 条K线数据`);
      }
    }

    // 缓存未命中或分页加载，从数据源获取
    if (!klines.length) {
      // TODO: 实现分页加载逻辑（需要修改 getKlines 函数支持 before/after）
      // 暂时使用现有逻辑
      klines = await getKlines(symbol, interval, limit);

      // 如果有 before/after 参数，进行过滤
      if (before) {
        const beforeTime = parseInt(before, 10);
        klines = klines.filter(k => k.time < beforeTime);
      } else if (after) {
        const afterTime = parseInt(after, 10);
        klines = klines.filter(k => k.time > afterTime);
      }

      // 限制返回数量
      klines = klines.slice(0, limit);

      console.log(`[Klines API] 从数据源获取 ${klines.length} 条K线数据`);

      // 存入缓存（仅首次加载）
      if (!noCache && !before && !after) {
        klineCache.set(symbol, interval, limit, klines);
      }
    }

    // 根据格式转换数据
    let responseData = klines;
    if (format === 'array') {
      // 压缩格式：[time, open, high, low, close, volume]
      responseData = klines.map(k => [k.time, k.open, k.high, k.low, k.close, k.volume]);
    }

    // 返回数据
    return NextResponse.json({
      success: true,
      symbol,
      interval,
      limit,
      format,
      fromCache,
      before,
      after,
      hasMore: klines.length >= limit, // 是否还有更多数据
      data: responseData,
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=10, stale-while-revalidate=30', // CDN 缓存策略
      },
    });
  } catch (error) {
    console.error('[Klines API] 错误:', error);

    return NextResponse.json(
      {
        error: '获取K线数据失败',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
