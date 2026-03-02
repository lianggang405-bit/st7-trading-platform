import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
const supabase = getSupabaseClient();
// GET /api/admin/wallet/wire-info - 获取电汇信息列表
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
      .from('wire_info')
      .select('*', { count: 'exact' });

    // 搜索条件 - 搜索银行名称、收款人姓名等
    if (search) {
      query = query.or(`bank_name.ilike.%${search}%,beneficiary_name.ilike.%${search}%,swift.ilike.%${search}%`);
    }

    // 排序
    query = query.order(sort, { ascending: order === 'asc' });

    // 分页
    query = query.range(offset, offset + limit - 1);

    const { data: wireInfos, error, count } = await query;

    if (error) {
      console.error('Failed to fetch wire info:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    // 转换数据格式以匹配前端期望
    const formattedWireInfos = wireInfos?.map(info => ({
      id: info.id,
      bankName: info.bank_name,
      bankAddress: info.bank_address,
      swift: info.swift,
      beneficiaryName: info.beneficiary_name,
      beneficiaryAccount: info.beneficiary_account,
      beneficiaryCurrency: info.beneficiary_currency,
      remark: info.remark,
      isVisible: info.is_visible,
    })) || [];

    return NextResponse.json({
      success: true,
      wireInfos: formattedWireInfos,
      total: count || 0,
      page,
      pageSize: limit
    });
  } catch (error) {
    console.error('Error in GET wire info:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/admin/wallet/wire-info - 创建电汇信息
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      bankName,
      bankAddress,
      swift,
      beneficiaryName,
      beneficiaryAccount,
      beneficiaryCurrency,
      remark,
      isVisible = true
    } = body;

    if (!bankName || !beneficiaryName || !beneficiaryAccount || !beneficiaryCurrency) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
    }

    const { data: wireInfo, error } = await supabase
      .from('wire_info')
      .insert([
        {
          bank_name: bankName,
          bank_address: bankAddress,
          swift,
          beneficiary_name: beneficiaryName,
          beneficiary_account: beneficiaryAccount,
          beneficiary_currency: beneficiaryCurrency,
          remark,
          is_visible: isVisible,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ])
      .select()
      .single();

    if (error) {
      console.error('Failed to create wire info:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, wireInfo }, { status: 201 });
  } catch (error) {
    console.error('Error in POST wire info:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
