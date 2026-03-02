import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET - 获取用户的入金记录
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

    // 将userId转换为整数
    const userIdNum = parseInt(userId, 10);
    if (isNaN(userIdNum)) {
      return NextResponse.json(
        { error: '用户ID格式不正确' },
        { status: 400 }
      );
    }

    // 查询该用户的入金记录
    const { data, error } = await supabase
      .from('deposit_requests')
      .select('*')
      .eq('user_id', userIdNum)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching deposit records:', error);
      return NextResponse.json(
        { error: '获取入金记录失败' },
        { status: 500 }
      );
    }

    // 转换数据格式
    const records = (data || []).map((record) => ({
      id: record.id,
      userId: record.user_id,
      cryptoCode: record.currency,
      amount: record.amount,
      status: record.status === 'SUCCESS' ? 'approved' : record.status === 'FAIL' ? 'rejected' : 'pending',
      rejectReason: record.remark,
      createdAt: record.created_at,
      updatedAt: record.updated_at,
    }));

    return NextResponse.json({
      success: true,
      records,
    });
  } catch (error) {
    console.error('Error in GET /api/deposit/records:', error);
    return NextResponse.json(
      { error: '服务器错误' },
      { status: 500 }
    );
  }
}
