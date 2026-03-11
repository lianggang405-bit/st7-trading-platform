import { NextResponse } from 'next/server';

// 动态导入 kline-data-source 模块
async function clearCache() {
  try {
    const { clearKlineCache } = await import('@/lib/kline-data-source');
    clearKlineCache();
    return { success: true, message: 'K线缓存已清除' };
  } catch (error) {
    return { success: false, error: '清除缓存失败' };
  }
}

export async function GET() {
  const result = await clearCache();
  return NextResponse.json(result);
}

export async function POST() {
  const result = await clearCache();
  return NextResponse.json(result);
}
