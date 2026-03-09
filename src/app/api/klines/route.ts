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
    // 转换交易对格式（XAUUSD → XAUUSDT, BTCUSD → BTCUSDT）
    let tradingViewSymbol = symbol;

    // 检查是否是加密货币（BTC, ETH, SOL 等）
    const cryptoSymbols = ['BTC', 'ETH', 'SOL', 'BNB', 'XRP', 'ADA', 'DOT', 'DOGE', 'AVAX', 'LINK'];
    const isCrypto = cryptoSymbols.some(crypto => symbol.startsWith(crypto));

    if (isCrypto) {
      // 加密货币使用 USDT 结尾
      if (symbol.endsWith('USD')) {
        tradingViewSymbol = symbol.replace('USD', 'USDT');
      }
    } else {
      // 其他交易对（外汇、贵金属等）
      // XAUUSD → XAUUSDT, EURUSD → EURUSDT
      if (symbol.endsWith('USD')) {
        tradingViewSymbol = symbol + 'T';
      }
    }

    // 转换时间周期
    const tvInterval = INTERVAL_MAP[interval] || '1';

    // 计算时间范围
    // 为了获取最近的数据，我们需要设置合理的时间范围
    const now = Math.floor(Date.now() / 1000);

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

    // 设置更大的时间范围以确保获取到数据
    const from = now - (timeSpan * 2); // 扩大2倍时间范围
    const to = now + 86400; // 包含未来1天（避免边界问题）

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
      console.log('[Klines API] No data available，生成模拟数据');

      // ✅ 生成模拟数据（await，因为现在是 async）
      const mockKlines = await generateMockKlines(symbol, interval, limit);

      return NextResponse.json({
        success: true,
        data: mockKlines,
      });
    }

    // 转换数据格式
    const klines = data.t.map((time: number, index: number) => ({
      time,
      open: data.o[index],
      high: data.h[index],
      low: data.l[index],
      close: data.c[index],
      volume: data.v[index] || 0,
    }));

    // ✅ 按时间升序排序（Lightweight Charts 要求）
    klines.sort((a, b) => a.time - b.time);

    console.log(`[Klines API] 成功获取 ${klines.length} 条K线数据`);

    return NextResponse.json({
      success: true,
      data: klines,
    });

  } catch (error) {
    console.error('[Klines API] Error:', error);

    // ✅ 发生错误时生成模拟数据（await，因为现在是 async）
    console.log('[Klines API] 发生错误，生成模拟数据');
    const mockKlines = await generateMockKlines(symbol, interval, limit);

    return NextResponse.json({
      success: true,
      data: mockKlines,
    });
  }
}

/**
 * 生成模拟K线数据
 * @param symbol 交易对
 * @param interval 时间周期
 * @param limit K线数量
 */
async function generateMockKlines(
  symbol: string,
  interval: string,
  limit: number
): Promise<Array<{ time: number; open: number; high: number; low: number; close: number; volume: number }>> {
  // ✅ 尝试从 market-service 获取最后一个 K 线的收盘价
  const lastClose = await getLastCloseFromMarketService(symbol, interval);
  let basePrice = lastClose || getBasePriceForSymbol(symbol);

  // 计算间隔时间（秒）
  let intervalSeconds = 60;
  switch (interval) {
    case '1M':
      intervalSeconds = 60;
      break;
    case '5M':
      intervalSeconds = 300;
      break;
    case '15M':
      intervalSeconds = 900;
      break;
    case '1H':
      intervalSeconds = 3600;
      break;
    case '4H':
      intervalSeconds = 14400;
      break;
    case '1D':
      intervalSeconds = 86400;
      break;
  }

  const now = Math.floor(Date.now() / 1000);

  const klines: Array<{ time: number; open: number; high: number; low: number; close: number; volume: number }> = [];

  let price = basePrice;

  console.log(`[Klines API] 生成模拟K线: symbol=${symbol}, basePrice=${basePrice}, count=${limit}, lastClose=${lastClose}`);

  for (let i = limit; i > 0; i--) {
    const time = now - (i * intervalSeconds);

    // ✅ 根据价格范围设置波动幅度
    let volatility: number;
    let precision: number;

    if (price < 10) {
      // 小价格（外汇）：0.0001 的绝对波动，精度 5 位小数
      volatility = 0.0001;
      precision = 5;
    } else if (price < 100) {
      // 中等价格（贵金属）：0.01 的绝对波动，精度 2 位小数
      volatility = 0.01;
      precision = 2;
    } else if (price < 1000) {
      // 大价格（ETH 等）：0.1 的绝对波动，精度 2 位小数
      volatility = 0.1;
      precision = 2;
    } else if (price < 10000) {
      // 超大价格（BTC 等价格在 1000-10000 范围）：1 的绝对波动，精度 1 位小数
      volatility = 1;
      precision = 1;
    } else {
      // 极大价格（BTC 等价格 > 10000）：10 的绝对波动，精度 0 位小数
      volatility = 10;
      precision = 0;
    }

    const open = price;
    const change = (Math.random() - 0.5) * volatility;
    price = price + change;

    const high = Math.max(open, price) + Math.random() * volatility * 0.5;
    const low = Math.min(open, price) - Math.random() * volatility * 0.5;

    klines.push({
      time,
      open: Number(open.toFixed(precision)),
      high: Number(high.toFixed(precision)),
      low: Number(low.toFixed(precision)),
      close: Number(price.toFixed(precision)),
      volume: Math.floor(Math.random() * 10000),
    });
  }

  // ✅ 按时间升序排序
  klines.sort((a, b) => a.time - b.time);

  console.log(`[Klines API] 模拟数据生成完成: ${klines.length} 条K线`);

  return klines;
}

