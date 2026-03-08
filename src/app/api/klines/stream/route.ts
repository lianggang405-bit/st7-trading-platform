import { NextRequest } from 'next/server';
import { klineStreamService } from '@/lib/kline-stream';

/**
 * GET /api/klines/stream
 * K线实时推送 SSE 接口
 *
 * Query参数：
 * - symbols: 交易对列表（逗号分隔），如 BTCUSD,ETHUSD
 * - intervals: 时间周期列表（逗号分隔），如 1M,5M,15M
 *
 * 示例：
 * /api/klines/stream?symbols=BTCUSD,ETHUSD&intervals=1M,5M
 */
export async function GET(request: NextRequest) {
  // 检查是否支持 SSE
  const accept = request.headers.get('accept');
  if (accept && !accept.includes('text/event-stream')) {
    return new Response('This endpoint requires SSE support', { status: 400 });
  }

  // 获取参数
  const searchParams = request.nextUrl.searchParams;
  const symbols = searchParams.get('symbols')?.split(',').map(s => s.trim()) || [];
  const intervals = searchParams.get('intervals')?.split(',').map(i => i.trim()) || ['1M'];

  // 验证参数
  if (symbols.length === 0) {
    return new Response('Missing symbols parameter', { status: 400 });
  }

  if (intervals.length === 0) {
    return new Response('Missing intervals parameter', { status: 400 });
  }

  console.log(`[Kline Stream] 新连接: symbols=${symbols.join(',')}, intervals=${intervals.join(',')}`);

  // 创建 SSE 流
  const encoder = new TextEncoder();
  const clientId = `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  const stream = new ReadableStream({
    start(controller) {
      // 发送初始化消息
      const initMessage = {
        type: 'init',
        clientId,
        symbols,
        intervals,
        timestamp: Date.now(),
      };

      controller.enqueue(encoder.encode(`event: init\ndata: ${JSON.stringify(initMessage)}\n\n`));

      // 添加客户端到服务
      const response = {
        write: (chunk: string) => {
          controller.enqueue(encoder.encode(chunk));
        },
      };

      klineStreamService.addClient(clientId, response, symbols, intervals);

      // 心跳：每30秒发送一次
      const heartbeatInterval = setInterval(() => {
        const heartbeat = {
          type: 'heartbeat',
          timestamp: Date.now(),
        };
        try {
          controller.enqueue(encoder.encode(`event: heartbeat\ndata: ${JSON.stringify(heartbeat)}\n\n`));
        } catch (error) {
          clearInterval(heartbeatInterval);
        }
      }, 30000);

      // 清理函数
      return () => {
        clearInterval(heartbeatInterval);
        klineStreamService.removeClient(clientId);
        console.log(`[Kline Stream] 连接关闭: ${clientId}`);
      };
    },
    cancel() {
      klineStreamService.removeClient(clientId);
      console.log(`[Kline Stream] 连接取消: ${clientId}`);
    },
  });

  // 返回 SSE 响应
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET',
      'Access-Control-Allow-Headers': 'Cache-Control',
    },
  });
}
