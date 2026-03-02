import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

const supabase = getSupabaseClient();

// GET - 获取加密货币列表
export async function GET(request: NextRequest) {
  try {
    // 从 crypto_addresses 表获取加密货币配置
    const { data, error } = await supabase
      .from('crypto_addresses')
      .select('*')
      .eq('status', 'active')
      .order('id');

    if (error) {
      console.error('Failed to fetch crypto currencies:', error);
      return NextResponse.json(
        {
          success: false,
          message: '获取加密货币列表失败',
          error: error.message,
        },
        { status: 500 }
      );
    }

    // 转换数据格式
    const currencies = data?.map((item: any) => ({
      id: item.id,
      code: item.currency,
      name: item.currency,
      nameEn: item.currency,
      symbol: item.currency,
      protocol: item.protocol || item.network, // 添加协议字段
      walletAddress: `${item.address}${item.memo ? ` (Memo: ${item.memo})` : ''}`,
      qrCode: '',
      minAmount: 0,
      maxAmount: 0,
      fee: 0,
      feeType: 'fixed' as const,
    })) || [];

    return NextResponse.json({
      success: true,
      currencies,
    });
  } catch (error) {
    console.error('Failed to fetch crypto currencies:', error);
    return NextResponse.json(
      {
        success: false,
        message: '获取加密货币列表失败',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
