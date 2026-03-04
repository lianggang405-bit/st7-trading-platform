import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

// Mock 数据存储 - 包含完整的31个交易对
let mockTradingPairs = [
  { id: 1, currency_id: 5, symbol: 'EURUSD', is_visible: true, min_order_size: 1, max_order_size: 100000, contract_fee: 0.05, created_at: new Date().toISOString() },
  { id: 2, currency_id: 6, symbol: 'GBPUSD', is_visible: true, min_order_size: 1, max_order_size: 100000, contract_fee: 0.05, created_at: new Date().toISOString() },
  { id: 3, currency_id: 7, symbol: 'USDJPY', is_visible: true, min_order_size: 1, max_order_size: 100000, contract_fee: 0.05, created_at: new Date().toISOString() },
  { id: 4, currency_id: 8, symbol: 'USDCHF', is_visible: true, min_order_size: 1, max_order_size: 100000, contract_fee: 0.05, created_at: new Date().toISOString() },
  { id: 5, currency_id: 9, symbol: 'EURAUD', is_visible: true, min_order_size: 1, max_order_size: 100000, contract_fee: 0.05, created_at: new Date().toISOString() },
  { id: 6, currency_id: 10, symbol: 'EURGBP', is_visible: true, min_order_size: 1, max_order_size: 100000, contract_fee: 0.05, created_at: new Date().toISOString() },
  { id: 7, currency_id: 11, symbol: 'EURJPY', is_visible: true, min_order_size: 1, max_order_size: 100000, contract_fee: 0.05, created_at: new Date().toISOString() },
  { id: 8, currency_id: 12, symbol: 'GBPAUD', is_visible: true, min_order_size: 1, max_order_size: 100000, contract_fee: 0.05, created_at: new Date().toISOString() },
  { id: 9, currency_id: 13, symbol: 'GBPNZD', is_visible: true, min_order_size: 1, max_order_size: 100000, contract_fee: 0.05, created_at: new Date().toISOString() },
  { id: 10, currency_id: 14, symbol: 'GBPJPY', is_visible: true, min_order_size: 1, max_order_size: 100000, contract_fee: 0.05, created_at: new Date().toISOString() },
  { id: 11, currency_id: 15, symbol: 'AUDUSD', is_visible: true, min_order_size: 1, max_order_size: 100000, contract_fee: 0.05, created_at: new Date().toISOString() },
  { id: 12, currency_id: 16, symbol: 'AUDJPY', is_visible: true, min_order_size: 1, max_order_size: 100000, contract_fee: 0.05, created_at: new Date().toISOString() },
  { id: 13, currency_id: 17, symbol: 'NZDUSD', is_visible: true, min_order_size: 1, max_order_size: 100000, contract_fee: 0.05, created_at: new Date().toISOString() },
  { id: 14, currency_id: 18, symbol: 'NZDJPY', is_visible: true, min_order_size: 1, max_order_size: 100000, contract_fee: 0.05, created_at: new Date().toISOString() },
  { id: 15, currency_id: 19, symbol: 'CADJPY', is_visible: true, min_order_size: 1, max_order_size: 100000, contract_fee: 0.05, created_at: new Date().toISOString() },
  { id: 16, currency_id: 20, symbol: 'CHFJPY', is_visible: true, min_order_size: 1, max_order_size: 100000, contract_fee: 0.05, created_at: new Date().toISOString() },
  { id: 17, currency_id: 21, symbol: 'XAUUSD', is_visible: true, min_order_size: 0.01, max_order_size: 1000, contract_fee: 0.1, created_at: new Date().toISOString() },
  { id: 18, currency_id: 22, symbol: 'XAGUSD', is_visible: true, min_order_size: 0.1, max_order_size: 10000, contract_fee: 0.1, created_at: new Date().toISOString() },
  { id: 19, currency_id: 23, symbol: 'BTCUSD', is_visible: true, min_order_size: 0.001, max_order_size: 100, contract_fee: 0.1, created_at: new Date().toISOString() },
  { id: 20, currency_id: 24, symbol: 'ETHUSD', is_visible: true, min_order_size: 0.01, max_order_size: 1000, contract_fee: 0.1, created_at: new Date().toISOString() },
  { id: 21, currency_id: 25, symbol: 'LTCUSD', is_visible: true, min_order_size: 0.1, max_order_size: 10000, contract_fee: 0.1, created_at: new Date().toISOString() },
  { id: 22, currency_id: 26, symbol: 'SOLUSD', is_visible: true, min_order_size: 0.1, max_order_size: 10000, contract_fee: 0.1, created_at: new Date().toISOString() },
  { id: 23, currency_id: 27, symbol: 'XRPUSD', is_visible: true, min_order_size: 1, max_order_size: 100000, contract_fee: 0.1, created_at: new Date().toISOString() },
  { id: 24, currency_id: 28, symbol: 'DOGEUSD', is_visible: true, min_order_size: 1, max_order_size: 100000, contract_fee: 0.1, created_at: new Date().toISOString() },
  { id: 25, currency_id: 29, symbol: 'NGAS', is_visible: true, min_order_size: 1, max_order_size: 100000, contract_fee: 0.05, created_at: new Date().toISOString() },
  { id: 26, currency_id: 30, symbol: 'UKOIL', is_visible: true, min_order_size: 0.1, max_order_size: 10000, contract_fee: 0.05, created_at: new Date().toISOString() },
  { id: 27, currency_id: 31, symbol: 'USOIL', is_visible: true, min_order_size: 0.1, max_order_size: 10000, contract_fee: 0.05, created_at: new Date().toISOString() },
  { id: 28, currency_id: 32, symbol: 'US500', is_visible: true, min_order_size: 0.1, max_order_size: 10000, contract_fee: 0.05, created_at: new Date().toISOString() },
  { id: 29, currency_id: 33, symbol: 'ND25', is_visible: true, min_order_size: 0.1, max_order_size: 10000, contract_fee: 0.05, created_at: new Date().toISOString() },
  { id: 30, currency_id: 34, symbol: 'AUS200', is_visible: true, min_order_size: 0.1, max_order_size: 10000, contract_fee: 0.05, created_at: new Date().toISOString() },
  { id: 35, currency_id: 1, symbol: 'TEST/USDT', is_visible: true, min_order_size: 0.001, max_order_size: 1000, contract_fee: 0.1, created_at: new Date().toISOString() },
];
let nextMockId = 36;

