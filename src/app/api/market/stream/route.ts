/**
 * 实时行情流 API
 *
 * 注意：由于环境限制，Binance WebSocket 无法使用
 * 此端点已禁用，请使用 /api/market 轮询获取数据（建议 1 秒间隔）
 */

import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  // 获取查询参数
  const searchParams = request.nextUrl.searchParams;
  const symbolsParam = searchParams.get('symbols');

  if (!symbolsParam) {
    return Response.json({ error: 'Missing symbols parameter' }, { status: 400 });
  }

  const symbols = symbolsParam.split(',').map(s => s.trim().toUpperCase());

  // 创建 SSE 流
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      console.log(`[MarketStream] New connection for symbols: ${symbols.join(', ')}`);

      // 发送错误消息，通知客户端使用轮询
      const sendSSE = (data: string) => {
        controller.enqueue(encoder.encode(`data: ${data}\n\n`));
      };

      sendSSE(JSON.stringify({
        type: 'error',
        state: 'disabled',
        message: 'Binance WebSocket is disabled in this environment. Please use /api/market with 1 second polling instead.',
        symbols,
        timestamp: Date.now(),
      }));

      // 关闭连接
      setTimeout(() => {
        controller.close();
      }, 100);
    },

    cancel() {
      console.log('[MarketStream] Connection cancelled');
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
