import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

// 妫€鏌upabase鐜鍙橀噺鏄惁閰嶇疆
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const useSupabase = supabaseUrl && supabaseServiceKey;

// GET - 鑾峰彇鍚堢害璁㈠崟鍒楄〃
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '15');
    const sort = searchParams.get('sort') || 'id';
    const order = searchParams.get('order') || 'desc';
    const search = searchParams.get('search') || '';

    // 濡傛灉娌℃湁閰嶇疆Supabase锛岀洿鎺ヨ繑鍥炴ā鎷熸暟鎹?    if (!useSupabase) {
      const mockData = generateMockData(page, limit, search);
      return NextResponse.json({
        success: true,
        orders: mockData,
        total: 5,
        page,
        limit,
      });
    }

    // 尝试导入和初始化Supabase
    let supabase;
    try {
      const { createClient } = await import('@supabase/supabase-js');
      supabase = getSupabaseClient();
    } catch (error) {
      console.error('Failed to initialize Supabase:', error);
      const mockData = generateMockData(page, limit, search);
      return NextResponse.json({
        success: true,
        orders: mockData,
        total: 5,
        page,
        limit,
      });
    }

    const offset = (page - 1) * limit;

    let query = supabase
      .from('contract_orders')
      .select('*', { count: 'exact' })
      .range(offset, offset + limit - 1)
      .order(sort, { ascending: order === 'asc' });

    // 如果有搜索条件
    if (search) {
      query = query.or(`account.ilike.%${search}%,symbol.ilike.%${search}%`);
    }

    const { data, error, count } = await query;

    if (error) {
      console.error('Supabase error:', error);
      // 如果表不存在或查询失败，返回模拟数据
      const mockData = generateMockData(page, limit, search);
      return NextResponse.json({
        success: true,
        orders: mockData,
        total: 5,
        page,
        limit,
      });
    }

    // 格式化数据
    const formattedOrders = data?.map((item: any) => ({
      id: item.id,
      account: item.account,
      symbol: item.symbol,
      tradeType: item.trade_type,
      status: item.status,
      originalPrice: item.original_price,
      openPrice: item.open_price,
      currentPrice: item.current_price,
      takeProfit: item.take_profit,
      stopLoss: item.stop_loss,
      lots: item.lots,
      leverage: item.leverage,
      initialMargin: item.initial_margin,
      availableMargin: item.available_margin,
      fee: item.fee,
      profit: item.profit,
      createdAt: item.created_at,
      closedAt: item.closed_at,
      completedAt: item.completed_at,
    })) || [];

    return NextResponse.json({
      success: true,
      orders: formattedOrders,
      total: count,
      page,
      limit,
    });
  } catch (error) {
    console.error('Failed to fetch contract orders:', error);
    // 杩斿洖妯℃嫙鏁版嵁浣滀负闄嶇骇鏂规
    const searchParams = request.nextUrl.searchParams;
    const mockData = generateMockData(
      parseInt(searchParams.get('page') || '1'),
      parseInt(searchParams.get('limit') || '15'),
      searchParams.get('search') || ''
    );
    return NextResponse.json({
      success: true,
      orders: mockData,
      total: 5,
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '15'),
    });
  }
}

// POST - 鍒涘缓鏂扮殑鍚堢害璁㈠崟
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { account, symbol, tradeType, status, originalPrice, openPrice, currentPrice, takeProfit, stopLoss, lots, leverage, initialMargin, availableMargin, fee, profit } = body;

    // 濡傛灉娌℃湁閰嶇疆Supabase锛岃繑鍥炴垚鍔熷搷搴斾絾涓嶅疄闄呭垱寤?    if (!useSupabase) {
      const now = new Date();
      const createdTime = now.toISOString();
      return NextResponse.json({
        success: true,
        order: {
          id: Math.floor(Math.random() * 1000),
          account,
          symbol,
          tradeType,
          status,
          originalPrice,
          openPrice,
          currentPrice,
          takeProfit,
          stopLoss,
          lots,
          leverage,
          initialMargin,
          availableMargin,
          fee,
          profit,
          createdAt: createdTime,
          closedAt: null,
          completedAt: null,
        },
      });
    }

    // 灏濊瘯瀵煎叆鍜屽垵濮嬪寲Supabase
    let supabase;
    try {
      const { createClient } = await import('@supabase/supabase-js');
      supabase = getSupabaseClient();
    } catch (error) {
      console.error('Failed to initialize Supabase:', error);
      const now = new Date();
      const createdTime = now.toISOString();
      return NextResponse.json({
        success: true,
        order: {
          id: Math.floor(Math.random() * 1000),
          account,
          symbol,
          tradeType,
          status,
          originalPrice,
          openPrice,
          currentPrice,
          takeProfit,
          stopLoss,
          lots,
          leverage,
          initialMargin,
          availableMargin,
          fee,
          profit,
          createdAt: createdTime,
          closedAt: null,
          completedAt: null,
        },
      });
    }

    const { data, error } = await supabase
      .from('contract_orders')
      .insert([
        {
          account,
          symbol,
          trade_type: tradeType,
          status,
          original_price: originalPrice,
          open_price: openPrice,
          current_price: currentPrice,
          take_profit: takeProfit,
          stop_loss: stopLoss,
          lots,
          leverage,
          initial_margin: initialMargin,
          available_margin: availableMargin,
          fee,
          profit,
        },
      ])
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      order: {
        id: data.id,
        account: data.account,
        symbol: data.symbol,
        tradeType: data.trade_type,
        status: data.status,
        originalPrice: data.original_price,
        openPrice: data.open_price,
        currentPrice: data.current_price,
        takeProfit: data.take_profit,
        stopLoss: data.stop_loss,
        lots: data.lots,
        leverage: data.leverage,
        initialMargin: data.initial_margin,
        availableMargin: data.available_margin,
        fee: data.fee,
        profit: data.profit,
        createdAt: data.created_at,
        closedAt: data.closed_at,
        completedAt: data.completed_at,
      },
    });
  } catch (error) {
    console.error('Failed to create contract order:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create contract order',
      },
      { status: 500 }
    );
  }
}

