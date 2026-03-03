import { NextRequest } from 'next/server';
import { getPriceFromBinance } from '@/lib/market-data-source';
import { getRandomChange } from '@/lib/market-generator';
import { monitorAndTriggerOrders } from '@/lib/order-monitor';

/**
 * GET /api/market/stream
 * 实时行情数据流（SSE）
 *
 * Query 参数:
 * - symbols: 交易对列表（逗号分隔），如 BTCUSD,ETHUSD
 * - interval: 更新间隔（毫秒），默认 1000ms
 * - useRealData: 是否使用真实数据（可选，默认 true）
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const symbolsParam = searchParams.get('symbols');
  const interval = parseInt(searchParams.get('interval') || '1000', 10);
  const useRealData = searchParams.get('useRealData') !== 'false';

  if (!symbolsParam) {
    return new Response('Missing required parameter: symbols', {
      status: 400,
      headers: { 'Content-Type': 'text/plain' },
    });
  }

  const symbols = symbolsParam.split(',').map(s => s.trim());

  // 创建 SSE 流
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      console.log(`[MarketStream] Starting stream for ${symbols.join(',')} (interval: ${interval}ms)`);

      const sendEvent = (data: any) => {
        const message = `data: ${JSON.stringify(data)}\n\n`;
        controller.enqueue(encoder.encode(message));
      };

      // 发送初始连接确认
      sendEvent({
        type: 'connected',
        symbols,
        interval,
        timestamp: Date.now(),
      });

      // 定时发送行情数据
      const intervalId = setInterval(async () => {
        try {
          const updates: { [symbol: string]: { price: number; change?: number } } = {};

          for (const symbol of symbols) {
            if (useRealData) {
              // 使用真实数据
              const price = await getPriceFromBinance(symbol);
              if (price !== null) {
                // 随机生成涨跌幅（因为 Binance ticker 单独请求较慢）
                updates[symbol] = {
                  price,
                  change: getRandomChange(),
                };
              }
            } else {
              // 使用模拟数据
              const basePrices: { [key: string]: number } = {
                BTCUSD: 95000,
                ETHUSD: 3400,
                SOLUSD: 240,
                XRPUSD: 2.5,
                BNBUSD: 680,
                DOGEUSD: 0.38,
                ADAUSD: 1.1,
              };

              const basePrice = basePrices[symbol] || 100;
              const price = basePrice * (0.95 + Math.random() * 0.1);

              updates[symbol] = {
                price,
                change: getRandomChange(),
              };
            }
          }

          // 发送行情更新
          sendEvent({
            type: 'update',
            data: updates,
            timestamp: Date.now(),
          });

          // 异步检查订单触发（不阻塞 SSE 流）
          monitorAndTriggerOrders().catch(error => {
            console.error('[MarketStream] Order monitoring error:', error);
          });
        } catch (error) {
          console.error('[MarketStream] Error fetching market data:', error);

          // 发送错误事件
          sendEvent({
            type: 'error',
            message: 'Failed to fetch market data',
            timestamp: Date.now(),
          });
        }
      }, interval);

      // 客户端断开连接时清理
      request.signal.addEventListener('abort', () => {
        console.log('[MarketStream] Client disconnected');
        clearInterval(intervalId);
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no', // 禁用 Nginx 缓冲
    },
  });
}
