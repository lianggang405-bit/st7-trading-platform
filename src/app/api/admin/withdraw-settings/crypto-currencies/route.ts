import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// 数据库字段映射到API字段
interface DatabaseCurrency {
  id: number;
  name: string;
  protocol: string;
  usd_rate: number;
  withdrawal_fee: number;
  min_withdrawal: number;
  max_withdrawal: number;
  is_visible: boolean;
  created_at: string;
  updated_at: string;
}

// API响应字段
interface ApiCurrency {
  id: number;
  currency: string;
  network: string;
  minAmount: number;
  maxAmount: number;
  fee: number;
  feeType: 'fixed' | 'percentage';
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
}

// 映射函数：数据库 -> API
function mapDbToApi(db: DatabaseCurrency): ApiCurrency {
  return {
    id: db.id,
    currency: db.name,
    network: db.protocol,
    minAmount: db.min_withdrawal,
    maxAmount: db.max_withdrawal,
    fee: db.withdrawal_fee,
    feeType: 'fixed', // 默认为固定费率
    status: db.is_visible ? 'active' : 'inactive',
    created_at: db.created_at,
    updated_at: db.updated_at,
  };
}

// 映射函数：API -> 数据库
function mapApiToDb(api: Partial<ApiCurrency>): Partial<DatabaseCurrency> {
  const db: Partial<DatabaseCurrency> = {};

  if (api.currency !== undefined) db.name = api.currency;
  if (api.network !== undefined) db.protocol = api.network;
  if (api.minAmount !== undefined) db.min_withdrawal = api.minAmount;
  if (api.maxAmount !== undefined) db.max_withdrawal = api.maxAmount;
  if (api.fee !== undefined) db.withdrawal_fee = api.fee;
  if (api.status !== undefined) db.is_visible = api.status === 'active';

  return db;
}

// GET - 获取数字货币币种列表
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '15');
    const sortBy = searchParams.get('sortBy') || 'id';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    const search = searchParams.get('search') || '';

    // 计算偏移量
    const offset = (page - 1) * pageSize;

    // 构建查询
    let query = supabase
      .from('digital_currency_currencies')
      .select('*', { count: 'exact' });

    // 搜索过滤
    if (search) {
      query = query.or(`name.ilike.%${search}%,protocol.ilike.%${search}%`);
    }

    // 排序
    query = query.order(sortBy, { ascending: sortOrder === 'asc' });

    // 分页
    query = query.range(offset, offset + pageSize - 1);

    const { data, error, count } = await query;

    if (error) {
      console.error('Error fetching digital currency currencies:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch digital currency currencies' },
        { status: 500 }
      );
    }

    // 转换数据格式
    const currencies = (data || []).map(mapDbToApi);

    return NextResponse.json({
      success: true,
      currencies,
      total: count || 0,
      page,
      pageSize,
      totalPages: Math.ceil((count || 0) / pageSize),
    });
  } catch (error) {
    console.error('Error in GET /api/admin/withdraw-settings/crypto-currencies:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - 创建数字货币币种
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      currency,
      network,
      minAmount,
      maxAmount,
      fee,
      feeType = 'fixed',
      status = 'active',
    } = body;

    // 验证必填字段
    if (!currency || !network || minAmount === undefined || maxAmount === undefined) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: currency, network, minAmount, maxAmount' },
        { status: 400 }
      );
    }

    // 映射到数据库字段
    const dbData = mapApiToDb({
      currency,
      network,
      minAmount,
      maxAmount,
      fee: fee || 0,
      status,
    });

    // 插入数据
    const { data, error } = await supabase
      .from('digital_currency_currencies')
      .insert([
        {
          ...dbData,
          usd_rate: 1, // 默认汇率
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    if (error) {
      console.error('Error creating digital currency currency:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to create digital currency currency' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, currency: mapDbToApi(data) }, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/admin/withdraw-settings/crypto-currencies:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
