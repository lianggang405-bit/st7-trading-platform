import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
const supabase = getSupabaseClient();
// GET /api/admin/wallet/deposit-requests - 获取充值申请列表
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '15');
    const sort = searchParams.get('sort') || 'id';
    const order = searchParams.get('order') || 'desc';
    const search = searchParams.get('search') || '';

    const offset = (page - 1) * limit;

    // 构建查询 - 关联用户表获取邮箱
    let query = supabase
      .from('deposit_requests')
      .select(`
        id,
        user_id,
        type,
        currency,
        amount,
        tx_hash,
        proof_image,
        status,
        remark,
        created_at,
        users (
          email
        )
      `, { count: 'exact' });

    // 排序
    query = query.order(sort, { ascending: order === 'asc' });

    // 分页
    query = query.range(offset, offset + limit - 1);

    const { data: requests, error, count } = await query;

    if (error) {
      console.error('Failed to fetch deposit requests:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    // 转换数据格式以匹配前端期望
    const formattedRequests = requests?.map((req: any) => ({
      id: req.id,
      account: req.users?.[0]?.email || '',
      email: req.users?.[0]?.email || '',
      currency: req.currency,
      paymentAddress: req.tx_hash || '-',
      amount: req.amount,
      usdAmount: req.amount, // 简化处理，使用相同值
      proofImage: '', // 表中暂无此字段
      status: req.status,
      createdAt: req.created_at,
      type: req.type,
      txHash: req.tx_hash,
    })) || [];

    return NextResponse.json({
      success: true,
      requests: formattedRequests,
      total: count || 0,
      page,
      pageSize: limit
    });
  } catch (error) {
    console.error('Error in GET deposit requests:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/admin/wallet/deposit-requests - 创建充值申请
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      userId,
      type = 'crypto',
      currency,
      amount,
      txHash,
      remark,
      status = 'pending'
    } = body;

    if (!userId || !currency || amount === undefined) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
    }

    const { data: depositRequest, error } = await supabase
      .from('deposit_requests')
      .insert([
        {
          user_id: userId,
          type,
          currency,
          amount,
          tx_hash: txHash,
          remark,
          status,
        }
      ])
      .select()
      .single();

    if (error) {
      console.error('Failed to create deposit request:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, request: depositRequest }, { status: 201 });
  } catch (error) {
    console.error('Error in POST deposit requests:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
