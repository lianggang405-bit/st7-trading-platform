import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET - 获取实名认证列表
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '15');
    const sort = searchParams.get('sort') || 'id';
    const order = searchParams.get('order') || 'desc';
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || 'all';

    const offset = (page - 1) * limit;

    let query = supabase
      .from('kyc_requests')
      .select('*', { count: 'exact' })
      .range(offset, offset + limit - 1)
      .order(sort, { ascending: order === 'asc' });

    // 状态过滤
    if (status !== 'all') {
      query = query.eq('status', status);
    }

    // 搜索条件
    if (search) {
      query = query.or(`real_name.ilike.%${search}%,id_number.ilike.%${search}%`);
    }

    const { data, error, count } = await query;

    if (error) {
      throw error;
    }

    // 获取用户邮箱信息
    const userIds = data?.map((req: any) => req.user_id) || [];
    const { data: users } = await supabase
      .from('users')
      .select('id, email')
      .in('id', userIds);

    const userMap = new Map(users?.map((u: any) => [u.id, u.email]));

    // 格式化数据
    const formattedRequests = data?.map((req: any) => ({
      id: req.id,
      userId: req.user_id,
      email: userMap.get(req.user_id) || '—',
      realName: req.real_name,
      idNumber: req.id_number,
      applyTime: new Date(req.created_at).toLocaleString('zh-CN'),
      status: req.status,
      rejectReason: req.reject_reason,
      idCardFront: req.id_card_front,
      idCardBack: req.id_card_back,
    })) || [];

    return NextResponse.json({
      success: true,
      requests: formattedRequests,
      total: count,
      page,
      limit,
    });
  } catch (error) {
    console.error('Failed to fetch KYC requests:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch KYC requests',
      },
      { status: 500 }
    );
  }
}
