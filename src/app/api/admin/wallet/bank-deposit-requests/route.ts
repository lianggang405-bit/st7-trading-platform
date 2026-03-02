import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET /api/admin/wallet/bank-deposit-requests - 获取银行卡充币申请列表
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '15');
    const sort = searchParams.get('sort') || 'id';
    const order = searchParams.get('order') || 'desc';
    const search = searchParams.get('search') || '';

    const offset = (page - 1) * limit;

    // 构建查询
    let query = supabase
      .from('bank_deposit_requests')
      .select('*', { count: 'exact' });

    // 搜索条件 - 搜索账号、银行名称、持卡人
    if (search) {
      query = query.or(`account.ilike.%${search}%,bank_name.ilike.%${search}%,card_holder.ilike.%${search}%`);
    }

    // 排序
    query = query.order(sort, { ascending: order === 'asc' });

    // 分页
    query = query.range(offset, offset + limit - 1);

    const { data: requests, error, count } = await query;

    if (error) {
      console.error('Failed to fetch bank deposit requests:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    // 转换数据格式以匹配前端期望
    const formattedRequests = requests?.map(req => ({
      id: req.id,
      account: req.account,
      bankName: req.bank_name,
      cardNumber: req.card_number,
      cardHolder: req.card_holder,
      amount: req.amount,
      currency: req.currency,
      status: req.status,
      createdAt: req.created_at,
    })) || [];

    return NextResponse.json({
      success: true,
      requests: formattedRequests,
      total: count || 0,
      page,
      pageSize: limit
    });
  } catch (error) {
    console.error('Error in GET bank deposit requests:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/admin/wallet/bank-deposit-requests - 创建银行卡充币申请
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      account,
      bankName,
      cardNumber,
      cardHolder,
      amount,
      currency,
      status = 'PENDING'
    } = body;

    if (!account || !bankName || !cardNumber || !cardHolder || amount === undefined || !currency) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
    }

    const { data: bankDepositRequest, error } = await supabase
      .from('bank_deposit_requests')
      .insert([
        {
          account,
          bank_name: bankName,
          card_number: cardNumber,
          card_holder: cardHolder,
          amount,
          currency,
          status,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ])
      .select()
      .single();

    if (error) {
      console.error('Failed to create bank deposit request:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, request: bankDepositRequest }, { status: 201 });
  } catch (error) {
    console.error('Error in POST bank deposit requests:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
