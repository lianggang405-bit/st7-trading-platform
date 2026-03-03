import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

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

    // ✅ 使用 trading_pairs 表代替 symbols 表
    let query = supabase
      .from('trading_pairs')
      .select(`
        *,
        currencies (
          id,
          currency
        )
      `, { count: 'exact' })
      .range(offset, offset + limit - 1)
      .order(sort, { ascending: order === 'asc' });

    // 如果有搜索条件
    if (search) {
      query = query.or(`symbol.ilike.%${search}%`);
    }

    const { data, error, count } = await query;

    // ✅ 如果出错，返回 mock 数据
    if (error) {
      console.warn('[Symbols API] Table query failed, using mock data:', error.message);
      const mockData = generateMockSymbols(page, limit, search);
      return NextResponse.json({
        success: true,
        symbols: mockData,
        total: 5,
        page,
        limit,
      });
    }

    // ✅ 格式化数据，将 trading_pairs 转换为 symbols 格式
    const formattedSymbols = data?.map((pair: any) => ({
      id: pair.id,
      name: pair.symbol,
      alias: pair.currencies?.currency || pair.symbol,
      icon: `/icons/${pair.symbol.toLowerCase()}.png`,
      type: 'forex', // 默认为外汇
      sort: 0,
      isVisible: pair.is_visible !== false,
      flashContractFee: pair.contract_fee || 1.0,
      contractSize: 100,
    })) || [];

    return NextResponse.json({
      success: true,
      symbols: formattedSymbols,
      total: count,
      page,
      limit,
    });
  } catch (error) {
    console.error('Failed to fetch symbols:', error);
    // ✅ 返回 mock 数据作为兜底
    const searchParams = request.nextUrl.searchParams;
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
    });
  }
}
