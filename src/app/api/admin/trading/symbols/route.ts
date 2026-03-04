import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { recordMockUsage } from '@/lib/mock-monitor';
import { verifyAdminToken } from '@/lib/admin-auth';

const supabase = getSupabaseClient();

// ✅ Mock 数据生成函数
function generateMockSymbols(page: number, limit: number, search: string = '') {
  const mockSymbols = [
    { id: 1, name: 'BTC', alias: 'Bitcoin', icon: '/icons/btc.png', type: 'crypto', sort: 1, isVisible: true, flashContractFee: 1.0, contractSize: 100 },
    { id: 2, name: 'ETH', alias: 'Ethereum', icon: '/icons/eth.png', type: 'crypto', sort: 2, isVisible: true, flashContractFee: 1.0, contractSize: 100 },
    { id: 3, name: 'SOL', alias: 'Solana', icon: '/icons/sol.png', type: 'crypto', sort: 3, isVisible: true, flashContractFee: 1.0, contractSize: 100 },
    { id: 4, name: 'XAUUSD', alias: 'Gold', icon: '/icons/gold.png', type: 'metal', sort: 4, isVisible: true, flashContractFee: 1.0, contractSize: 100 },
    { id: 5, name: 'EURUSD', alias: 'Euro/US Dollar', icon: '/icons/eur.png', type: 'forex', sort: 5, isVisible: true, flashContractFee: 0.1, contractSize: 1000 },
  ];

  let filtered = mockSymbols;
  if (search) {
    filtered = mockSymbols.filter(s =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.alias.toLowerCase().includes(search.toLowerCase())
    );
  }

  const offset = (page - 1) * limit;
  return filtered.slice(offset, offset + limit);
}

// 获取外汇交易对别名
function getForexAlias(symbol: string): string {
  const aliases: { [key: string]: string } = {
    EURUSD: 'Euro/US Dollar',
    GBPUSD: 'British Pound/US Dollar',
    USDJPY: 'US Dollar/Japanese Yen',
    USDCHF: 'US Dollar/Swiss Franc',
    EURAUD: 'Euro/Australian Dollar',
    EURGBP: 'Euro/British Pound',
    EURJPY: 'Euro/Japanese Yen',
    GBPAUD: 'British Pound/Australian Dollar',
    GBPNZD: 'British Pound/New Zealand Dollar',
    GBPJPY: 'British Pound/Japanese Yen',
    AUDUSD: 'Australian Dollar/US Dollar',
    AUDJPY: 'Australian Dollar/Japanese Yen',
    NZDUSD: 'New Zealand Dollar/US Dollar',
    NZDJPY: 'New Zealand Dollar/Japanese Yen',
    CADJPY: 'Canadian Dollar/Japanese Yen',
    CHFJPY: 'Swiss Franc/Japanese Yen',
  };
  return aliases[symbol] || symbol;
}