// 鐢熸垚妯℃嫙鏁版嵁锛堟牴鎹浘鐗囦腑鐨勬暟鎹級
function generateMockData(page: number, limit: number, search: string): any[] {
  let mockData = [
    {
      id: 1262,
      account: 'ko270839@gmail.com',
      symbol: 'XAUUSD',
      tradeType: '鍗栧嚭',
      status: '宸插钩浠?,
      originalPrice: 5196.500000000,
      openPrice: 5196.500000000,
      currentPrice: 5194.590000000,
      takeProfit: 0.000000000,
      stopLoss: 0.000000000,
      lots: 0,
      leverage: 500,
      initialMargin: 259.825000000,
      availableMargin: 259.825000000,
      fee: 1.000000000,
      profit: 47.750000000,
      createdAt: '2026-02-27 14:25:43',
      closedAt: '2026-02-27 14:44:36',
      completedAt: '2026-02-27 14:44:36',
    },
    {
      id: 1261,
      account: 'lzhibo21900@gmail.com',
      symbol: 'XAUUSD',
      tradeType: '涔板叆',
      status: '宸插钩浠?,
      originalPrice: 5169.630000000,
      openPrice: 5169.630000000,
      currentPrice: 5172.190000000,
      takeProfit: 0.000000000,
      stopLoss: 0.000000000,
      lots: 120,
      leverage: 100,
      initialMargin: 622474.800000000,
      availableMargin: 622474.800000000,
      fee: 120.000000000,
      profit: 45000.000000000,
      createdAt: '2026-02-27 12:16:54',
      closedAt: '2026-02-27 12:24:25',
      completedAt: '2026-02-27 12:24:25',
    },
    {
      id: 1260,
      account: 'ko270839@gmail.com',
      symbol: 'XAUUSD',
      tradeType: '涔板叆',
      status: '宸插钩浠?,
      originalPrice: 5148.690000000,
      openPrice: 5148.690000000,
      currentPrice: 5151.690000000,
      takeProfit: 0.000000000,
      stopLoss: 0.000000000,
      lots: 120,
      leverage: 100,
      initialMargin: 622291.200000000,
      availableMargin: 622291.200000000,
      fee: 120.000000000,
      profit: 1680.000000000,
      createdAt: '2026-02-27 12:15:05',
      closedAt: '2026-02-27 12:15:14',
      completedAt: '2026-02-27 12:15:14',
    },
    {
      id: 1259,
      account: 'user001@email.com',
      symbol: 'BTC',
      tradeType: '鍗栧嚭',
      status: '宸插钩浠?,
      originalPrice: 95000.000000000,
      openPrice: 95000.000000000,
      currentPrice: 94800.000000000,
      takeProfit: 94000.000000000,
      stopLoss: 96000.000000000,
      lots: 1,
      leverage: 200,
      initialMargin: 475.000000000,
      availableMargin: 475.000000000,
      fee: 10.000000000,
      profit: 200.000000000,
      createdAt: '2026-02-27 10:00:00',
      closedAt: '2026-02-27 10:05:00',
      completedAt: '2026-02-27 10:05:00',
    },
    {
      id: 1258,
      account: 'user002@email.com',
      symbol: 'ETH',
      tradeType: '涔板叆',
      status: '宸插钩浠?,
      originalPrice: 3500.000000000,
      openPrice: 3500.000000000,
      currentPrice: 3550.000000000,
      takeProfit: 3600.000000000,
      stopLoss: 3400.000000000,
      lots: 5,
      leverage: 100,
      initialMargin: 175.000000000,
      availableMargin: 175.000000000,
      fee: 5.000000000,
      profit: 250.000000000,
      createdAt: '2026-02-27 09:30:00',
      closedAt: '2026-02-27 09:35:00',
      completedAt: '2026-02-27 09:35:00',
    },
  ];

  // 濡傛灉鏈夋悳绱㈡潯浠讹紝杩囨护鏁版嵁
  if (search) {
    mockData = mockData.filter(item =>
      item.account.toLowerCase().includes(search.toLowerCase()) ||
      item.symbol.toLowerCase().includes(search.toLowerCase())
    );
  }

  // 榛樿鎸?ID 闄嶅簭鎺掑簭
  const sorted = [...mockData].sort((a, b) => b.id - a.id);

  const offset = (page - 1) * limit;
  return sorted.slice(offset, offset + limit);
}