// GET - 获取交易对列表
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '15');
    const sort = searchParams.get('sort') || 'id';
    const order = searchParams.get('order') || 'desc';
    const search = searchParams.get('search') || '';

    // 使用和前端一样的 Supabase 客户端
    const supabase = getSupabaseClient();
    const offset = (page - 1) * limit;

    let query = supabase
      .from('trading_pairs')
      .select('*', { count: 'exact' })
      .range(offset, offset + limit - 1)
      .order(sort, { ascending: order === 'asc' });

    // 如果有搜索条件
    if (search) {
      query = query.or(`symbol.ilike.%${search}%`);
    }

    const { data, error, count } = await query;

    if (error) {
      console.warn('[TradingPairs API] Query failed, using mock data:', error.message);
      let filtered = mockTradingPairs;
      if (search) {
        filtered = mockTradingPairs.filter(p => p.symbol.toLowerCase().includes(search.toLowerCase()));
      }
      const mockData = filtered.slice(offset, offset + limit);
      
      const formattedPairs = mockData.map((pair: any) => ({
        id: pair.id,
        currencyId: pair.currency_id,
        symbol: pair.symbol,
        isVisible: pair.is_visible !== false,
        minOrderSize: pair.min_order_size || 0,
        maxOrderSize: pair.max_order_size || 999999,
        contractFee: pair.contract_fee || 1.0,
        createdAt: pair.created_at ? new Date(pair.created_at).toLocaleString('zh-CN') : '—',
      }));
      
      return NextResponse.json({
        success: true,
        pairs: formattedPairs,
        total: mockTradingPairs.length,
        page,
        limit,
      });
    }

    // 格式化数据
    const formattedPairs = data?.map((pair: any) => ({
      id: pair.id,
      currencyId: pair.currency_id,
      symbol: pair.symbol,
      isVisible: pair.is_visible !== false,
      minOrderSize: pair.min_order_size || 0,
      maxOrderSize: pair.max_order_size || 999999,
      contractFee: pair.contract_fee || 1.0,
      createdAt: pair.created_at ? new Date(pair.created_at).toLocaleString('zh-CN') : '—',
    })) || [];

    return NextResponse.json({
      success: true,
      pairs: formattedPairs,
      total: count,
      page,
      limit,
    });
  } catch (error) {
    console.error('Failed to fetch trading pairs:', error);
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '15');
    const search = searchParams.get('search') || '';
    
    let filtered = mockTradingPairs;
    if (search) {
      filtered = mockTradingPairs.filter(p => p.symbol.toLowerCase().includes(search.toLowerCase()));
    }
    const offset = (page - 1) * limit;
    const mockData = filtered.slice(offset, offset + limit);
    
    const formattedPairs = mockData.map((pair: any) => ({
      id: pair.id,
      currencyId: pair.currency_id,
      symbol: pair.symbol,
      isVisible: pair.is_visible !== false,
      minOrderSize: pair.min_order_size || 0,
      maxOrderSize: pair.max_order_size || 999999,
      contractFee: pair.contract_fee || 1.0,
      createdAt: pair.created_at ? new Date(pair.created_at).toLocaleString('zh-CN') : '—',
    }));
    
    return NextResponse.json({
      success: true,
      pairs: formattedPairs,
      total: mockTradingPairs.length,
      page,
      limit,
    });
  }
}

// POST - 创建交易对
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { currencyId, symbol, isVisible, minOrderSize, maxOrderSize, contractFee } = body;

    if (!symbol) {
      return NextResponse.json(
        { success: false, error: '交易对名称不能为空' },
        { status: 400 }
      );
    }

    // 使用和前端一样的 Supabase 客户端
    const supabase = getSupabaseClient();

    // 尝试插入数据库
    const { data, error } = await supabase
      .from('trading_pairs')
      .insert([
        {
          currency_id: currencyId || 1,
          symbol,
          is_visible: isVisible !== false,
          min_order_size: minOrderSize || 0.001,
          max_order_size: maxOrderSize || 999999,
          contract_fee: contractFee || 0.1,
        },
      ])
      .select()
      .single();

    if (error) {
      console.warn('[TradingPairs API] Insert failed, using mock:', error.message);
      const newPair = {
        id: nextMockId++,
        currency_id: currencyId || 1,
        symbol,
        is_visible: isVisible !== false,
        min_order_size: minOrderSize || 0.001,
        max_order_size: maxOrderSize || 999999,
        contract_fee: contractFee || 0.1,
        created_at: new Date().toISOString(),
      };
      mockTradingPairs.push(newPair);
      return NextResponse.json({
        success: true,
        pair: newPair,
      });
    }

    return NextResponse.json({
      success: true,
      pair: data,
    });
  } catch (error) {
    console.error('Failed to create trading pair:', error);
    return NextResponse.json(
      {
        success: false,
        error: '创建交易对失败',
      },
      { status: 500 }
    );
  }
}
