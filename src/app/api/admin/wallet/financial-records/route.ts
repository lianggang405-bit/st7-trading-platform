import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
const supabase = getSupabaseClient();
// GET /api/admin/wallet/financial-records - 获取财务记录列表
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
      .from('financial_records')
      .select('*, users!inner(email)', { count: 'exact' });

    // 搜索条件 - 搜索账号或描述
    if (search) {
      query = query.or(`users.email.ilike.%${search}%,description.ilike.%${search}%`);
    }

    // 排序
    query = query.order(sort, { ascending: order === 'asc' });

    // 分页
    query = query.range(offset, offset + limit - 1);

    const { data: records, error, count } = await query;

    if (error) {
      console.error('Failed to fetch financial records:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    // 转换数据格式以匹配前端期望
    const formattedRecords = records?.map(record => ({
      id: record.id,
      account: record.users?.email || `User ${record.user_id}`,
      beforeBalance: record.balance_before || 0,
      amount: record.amount || 0,
      afterBalance: record.balance_after || 0,
      source: record.operation_type || '币币',
      remark: record.description || '',
      createdAt: record.created_at,
    })) || [];

    return NextResponse.json({
      success: true,
      records: formattedRecords,
      total: count || 0,
      page,
      pageSize: limit
    });
  } catch (error) {
    console.error('Error in GET financial records:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/admin/wallet/financial-records - 创建财务记录
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      userId = 1,
      walletId = 1,
      accountType = 'demo',
      operationType = 'deposit',
      amount,
      balanceBefore,
      balanceAfter,
      description,
      referenceId,
      referenceType,
      status = 'completed'
    } = body;

    if (amount === undefined || balanceBefore === undefined || balanceAfter === undefined) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
    }

    const { data: record, error } = await supabase
      .from('financial_records')
      .insert([
        {
          user_id: userId,
          wallet_id: walletId,
          account_type: accountType,
          operation_type: operationType,
          amount,
          balance_before: balanceBefore,
          balance_after: balanceAfter,
          description,
          reference_id,
          reference_type: referenceType,
          status,
          created_at: new Date().toISOString()
        }
      ])
      .select()
      .single();

    if (error) {
      console.error('Failed to create financial record:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, record }, { status: 201 });
  } catch (error) {
    console.error('Error in POST financial records:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
