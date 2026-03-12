/**
 * 实时行情流 API
 *
 * 使用 Binance WebSocket 获取实时行情数据，并通过 SSE 推送给客户端
 *
 * GET /api/market/stream?symbols=BTCUSDT,ETHUSDT&type=ticker
 */

import { NextRequest } from 'next/server';
import { binanceWS, Subscription, MarketTicker, Kline } from '@/lib/services/binance-ws';

// 保存活跃的连接
const activeStreams = new Map<ReadableStreamDefaultController, string[]>();

export async function GET(request: NextRequest) {
  // 获取查询参数
  const searchParams = request.nextUrl.searchParams;
  const symbolsParam = searchParams.get('symbols');
  const type = (searchParams.get('type') || 'ticker') as 'ticker' | 'kline' | 'depth' | 'trade';
  const interval = searchParams.get('interval') || '1m';

  if (!symbolsParam) {
    return Response.json({ error: 'Missing symbols parameter' }, { status: 400 });
  }

  const symbols = symbolsParam.split(',').map(s => s.trim().toUpperCase());

  // 创建 SSE 流
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      console.log(`[MarketStream] New connection for symbols: ${symbols.join(', ')}`);

      // 初始化消息处理器集合
      const messageHandlers: Set<(() => void)> = new Set();

      // 发送连接成功消息
      const sendSSE = (data: string) => {
        controller.enqueue(encoder.encode(`data: ${data}\n\n`));
      };

      // 发送连接状态
      sendSSE(JSON.stringify({
        type: 'connection',
        state: 'connected',
        symbols,
        timestamp: Date.now(),
      }));

      // 创建订阅配置
      const subscription: Subscription = {
        type,
        symbols,
        interval: type === 'kline' ? interval : undefined,
      };

      // 添加消息处理器
      const messageHandler = (data: any) => {
        try {
          // 根据数据类型处理
          let messageData;

          if (type === 'ticker' && data.e === '24hrTicker') {
            messageData = {
              type: 'ticker',
              symbol: data.s,
              data: {
                eventTime: data.E,
                priceChange: data.p,
                priceChangePercent: data.P,
                weightedAvgPrice: data.wap,
                prevClosePrice: data.xc,
                lastPrice: data.c,
                lastQty: data.Q,
                bidPrice: data.b,
                bidQty: data.B,
                askPrice: data.a,
                askQty: data.A,
                openPrice: data.o,
                highPrice: data.h,
                lowPrice: data.l,
                volume: data.v,
                quoteVolume: data.q,
                openTime: data.O,
                closeTime: data.C,
                firstId: data.F,
                lastId: data.L,
                count: data.n,
              },
            };
          } else if (type === 'kline' && data.e === 'kline') {
            messageData = {
              type: 'kline',
              symbol: data.s,
              interval: data.k.i,
              data: {
                eventTime: data.E,
                startTime: data.k.t,
                closeTime: data.k.T,
                open: data.k.o,
                high: data.k.h,
                low: data.k.l,
                close: data.k.c,
                volume: data.k.v,
                numberOfTrades: data.k.n,
                isKlineClosed: data.k.x,
                quoteVolume: data.k.q,
                takerBuyBaseVolume: data.k.V,
                takerBuyQuoteVolume: data.k.Q,
              },
            };
          } else if (type === 'depth' && data.e === 'depthUpdate') {
            messageData = {
              type: 'depth',
              symbol: data.s,
              data: {
                lastUpdateId: data.u,
                bids: data.b,
                asks: data.a,
              },
            };
          } else if (type === 'trade' && data.e === 'trade') {
            messageData = {
              type: 'trade',
              symbol: data.s,
              data: {
                eventTime: data.E,
                tradeTime: data.T,
                tradeId: data.t,
                price: data.p,
                qty: data.q,
                buyerIsMaker: data.m,
                ignore: data.M,
              },
            };
          } else {
            // 默认处理
            messageData = {
              type: 'unknown',
              data,
            };
          }

          sendSSE(JSON.stringify({
            ...messageData,
            timestamp: Date.now(),
          }));
        } catch (error) {
          console.error('[MarketStream] Failed to process message:', error);
        }
      };

      // 注册消息处理器
      binanceWS.onMessage(type === 'ticker' ? '24hrTicker' : type, messageHandler);
      messageHandlers.add(() => binanceWS.offMessage(type === 'ticker' ? '24hrTicker' : type, messageHandler));

      // 监听连接状态
      const connectionHandler = (state: string) => {
        sendSSE(JSON.stringify({
          type: 'connection',
          state,
          timestamp: Date.now(),
        }));
      };
      binanceWS.onConnection(connectionHandler);
      messageHandlers.add(() => binanceWS.offConnection(connectionHandler));

      // 订阅数据流
      binanceWS.subscribe(subscription);

      // 保存清理函数
      const cleanup = () => {
        console.log(`[MarketStream] Cleaning up connection for symbols: ${symbols.join(', ')}`);

        // 移除所有消息处理器
        messageHandlers.forEach(cleanup => cleanup());

        // 取消订阅
        binanceWS.unsubscribe(subscription);
      };

      // 保存到活跃流
      activeStreams.set(controller, symbols);

      // 将清理函数附加到控制器
      (controller as any).cleanup = cleanup;
    },

    cancel(controller) {
      console.log(`[MarketStream] Connection cancelled`);
      
      // 执行清理
      const cleanup = (controller as any).cleanup;
      if (cleanup) {
        cleanup();
      }

      // 从活跃流中移除
      activeStreams.delete(controller);
    },
  });

  // 返回 SSE 响应
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no', // 禁用 nginx 缓冲
    },
  });
}