// GET - 获取品种列表
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '15');
    const sort = searchParams.get('sort') || 'id';
    const order = searchParams.get('order') || 'desc';
    const search = searchParams.get('search') || '';

    const offset = (page - 1) * limit;

    // ✅ 直接使用 trading_pairs 表，不依赖 currencies 表
    let query = supabase
      .from('trading_pairs')
      .select('*', { count: 'exact' })
      .range(offset, offset + limit - 1)
      .order('id', { ascending: order === 'asc' });

    // 如果有搜索条件
    if (search) {
      query = query.or(`symbol.ilike.%${search}%`);
    }

    const { data, error, count } = await query;

    // ✅ 如果出错，返回 mock 数据
    if (error) {
      console.warn('[Symbols API] Table query failed, using mock data:', error.message);
      // ✅ 记录 mock 数据使用
      recordMockUsage('/api/admin/trading/symbols');
      const mockData = generateMockSymbols(page, limit, search);
      return NextResponse.json({
        success: true,
        symbols: mockData,
        total: 5,
        page,
        limit,
        isMock: true, // ✅ 添加 mock 数据标识
      });
    }

    // ✅ 格式化数据，将 trading_pairs 转换为 symbols 格式
    const formattedSymbols = data?.map((pair: any) => {
      const symbol = pair.symbol.toUpperCase();
      let type = 'forex';
      let alias = pair.symbol;

      // 根据交易对确定类型和别名
      if (symbol.includes('BTC') || symbol.includes('ETH') || symbol.includes('LTC') ||
          symbol.includes('SOL') || symbol.includes('XRP') || symbol.includes('DOGE')) {
        type = 'crypto';
        if (symbol.includes('BTC')) alias = 'Bitcoin';
        else if (symbol.includes('ETH')) alias = 'Ethereum';
        else if (symbol.includes('LTC')) alias = 'Litecoin';
        else if (symbol.includes('SOL')) alias = 'Solana';
        else if (symbol.includes('XRP')) alias = 'Ripple';
        else if (symbol.includes('DOGE')) alias = 'Dogecoin';
      } else if (symbol.includes('XAU')) {
        type = 'metal';
        alias = 'Gold';
      } else if (symbol.includes('XAG')) {
        type = 'metal';
        alias = 'Silver';
      } else if (symbol.includes('USOIL') || symbol.includes('UKOIL')) {
        type = 'energy';
        alias = symbol.includes('USOIL') ? 'US Crude Oil' : 'UK Crude Oil';
      } else if (symbol.includes('NGAS')) {
        type = 'energy';
        alias = 'Natural Gas';
      } else if (symbol.includes('US500') || symbol.includes('ND25') || symbol.includes('AUS200')) {
        type = 'indices';
        if (symbol.includes('US500')) alias = 'S&P 500';
        else if (symbol.includes('ND25')) alias = 'NASDAQ 100';
        else if (symbol.includes('AUS200')) alias = 'ASX 200';
      } else {
        // 外汇交易对
        alias = getForexAlias(symbol);
      }

      return {
        id: pair.id,
        name: pair.symbol,
        alias: alias,
        icon: `/icons/${pair.symbol.toLowerCase()}.png`,
        type: type,
        sort: pair.id - 30, // 调整排序，从0开始
        isVisible: pair.is_visible !== false,
        flashContractFee: pair.contract_fee || 1.0,
        contractSize: 100,
      };
    }) || [];

    return NextResponse.json({
      success: true,
      symbols: formattedSymbols,
      total: count,
      page,
      limit,
      isMock: false, // ✅ 添加真实数据标识
    });
  } catch (error) {
    console.error('Failed to fetch symbols:', error);
    // ✅ 返回 mock 数据作为兜底
    const searchParams = request.nextUrl.searchParams;
    // ✅ 记录 mock 数据使用
    recordMockUsage('/api/admin/trading/symbols');
    const mockData = generateMockSymbols(
      parseInt(searchParams.get('page') || '1'),
      parseInt(searchParams.get('limit') || '15'),
      searchParams.get('search') || ''
    );
    return NextResponse.json({
      success: true,
      symbols: mockData,
      total: 5,
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '15'),
      isMock: true, // ✅ 添加 mock 数据标识
    });
  }
}

// POST - 创建品种
export async function POST(request: NextRequest) {
  try {
    const adminToken = request.cookies.get('admin_token')?.value ||
                      request.headers.get('authorization')?.replace('Bearer ', '');

    // 验证管理员权限
    const admin = verifyAdminToken(adminToken || '');
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      symbol,
      currency_id,
      is_visible = true,
      min_order_size = 0.001,
      max_order_size = 999999,
      contract_fee = 0.1,
    } = body;

    // 验证必填字段
    if (!symbol || !currency_id) {
      return NextResponse.json(
        { error: 'Symbol and currency_id are required' },
        { status: 400 }
      );
    }

    // 检查交易对是否已存在
    const { data: existing } = await supabase
      .from('trading_pairs')
      .select('id')
      .eq('symbol', symbol)
      .single();

    if (existing) {
      return NextResponse.json(
        { error: 'Symbol already exists' },
        { status: 409 }
      );
    }

    // 创建交易对
    const { data, error } = await supabase
      .from('trading_pairs')
      .insert({
        symbol,
        currency_id,
        is_visible,
        min_order_size,
        max_order_size,
        contract_fee,
      })
      .select()
      .single();

    if (error) {
      console.error('[Create Symbol] Error:', error);
      return NextResponse.json(
        { error: 'Failed to create symbol' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: '品种创建成功',
      symbol: data,
    });
  } catch (error) {
    console.error('[Create Symbol] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
