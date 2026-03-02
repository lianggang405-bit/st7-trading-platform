import { NextResponse } from 'next/server';
import { mockSymbols } from '@/lib/market-mock-data';

export async function GET() {
  try {
    return NextResponse.json({
      success: true,
      symbols: mockSymbols
    });
  } catch (error) {
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to get symbols',
        symbols: mockSymbols // 总是返回备用数据
      },
      { status: 500 }
    );
  }
}
