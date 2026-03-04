import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdminClient } from '@/storage/database/supabase-admin-client';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const useSupabase = supabaseUrl && supabaseServiceKey;

// Mock 数据存储
let mockTradingPairs = [
  { id: 1, currency_id: 1, symbol: 'BTC/USDT', is_visible: true, min_order_size: 0.001, max_order_size: 100, contract_fee: 0.1, created_at: new Date().toISOString() },
  { id: 2, currency_id: 1, symbol: 'ETH/USDT', is_visible: true, min_order_size: 0.01, max_order_size: 1000, contract_fee: 0.1, created_at: new Date().toISOString() },
  { id: 3, currency_id: 2, symbol: 'EUR/USD', is_visible: true, min_order_size: 1, max_order_size: 100000, contract_fee: 0.05, created_at: new Date().toISOString() },
];
let nextMockId = 4;

// GET - 获取交易对列表
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '15');
    const sort = searchParams.get('sort') || 'id';
    const order = searchParams.get('order') || 'desc';
    const search = searchParams.get('search') || '';

    // 如果 Supabase 未配置，返回 mock 数据
    if (!useSupabase) {
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

    // 尝试初始化 Supabase
    let supabase;
    try {
      supabase = getSupabaseAdminClient();
    } catch (error) {
      console.error('Failed to initialize Supabase:', error);
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

    if (!supabase) {
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
    
    let filtered = mockTradingPairs;
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

    // 如果 Supabase 未配置，使用 mock 数据
    if (!useSupabase) {
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

    // 尝试初始化 Supabase
    let supabase;
    try {
      supabase = getSupabaseAdminClient();
    } catch (error) {
      console.error('Failed to initialize Supabase:', error);
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

    if (!supabase) {
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
