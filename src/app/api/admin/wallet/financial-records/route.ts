import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
const supabase = getSupabaseClient();

// 模拟财务记录数据
const mockFinancialRecords = [
  { id: 1, account: 'demo@example.com', beforeBalance: 0.00, amount: 100000.00, afterBalance: 100000.00, source: 'deposit', remark: '初始资金充值', createdAt: '2026-02-27T09:00:00Z' },
  { id: 2, account: 'demo@example.com', beforeBalance: 100000.00, amount: 200.00, afterBalance: 100200.00, source: 'trade_profit', remark: 'BTC交易盈利', createdAt: '2026-02-27T10:05:00Z' },
  { id: 3, account: 'demo@example.com', beforeBalance: 100200.00, amount: -10.00, afterBalance: 100190.00, source: 'trade_fee', remark: 'BTC交易手续费', createdAt: '2026-02-27T10:05:00Z' },
  { id: 4, account: 'demo@example.com', beforeBalance: 100190.00, amount: -5000.00, afterBalance: 95190.00, source: 'withdraw', remark: '提现申请', createdAt: '2026-02-27T11:00:00Z' },
  { id: 5, account: 'demo@example.com', beforeBalance: 95190.00, amount: 20000.00, afterBalance: 115190.00, source: 'deposit', remark: '银行转账充值', createdAt: '2026-02-27T12:00:00Z' },
  { id: 6, account: 'demo@example.com', beforeBalance: 115190.00, amount: 1680.00, afterBalance: 116870.00, source: 'trade_profit', remark: 'XAUUSD交易盈利', createdAt: '2026-02-27T12:15:14Z' },
  { id: 7, account: 'demo@example.com', beforeBalance: 116870.00, amount: -120.00, afterBalance: 116750.00, source: 'trade_fee', remark: 'XAUUSD交易手续费', createdAt: '2026-02-27T12:15:14Z' },
  { id: 8, account: 'demo@example.com', beforeBalance: 116750.00, amount: 45000.00, afterBalance: 161750.00, source: 'trade_profit', remark: 'XAUUSD交易盈利', createdAt: '2026-02-27T12:24:25Z' },
  { id: 9, account: 'demo@example.com', beforeBalance: 161750.00, amount: -120.00, afterBalance: 161630.00, source: 'trade_fee', remark: 'XAUUSD交易手续费', createdAt: '2026-02-27T12:24:25Z' },
  { id: 10, account: 'demo@example.com', beforeBalance: 161630.00, amount: 47.75, afterBalance: 161677.75, source: 'trade_profit', remark: 'XAUUSD交易盈利', createdAt: '2026-02-27T14:44:36Z' },
];

// GET /api/admin/wallet/financial-records - 获取财务记录列表
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '15');
    const sort = searchParams.get('sort') || 'id';
    const order = searchParams.get('order') || 'desc';
    const search = searchParams.get('search') || '';

    // 首先尝试从数据库获取
    try {
      // 构建查询 - 先不使用 join，简化查询
      let query = supabase
        .from('financial_records')
        .select('*', { count: 'exact' });

      // 搜索条件
      if (search) {
        query = query.or(`description.ilike.%${search}%,operation_type.ilike.%${search}%`);
      }

      // 排序
      query = query.order(sort, { ascending: order === 'asc' });

      // 分页
      const offset = (page - 1) * limit;
      query = query.range(offset, offset + limit - 1);

      const { data: records, error, count } = await query;

      if (!error && records) {
        // 转换数据格式以匹配前端期望
        const formattedRecords = records.map(record => ({
          id: record.id,
          account: `User ${record.user_id}`,
          beforeBalance: record.balance_before || 0,
          amount: record.amount || 0,
          afterBalance: record.balance_after || 0,
          source: record.operation_type || '币币',
          remark: record.description || '',
          createdAt: record.created_at,
        }));

        return NextResponse.json({
          success: true,
          records: formattedRecords,
          total: count || 0,
          page,
          pageSize: limit
        });
      }
    } catch (dbError) {
      console.warn('[Financial Records API] 数据库查询失败，使用模拟数据:', dbError);
    }

    // 如果数据库查询失败，使用模拟数据
    let filteredRecords = [...mockFinancialRecords];

    // 搜索过滤
    if (search) {
      const searchLower = search.toLowerCase();
      filteredRecords = filteredRecords.filter(record =>
        record.account.toLowerCase().includes(searchLower) ||
        record.remark.toLowerCase().includes(searchLower) ||
        record.source.toLowerCase().includes(searchLower)
      );
    }

    // 排序
    filteredRecords.sort((a, b) => {
      let aVal = a[sort as keyof typeof a];
      let bVal = b[sort as keyof typeof b];
      
      if (typeof aVal === 'string') {
        aVal = aVal.toLowerCase();
        bVal = (bVal as string).toLowerCase();
      }
      
      if (order === 'asc') {
        return aVal > bVal ? 1 : -1;
      }
      return aVal < bVal ? 1 : -1;
    });

    // 分页
    const total = filteredRecords.length;
    const start = (page - 1) * limit;
    const paginatedRecords = filteredRecords.slice(start, start + limit);

    return NextResponse.json({
      success: true,
      records: paginatedRecords,
      total,
      page,
      pageSize: limit,
      note: '使用模拟数据'
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
          reference_id: referenceId,
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
