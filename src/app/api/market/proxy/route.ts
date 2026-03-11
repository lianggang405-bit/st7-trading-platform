import { NextRequest, NextResponse } from 'next/server';

/**
 * 服务端行情代理 API
 * 
 * 解决 CORS 问题：
 * 浏览器 → 自己的 API → 第三方 API
 * 
 * GET /api/market/proxy?url=...&method=GET
 */

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get('url');
  const method = searchParams.get('method') || 'GET';

  if (!url) {
    return NextResponse.json(
      { success: false, error: '缺少 url 参数' },
      { status: 400 }
    );
  }

  console.log('[Market Proxy] 代理请求:', { url, method });

  try {
    const response = await fetch(url, {
      method: method as RequestInit['method'],
      headers: {
        'Content-Type': 'application/json',
      },
      signal: AbortSignal.timeout(10000), // 10 秒超时
    });

    if (!response.ok) {
      console.warn('[Market Proxy] 请求失败:', response.status, response.statusText);
      return NextResponse.json(
        { success: false, error: `请求失败: ${response.statusText}` },
        { status: response.status }
      );
    }

    const data = await response.json();

    console.log('[Market Proxy] 请求成功');

    // 返回原始数据，添加 CORS 头
    return NextResponse.json(
      { success: true, data },
      {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      }
    );
  } catch (error) {
    console.error('[Market Proxy] 错误:', error);
    return NextResponse.json(
      { success: false, error: '代理请求失败' },
      { status: 500 }
    );
  }
}

// 处理 OPTIONS 请求（预检）
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
