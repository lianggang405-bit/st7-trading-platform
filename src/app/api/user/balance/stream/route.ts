import { NextRequest } from 'next/server';

/**
 * GET - 余额实时推送（SSE）
 *
 * 使用 Server-Sent Events 实时推送用户资产变动
 */

interface BalanceSnapshot {
  balance: number;
  equity: number;
  floatingProfit: number;
}

export async function GET(request: NextRequest) {
  // 从 URL 参数获取 token（EventSource 不支持自定义 header）
  const searchParams = request.nextUrl.searchParams;
  const token = searchParams.get('token');

  if (!token) {
    return new Response('Token required', { status: 401 });
  }

  // 解析 token 获取 user_id
  const match = token.match(/^token_(.+)_(\d+)$/);
  if (!match) {
    return new Response('Invalid token', { status: 401 });
  }

  const userId = match[1];

  // 创建 SSE 流
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      // 发送初始连接消息
      const data = JSON.stringify({
        type: 'connected',
        userId,
        timestamp: new Date().toISOString(),
      });
      controller.enqueue(encoder.encode(`data: ${data}\n\n`));

      // 轮询检查余额变动（每 2 秒）
      let lastBalance: BalanceSnapshot | null = null;
      let requestCount = 0;
      const maxRequests = 1800; // 1 小时（每 2 秒一次请求）

      const intervalId = setInterval(async () => {
        try {
          requestCount++;

          // 检查是否超过最大请求数（1 小时）
          if (requestCount > maxRequests) {
            clearInterval(intervalId);
            clearInterval(heartbeatId);
            controller.close();
            return;
          }

          // 调用资产 API 获取最新余额
          const response = await fetch(`${request.nextUrl.origin}/api/user/assets`, {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          });

          if (response.ok) {
            const result = await response.json();

            if (result.success && result.data) {
              const currentBalance = result.data.balance;
              const currentEquity = result.data.equity;
              const currentFloatingProfit = result.data.floatingProfit;

              // 检查是否有变动
              if (lastBalance === null ||
                  currentBalance !== lastBalance.balance ||
                  currentEquity !== lastBalance.equity ||
                  currentFloatingProfit !== lastBalance.floatingProfit) {

                const updateData = {
                  type: 'balance_update',
                  data: result.data,
                  timestamp: new Date().toISOString(),
                };

                controller.enqueue(encoder.encode(`data: ${JSON.stringify(updateData)}\n\n`));

                lastBalance = {
                  balance: currentBalance,
                  equity: currentEquity,
                  floatingProfit: currentFloatingProfit,
                };
              }
            }
          }
        } catch (error) {
          console.error('[Balance SSE] Error fetching balance:', error);
        }
      }, 2000); // 每 2 秒轮询一次

      // 心跳检测（每 30 秒发送一次）
      const heartbeatId = setInterval(() => {
        try {
          const heartbeatData = {
            type: 'heartbeat',
            timestamp: new Date().toISOString(),
          };
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(heartbeatData)}\n\n`));
        } catch (error) {
          console.error('[Balance SSE] Error sending heartbeat:', error);
        }
      }, 30000);

      // 清理函数
      request.signal.addEventListener('abort', () => {
        clearInterval(intervalId);
        clearInterval(heartbeatId);
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
