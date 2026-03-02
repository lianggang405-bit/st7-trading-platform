import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET - 获取用户的出金记录
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: '用户ID不能为空' },
        { status: 400 }
      );
    }

    // 查询该用户的出金记录
    const { data, error } = await supabase
      .from('withdrawal_requests')
      .select('*')
      .eq('account', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching withdrawal records:', error);
      return NextResponse.json(
        { error: '获取出金记录失败' },
        { status: 500 }
      );
    }

    // 转换数据格式
    const records = (data || []).map((record) => ({
      id: record.id,
      userId: record.account,
      currency: record.currency,
      amount: record.withdrawal_amount,
      fee: record.fee || 0,
      arrivalAmount: record.actual_amount,
      address: record.withdrawal_address,
      status: record.status === 'SUCCESS' ? 'approved' : record.status === 'FAIL' ? 'rejected' : 'pending',
      rejectReason: record.reject_reason,
      createdAt: record.created_at,
      updatedAt: record.updated_at,
    }));

    return NextResponse.json({
      success: true,
      records,
    });
  } catch (error) {
    console.error('Error in GET /api/app/withdraw/records:', error);
    return NextResponse.json(
      { error: '服务器错误' },
      { status: 500 }
    );
  }
}
