import { NextRequest, NextResponse } from 'next/server';

const MARKET_SERVICE_URL = 'http://localhost:3000';

// 时间周期映射
const INTERVAL_MAP: Record<string, string> = {
  '1M': '1',
  '5M': '5',
  '15M': '15',
  '1H': '60',
  '4H': '240',
  '1D': '1D',
};

/**
 * GET /api/klines
 * 获取K线数据（代理到 market-service）
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const symbol = searchParams.get('symbol');
  const interval = searchParams.get('interval') || '1M';
  const limit = parseInt(searchParams.get('limit') || '200');

  if (!symbol) {
    return NextResponse.json(
      { success: false, error: 'Symbol is required' },
      { status: 400 }
    );
  }

  try {
    // 转换交易对格式
    let tradingViewSymbol = symbol;

    // 检查是否是加密货币（BTC, ETH, SOL 等）
    const cryptoSymbols = ['BTC', 'ETH', 'SOL', 'BNB', 'XRP', 'ADA', 'DOT', 'DOGE', 'AVAX', 'LINK'];
    const isCrypto = cryptoSymbols.some(crypto => symbol.startsWith(crypto));

    if (isCrypto) {
      // 加密货币使用 USDT 结尾（BTCUSD → BTCUSDT）
      if (symbol.endsWith('USD')) {
        tradingViewSymbol = symbol.replace('USD', 'USDT');
      }
    }
    // 贵金属、外汇、能源、指数等保持原样（XAUUSD, XAGUSD, EURUSD 等）
    // 不添加 'T' 后缀

    // ⚠️ 从数据库获取该交易对的最新时间戳
    let latestKlineTime = 0;
    try {
      const dbSymbol = tradingViewSymbol; // 使用转换后的 symbol
      const dbUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/klines?select=open_time&symbol=eq.${dbSymbol}&interval=eq.1m&order=open_time.desc&limit=1`;

      const dbResponse = await fetch(dbUrl, {
        headers: {
          'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY || '',
          'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY || ''}`,
          'Content-Type': 'application/json',
        },
      } as RequestInit);

      if (dbResponse.ok) {
        const dbData = await dbResponse.json();
        if (dbData && dbData.length > 0) {
          latestKlineTime = Math.floor(dbData[0].open_time / 1000);
          console.log(`[Klines API] Latest kline time from DB (${dbSymbol}): ${latestKlineTime}`);
        } else {
          console.log(`[Klines API] No data found in DB for symbol: ${dbSymbol}`);
        }
      }
    } catch (error) {
      console.error('[Klines API] Failed to fetch latest time from DB:', error);
    }

    // 转换时间周期
    const tvInterval = INTERVAL_MAP[interval] || '1';

    // 使用数据库最新时间作为基准，如果没有则使用当前系统时间
    const baseTime = latestKlineTime > 0 ? latestKlineTime : Math.floor(Date.now() / 1000);

    // 根据时间周期计算时间跨度
    let timeSpan = 0;
    switch (interval) {
      case '1M':
        timeSpan = 60 * limit; // 每根1分钟
        break;
      case '5M':
        timeSpan = 300 * limit; // 每根5分钟
        break;
      case '15M':
        timeSpan = 900 * limit; // 每根15分钟
        break;
      case '1H':
        timeSpan = 3600 * limit; // 每根1小时
        break;
      case '4H':
        timeSpan = 14400 * limit; // 每根4小时
        break;
      case '1D':
        timeSpan = 86400 * limit; // 每根1天
        break;
      default:
        timeSpan = 60 * limit;
    }

    // 设置时间范围：从数据库最新时间往前推，或从系统时间往前推
    const from = baseTime - (timeSpan * 2); // 扩大2倍时间范围
    const to = baseTime + 86400; // 包含未来1天（避免边界问题）

    // 构建请求 URL
    const url = `${MARKET_SERVICE_URL}/tv/history?symbol=${tradingViewSymbol}&resolution=${tvInterval}&from=${from}&to=${to}`;

    console.log(`[Klines API] 请求 market-service: ${url}`);

    // 请求 market-service
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store', // 禁用缓存，确保实时数据
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Klines API] market-service error:', response.status, errorText);

      // 如果 market-service 返回 no_data，返回空数组而不是错误
      if (response.status === 200) {
        const data = await response.json();
        if (data.s === 'no_data') {
          console.log('[Klines API] market-service 返回 no_data，返回空数组');
          return NextResponse.json({
            success: true,
            data: [],
          });
        }
      }

      throw new Error(`market-service error: ${response.status}`);
    }

    const data = await response.json();

    // 检查 TradingView API 返回的状态
    if (data.s === 'error') {
      console.error('[Klines API] TradingView API error:', data.errmsg);
      return NextResponse.json(
        { success: false, error: data.errmsg || 'Failed to fetch klines' },
        { status: 500 }
      );
    }

    if (data.s === 'no_data') {
      console.log('[Klines API] No data available for this symbol');
      // ✅ 返回标准 TradingView 响应（no_data）
      return NextResponse.json({
        success: true,
        data: [],
      });
    }

    // 转换数据格式
    // ⚠️ TradingView API 返回的是秒级时间戳，lightweight-charts 也需要秒级时间戳
    // ⚠️ 所有数值必须是 Number 类型，不能是字符串
    type KlineData = {
      time: number;
      open: number;
      high: number;
      low: number;
      close: number;
      volume: number;
    };

    const klines: KlineData[] = data.t.map((time: number, index: number) => ({
      time,  // 秒级时间戳（TradingView API 返回的已经是秒级）
      open: Number(data.o[index]),
      high: Number(data.h[index]),
      low: Number(data.l[index]),
      close: Number(data.c[index]),
      volume: Number(data.v[index]) || 0,
    }));

    // ✅ 按时间升序排序（Lightweight Charts 要求）
    klines.sort((a: KlineData, b: KlineData) => a.time - b.time);

    console.log(`[Klines API] 成功获取 ${klines.length} 条K线数据`);
    console.log(`[Klines API] 第一条数据:`, klines[0]);

    return NextResponse.json({
      success: true,
      data: klines,
    });

  } catch (error) {
    console.error('[Klines API] Error:', error);

    // ✅ 返回错误，不生成 mock 数据
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch klines',
      },
      { status: 500 }
    );
  }
}


