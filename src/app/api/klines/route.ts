import { NextRequest, NextResponse } from 'next/server';

// 使用 Binance 公共数据 API（最稳定，不受限制）
const BINANCE_API_URL = 'https://data-api.binance.vision';

/**
 * 将交易对转换为Binance格式
 * BTCUSD -> BTCUSDT
 * EURUSD -> EURUSDT（注意：Binance 没有外汇交易对，需要特殊处理）
 */
function convertSymbol(symbol: string): string {
  // 如果已经是 USDT 结尾，直接返回
  if (symbol.includes('USDT')) {
    return symbol;
  }

  // 外汇交易对：需要添加 USDT 结尾
  // 例如：EURUSD -> EURUSDT（这是虚拟的交易对，Binance 实际上不支持）
  // 加密货币：添加 USDT
  // 贵金属/能源：添加 USDT

  // Binance 支持的加密货币交易对
  const cryptoSymbols = ['BTC', 'ETH', 'LTC', 'SOL', 'XRP', 'DOGE', 'BNB', 'ADA', 'DOT'];

  // 检查是否是加密货币
  if (cryptoSymbols.some(c => symbol.startsWith(c))) {
    return symbol.replace('USD', 'USDT');
  }

  // 其他交易对（外汇、贵金属、能源），Binance 可能不支持
  // 返回原交易对，让 API 返回错误，然后前端使用模拟数据
  return symbol;
}

/**
 * GET /api/klines
 * 从Binance API获取K线数据（通过后端代理，避免CORS问题）
 *
 * Query参数：
 * - symbol: 交易对（如 BTCUSD, XAUUSD）
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
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15秒超时

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
            { error: 'Binance API 请求超时，请稍后重试', suggestion: '建议使用模拟数据' },
            { status: 504 }
          );
        }

        // 网络连接错误
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
              error: '无法连接到 Binance API，可能是网络限制',
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

      // 400 错误：通常是参数错误或交易对不存在
      if (response.status === 400) {
        console.error('[Klines API] Binance API 参数错误或交易对不存在:', errorText);

        // 检查是否是无效的交易对
        if (errorText.includes('Invalid symbol') || errorText.includes('illegal characters')) {
          return NextResponse.json(
            {
              error: `交易对 ${symbol} 在 Binance 上不存在或不支持`,
              details: errorText,
              suggestion: 'Binance 仅支持加密货币交易对（如 BTCUSDT），外汇、贵金属等请使用模拟数据'
            },
            { status: 400 }
          );
        }

        return NextResponse.json(
          { error: `Binance API 参数错误`, details: errorText },
          { status: 400 }
        );
      }

      console.error(`[Klines API] Binance API错误: ${response.status}`, errorText);
      return NextResponse.json(
        { error: `Binance API错误: ${response.status}`, details: errorText },
        { status: response.status }
      );
    }

    const data = await response.json();

    // 检查返回数据是否有效
    if (!Array.isArray(data)) {
      console.error('[Klines API] 返回数据格式错误:', data);
      return NextResponse.json(
        { error: 'Binance API 返回数据格式错误' },
        { status: 500 }
      );
    }

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
