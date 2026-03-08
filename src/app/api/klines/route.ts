import { NextRequest, NextResponse } from 'next/server';

const BINANCE_API_URL = 'https://api.binance.com';

/**
 * 将交易对转换为Binance格式
 * BTCUSD -> BTCUSDT
 */
function convertSymbol(symbol: string): string {
  return symbol.replace('USD', 'USDT');
}

/**
 * GET /api/klines
 * 从Binance API获取K线数据（通过后端代理，避免CORS问题）
 *
 * Query参数：
 * - symbol: 交易对（如 BTCUSD）
 * - interval: 时间周期（如 1M, 5M, 15M, 1H）
 * - limit: K线数量（默认80，最大1000）
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const symbol = searchParams.get('symbol');
    const interval = searchParams.get('interval');
    const limit = parseInt(searchParams.get('limit') || '80', 10);

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

    // 转换参数为Binance格式
    const binanceSymbol = convertSymbol(symbol);
    const binanceInterval = interval.toLowerCase();

    // 构造Binance API URL
    const url = `${BINANCE_API_URL}/api/v3/klines?symbol=${binanceSymbol}&interval=${binanceInterval}&limit=${limit}`;

    console.log(`[Klines API] 请求Binance: ${url}`);

    // 调用Binance API，添加超时设置
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10秒超时

    let response;
    try {
      response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
        signal: controller.signal,
      });
    } catch (fetchError) {
      clearTimeout(timeoutId);

      console.error('[Klines API] Fetch error:', fetchError);

      // 检查是否是网络错误
      if (fetchError instanceof Error) {
        // 超时错误
        if (fetchError.name === 'AbortError') {
          console.error('[Klines API] 请求超时');
          return NextResponse.json(
            { error: 'Binance API 请求超时，请稍后重试' },
            { status: 504 }
          );
        }

        // 网络连接错误（检查 message 和 cause）
        const errorMsg = fetchError.message.toLowerCase();
        const causeMsg = (fetchError as any).cause?.message?.toLowerCase() || '';

        if (errorMsg.includes('econnreset') ||
            errorMsg.includes('econnrefused') ||
            errorMsg.includes('fetch failed') ||
            causeMsg.includes('econnreset') ||
            causeMsg.includes('econnrefused')) {
          console.error('[Klines API] 网络连接失败:', fetchError.message);
          return NextResponse.json(
            {
              error: '无法连接到 Binance API，可能是网络限制或服务不可用',
              details: fetchError.message,
              suggestion: '建议使用模拟数据继续操作'
            },
            { status: 503 }
          );
        }
      }

      // 其他未知错误
      console.error('[Klines API] 未知的 fetch 错误:', fetchError);
      return NextResponse.json(
        {
          error: '获取 Binance 数据时发生错误',
          details: fetchError instanceof Error ? fetchError.message : String(fetchError),
        },
        { status: 503 }
      );
    } finally {
      clearTimeout(timeoutId);
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[Klines API] Binance API错误: ${response.status}`, errorText);
      return NextResponse.json(
        { error: `Binance API错误: ${response.status}`, details: errorText },
        { status: response.status }
      );
    }

    const data = await response.json();

    // 转换Binance格式为我们的格式
    const klines = data.map((k: any[]) => ({
      time: k[0] / 1000, // 转换为秒
      open: parseFloat(k[1]),
      high: parseFloat(k[2]),
      low: parseFloat(k[3]),
      close: parseFloat(k[4]),
      volume: parseFloat(k[5]),
      closeTime: k[6] / 1000,
      quoteVolume: parseFloat(k[7]),
      trades: k[8],
      takerBuyBase: parseFloat(k[9]),
      takerBuyQuote: parseFloat(k[10]),
      ignore: k[11],
    }));

    console.log(`[Klines API] 成功获取 ${klines.length} 条K线数据`);

    // 返回数据
    return NextResponse.json({
      success: true,
      symbol,
      interval,
      klines,
    });
  } catch (error) {
    console.error('[Klines API] 错误:', error);
    return NextResponse.json(
      {
        error: '服务器内部错误',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