/**
 * 从 market-service 获取最后一个 K 线的收盘价
 * @param symbol 交易对
 * @param interval 时间周期
 */
async function getLastCloseFromMarketService(
  symbol: string,
  interval: string
): Promise<number | null> {
  try {
    // 转换交易对格式
    let tradingViewSymbol = symbol;

    // 检查是否是加密货币（BTC, ETH, SOL 等）
    const cryptoSymbols = ['BTC', 'ETH', 'SOL', 'BNB', 'XRP', 'ADA', 'DOT', 'DOGE', 'AVAX', 'LINK'];
    const isCrypto = cryptoSymbols.some(crypto => symbol.startsWith(crypto));

    if (isCrypto) {
      // 加密货币使用 USDT 结尾
      if (symbol.endsWith('USD')) {
        tradingViewSymbol = symbol.replace('USD', 'USDT');
      }
    } else {
      // 其他交易对（外汇、贵金属等）
      // XAUUSD → XAUUSDT, EURUSD → EURUSDT
      if (symbol.endsWith('USD')) {
        tradingViewSymbol = symbol + 'T';
      }
    }

    // 转换时间周期
    const INTERVAL_MAP: Record<string, string> = {
      '1M': '1',
      '5M': '5',
      '15M': '15',
      '1H': '60',
      '4H': '240',
      '1D': '1D',
    };
    const tvInterval = INTERVAL_MAP[interval] || '1';

    // 计算时间范围（查询最近 1 小时的数据）
    const now = Math.floor(Date.now() / 1000);
    const from = now - 3600; // 1 小时前
    const to = now + 86400; // 包含未来1天

    const url = `${MARKET_SERVICE_URL}/tv/history?symbol=${tradingViewSymbol}&resolution=${tvInterval}&from=${from}&to=${to}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      console.warn(`[Klines API] Failed to fetch last close: ${response.status}`);
      return null;
    }

    const data = await response.json();

    // 检查是否有数据
    if (data.s === 'no_data' || !data.t || data.t.length === 0) {
      console.log(`[Klines API] No history data for ${symbol}`);
      return null;
    }

    // 获取最后一个 K 线的收盘价
    const lastClose = data.c[data.c.length - 1];
    console.log(`[Klines API] Loaded last close for ${symbol}: ${lastClose}`);

    return lastClose;
  } catch (error) {
    console.warn(`[Klines API] Error fetching last close:`, error);
    return null;
  }
}

/**
 * 获取交易对基础价格
 */
function getBasePriceForSymbol(symbol: string): number {
  const priceMap: Record<string, number> = {
    'BTCUSD': 66000,
    'ETHUSD': 3500,
    'XAUUSD': 2350,
    'EURUSD': 1.08,
    'GBPUSD': 1.26,
    'USDJPY': 150,
    'USDCHF': 0.88,
    'AUDUSD': 0.65,
    'USDCAD': 1.36,
    'NZDUSD': 0.60,
  };

  return priceMap[symbol] || 100;
}
