import { NextRequest, NextResponse } from 'next/server';
import { writeFileSync, appendFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

/**
 * 监控日志上报 API
 * 接收客户端上报的日志并保存到文件
 */

// 日志文件路径
const LOG_DIR = join(process.cwd(), 'logs', 'monitoring');
const LOG_FILE = join(LOG_DIR, `monitoring-${new Date().toISOString().split('T')[0]}.log`);

// 确保日志目录存在
if (!existsSync(LOG_DIR)) {
  mkdirSync(LOG_DIR, { recursive: true });
}

/**
 * 格式化日志为文本
 */
function formatLog(log: any): string {
  const timestamp = new Date(log.timestamp).toISOString();
  return `[${timestamp}] [${log.level?.toUpperCase()}] [${log.type}] ` +
         `User:${log.userId} | Session:${log.sessionId}\n` +
         `  Message: ${log.message || 'N/A'}\n` +
         `  URL: ${log.pageUrl}\n` +
         `  Device: ${log.deviceInfo?.browser || 'Unknown'} | ${log.deviceInfo?.deviceType || 'Unknown'}\n` +
         (log.error ? `  Error: ${log.error.name} - ${log.error.message}\n  Stack: ${log.error.stack?.substring(0, 200) || 'N/A'}\n` : '') +
         (log.performance ? `  Performance: ${JSON.stringify(log.performance)}\n` : '') +
         (log.action ? `  Action: ${log.action.type} on ${log.action.target}\n` : '') +
         (log.extra ? `  Extra: ${JSON.stringify(log.extra).substring(0, 300)}\n` : '') +
         '----------------------------------------\n';
}

/**
 * POST /api/monitoring/log
 * 接收客户端上报的日志
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { logs } = body;

    if (!Array.isArray(logs) || logs.length === 0) {
      return NextResponse.json(
        { error: 'Invalid logs data' },
        { status: 400 }
      );
    }

    // 写入日志文件
    const logEntries = logs.map(formatLog).join('\n');
    appendFileSync(LOG_FILE, logEntries, 'utf-8');

    console.log(`[Monitoring] Received ${logs.length} logs, saved to ${LOG_FILE}`);

    return NextResponse.json({
      success: true,
      received: logs.length,
    });
  } catch (error) {
    console.error('[Monitoring] Failed to process logs:', error);
    return NextResponse.json(
      { error: 'Failed to process logs' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/monitoring/log
 * 获取最近的日志（用于调试）
 */
export async function GET(request: NextRequest) {
  try {
    // 只在开发环境允许访问
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json(
        { error: 'Access denied in production' },
        { status: 403 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '50');

    if (!existsSync(LOG_FILE)) {
      return NextResponse.json({
        success: true,
        logs: [],
        message: 'No logs found',
      });
    }

    // 读取日志文件（使用 Node.js 的 fs）
    const fs = await import('fs/promises');
    const content = await fs.readFile(LOG_FILE, 'utf-8');

    // 解析日志
    const lines = content.split('----------------------------------------').filter(line => line.trim());
    const recentLogs = lines.slice(-limit).reverse();

    return NextResponse.json({
      success: true,
      logs: recentLogs,
      total: lines.length,
    });
  } catch (error) {
    console.error('[Monitoring] Failed to read logs:', error);
    return NextResponse.json(
      { error: 'Failed to read logs' },
      { status: 500 }
    );
  }
}
