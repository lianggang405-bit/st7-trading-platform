import { NextRequest } from 'next/server';
import { getMarketData } from '@/lib/market/market-engine';

// ✅ 禁用 Next.js API 缓存，确保实时流式传输
export const dynamic = 'force-dynamic';

/**
 * 实时行情流 API (Server-Sent Events)
 *
 * 功能：
 * - 每 3 秒推送一次市场数据
 * - 客户端自动重连
 * - 单向推送（服务器 → 客户端）
 *
 * 使用方式：
 * ```javascript
 * const eventSource = new EventSource('/api/market/stream');
 * eventSource.onmessage = (e) => {
 *   const data = JSON.parse(e.data);
 *   console.log('实时价格:', data.symbols);
 * };
 * ```
 */
export async function GET(request: NextRequest) {
  const encoder = new TextEncoder();

  // 创建可读流
  const stream = new ReadableStream({
    async start(controller) {
      console.log('[Market Stream] Client connected');

      let isRunning = true;

      // 发送数据函数
      const sendData = async () => {
        if (!isRunning) return;

        try {
          const symbols = await getMarketData();

          const data = {
            type: 'price_update',
            timestamp: Date.now(),
            symbols,
          };

          // SSE 格式: data: <JSON>\n\n
          const message = `data: ${JSON.stringify(data)}\n\n`;
          controller.enqueue(encoder.encode(message));

          console.log(`[Market Stream] Sent ${symbols.length} symbols at ${new Date().toISOString()}`);
        } catch (error) {
          console.error('[Market Stream] Error fetching data:', error);

          // 发送错误消息
          const errorMessage = `data: ${JSON.stringify({
            type: 'error',
            message: 'Failed to fetch market data',
            timestamp: Date.now(),
          })}\n\n`;
          controller.enqueue(encoder.encode(errorMessage));
        }
      };

      // 立即发送一次数据
      await sendData();

      // 定时发送数据（每 3 秒）
      const intervalId = setInterval(() => {
        sendData().catch(error => {
          console.error('[Market Stream] Error in interval:', error);
        });
      }, 3000);

      // 处理客户端断开连接
      request.signal.addEventListener('abort', () => {
        console.log('[Market Stream] Client disconnected');
        isRunning = false;
        clearInterval(intervalId);
        controller.close();
      });
    },
  });

  // 返回 SSE 响应
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no', // 禁用 Nginx 缓冲
    },
  });
}
