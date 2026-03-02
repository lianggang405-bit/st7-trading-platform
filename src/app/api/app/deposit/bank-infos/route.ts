import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

const supabase = getSupabaseClient();

// GET - 获取银行信息列表
export async function GET(request: NextRequest) {
  try {
    // 从 wire_infos 表获取银行信息
    const { data, error } = await supabase
      .from('wire_infos')
      .select('*')
      .eq('status', 'active')
      .order('id');

    if (error) {
      console.error('Failed to fetch bank infos:', error);
      return NextResponse.json(
        {
          success: false,
          message: '获取银行信息失败',
          error: error.message,
        },
        { status: 500 }
      );
    }

    // 转换数据格式
    const infos = data?.map((item: any) => ({
      id: item.id,
      bankName: item.bank_name,
      bankAccount: item.bank_account,
      accountName: item.account_name,
      bankCode: item.bank_code || '',
      branch: item.branch || '',
      qrCode: item.qr_code_url || '',
    })) || [];

    return NextResponse.json({
      success: true,
      infos,
    });
  } catch (error) {
    console.error('Failed to fetch bank infos:', error);
    return NextResponse.json(
      {
        success: false,
        message: '获取银行信息失败',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
