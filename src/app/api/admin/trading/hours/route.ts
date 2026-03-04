import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const useSupabase = supabaseUrl && supabaseServiceKey;

// 伦敦交易所交易时间（UTC+0）- 周一至周五 08:00-16:30，周末休市
// 考虑到是加密货币/外汇平台，默认设置为24小时交易
const defaultTradingHours = {
  monday_open: '00:00:00',
  monday_close: '23:59:59',
  tuesday_open: '00:00:00',
  tuesday_close: '23:59:59',
  wednesday_open: '00:00:00',
  wednesday_close: '23:59:59',
  thursday_open: '00:00:00',
  thursday_close: '23:59:59',
  friday_open: '00:00:00',
  friday_close: '23:59:59',
  saturday_open: '00:00:00',
  saturday_close: '23:59:59',
  sunday_open: '00:00:00',
  sunday_close: '23:59:59',
};

// Mock 数据存储
const allSymbols = [
  'EURUSD', 'GBPUSD', 'USDJPY', 'USDCHF', 'EURAUD', 'EURGBP', 'EURJPY',
  'GBPAUD', 'GBPNZD', 'GBPJPY', 'AUDUSD', 'AUDJPY', 'NZDUSD', 'NZDJPY',
  'CADJPY', 'CHFJPY', 'XAUUSD', 'XAGUSD', 'BTCUSD', 'ETHUSD', 'LTCUSD',
  'SOLUSD', 'XRPUSD', 'DOGEUSD', 'NGAS', 'UKOIL', 'USOIL', 'US500',
  'ND25', 'AUS200', 'TEST/USDT'
];

let mockTradingHours = allSymbols.map((symbol, index) => ({
  id: index + 1,
  symbol,
  ...defaultTradingHours,
}));
let nextMockId = allSymbols.length + 1;

// GET - 获取开盘时间列表
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const sort = searchParams.get('sort') || 'id';
    const order = searchParams.get('order') || 'desc';
    const search = searchParams.get('search') || '';

    // 使用和前端一样的 Supabase 客户端
    const supabase = getSupabaseClient();
    const offset = (page - 1) * limit;

    let query = supabase
      .from('trading_hours')
      .select('*', { count: 'exact' })
      .range(offset, offset + limit - 1)
      .order(sort, { ascending: order === 'asc' });

    // 如果有搜索条件
    if (search) {
      query = query.or(`symbol.ilike.%${search}%`);
    }

    const { data, error, count } = await query;

    if (error) {
      console.warn('[TradingHours API] Query failed, using mock data:', error.message);
      let filtered = mockTradingHours;
      if (search) {
        filtered = mockTradingHours.filter(h => h.symbol.toLowerCase().includes(search.toLowerCase()));
      }
      const mockData = filtered.slice(offset, offset + limit);
      
      const formattedHours = mockData.map((hour: any) => ({
        id: hour.id,
        symbol: hour.symbol,
        mondayOpen: hour.monday_open || '00:00:00',
        mondayClose: hour.monday_close || '23:59:59',
        tuesdayOpen: hour.tuesday_open || '00:00:00',
        tuesdayClose: hour.tuesday_close || '23:59:59',
        wednesdayOpen: hour.wednesday_open || '00:00:00',
        wednesdayClose: hour.wednesday_close || '23:59:59',
        thursdayOpen: hour.thursday_open || '00:00:00',
        thursdayClose: hour.thursday_close || '23:59:59',
        fridayOpen: hour.friday_open || '00:00:00',
        fridayClose: hour.friday_close || '23:59:59',
        saturdayOpen: hour.saturday_open || '00:00:00',
        saturdayClose: hour.saturday_close || '23:59:59',
        sundayOpen: hour.sunday_open || '00:00:00',
        sundayClose: hour.sunday_close || '23:59:59',
      }));
      
      return NextResponse.json({
        success: true,
        hours: formattedHours,
        total: mockTradingHours.length,
        page,
        limit,
      });
    }

    // 格式化数据
    const formattedHours = data?.map((hour: any) => ({
      id: hour.id,
      symbol: hour.symbol,
      mondayOpen: hour.monday_open || '00:00:00',
      mondayClose: hour.monday_close || '23:59:59',
      tuesdayOpen: hour.tuesday_open || '00:00:00',
      tuesdayClose: hour.tuesday_close || '23:59:59',
      wednesdayOpen: hour.wednesday_open || '00:00:00',
      wednesdayClose: hour.wednesday_close || '23:59:59',
      thursdayOpen: hour.thursday_open || '00:00:00',
      thursdayClose: hour.thursday_close || '23:59:59',
      fridayOpen: hour.friday_open || '00:00:00',
      fridayClose: hour.friday_close || '23:59:59',
      saturdayOpen: hour.saturday_open || '00:00:00',
      saturdayClose: hour.saturday_close || '23:59:59',
      sundayOpen: hour.sunday_open || '00:00:00',
      sundayClose: hour.sunday_close || '23:59:59',
    })) || [];

    return NextResponse.json({
      success: true,
      hours: formattedHours,
      total: count,
      page,
      limit,
    });
  } catch (error) {
    console.error('Failed to fetch trading hours:', error);
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    
    let filtered = mockTradingHours;
    if (search) {
      filtered = mockTradingHours.filter(h => h.symbol.toLowerCase().includes(search.toLowerCase()));
    }
    const offset = (page - 1) * limit;
    const mockData = filtered.slice(offset, offset + limit);
    
    const formattedHours = mockData.map((hour: any) => ({
      id: hour.id,
      symbol: hour.symbol,
      mondayOpen: hour.monday_open || '00:00:00',
      mondayClose: hour.monday_close || '23:59:59',
      tuesdayOpen: hour.tuesday_open || '00:00:00',
      tuesdayClose: hour.tuesday_close || '23:59:59',
      wednesdayOpen: hour.wednesday_open || '00:00:00',
      wednesdayClose: hour.wednesday_close || '23:59:59',
      thursdayOpen: hour.thursday_open || '00:00:00',
      thursdayClose: hour.thursday_close || '23:59:59',
      fridayOpen: hour.friday_open || '00:00:00',
      fridayClose: hour.friday_close || '23:59:59',
      saturdayOpen: hour.saturday_open || '00:00:00',
      saturdayClose: hour.saturday_close || '23:59:59',
      sundayOpen: hour.sunday_open || '00:00:00',
      sundayClose: hour.sunday_close || '23:59:59',
    }));
    
    return NextResponse.json({
      success: true,
      hours: formattedHours,
      total: mockTradingHours.length,
      page,
      limit,
    });
  }
}

// POST - 创建开盘时间配置
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      symbol,
      mondayOpen,
      mondayClose,
      tuesdayOpen,
      tuesdayClose,
      wednesdayOpen,
      wednesdayClose,
      thursdayOpen,
      thursdayClose,
      fridayOpen,
      fridayClose,
      saturdayOpen,
      saturdayClose,
      sundayOpen,
      sundayClose,
    } = body;

    if (!symbol) {
      return NextResponse.json(
        { success: false, error: '品种名称不能为空' },
        { status: 400 }
      );
    }

    // 使用和前端一样的 Supabase 客户端
    const supabase = getSupabaseClient();

    // 尝试插入数据库
    const { data, error } = await supabase
      .from('trading_hours')
      .insert([
        {
          symbol,
          monday_open: mondayOpen || '00:00:00',
          monday_close: mondayClose || '23:59:59',
          tuesday_open: tuesdayOpen || '00:00:00',
          tuesday_close: tuesdayClose || '23:59:59',
          wednesday_open: wednesdayOpen || '00:00:00',
          wednesday_close: wednesdayClose || '23:59:59',
          thursday_open: thursdayOpen || '00:00:00',
          thursday_close: thursdayClose || '23:59:59',
          friday_open: fridayOpen || '00:00:00',
          friday_close: fridayClose || '23:59:59',
          saturday_open: saturdayOpen || '00:00:00',
          saturday_close: saturdayClose || '23:59:59',
          sunday_open: sundayOpen || '00:00:00',
          sunday_close: sundayClose || '23:59:59',
        },
      ])
      .select()
      .single();

    if (error) {
      console.warn('[TradingHours API] Insert failed, using mock:', error.message);
      const newHour = {
        id: nextMockId++,
        symbol,
        monday_open: mondayOpen || '00:00:00',
        monday_close: mondayClose || '23:59:59',
        tuesday_open: tuesdayOpen || '00:00:00',
        tuesday_close: tuesdayClose || '23:59:59',
        wednesday_open: wednesdayOpen || '00:00:00',
        wednesday_close: wednesdayClose || '23:59:59',
        thursday_open: thursdayOpen || '00:00:00',
        thursday_close: thursdayClose || '23:59:59',
        friday_open: fridayOpen || '00:00:00',
        friday_close: fridayClose || '23:59:59',
        saturday_open: saturdayOpen || '00:00:00',
        saturday_close: saturdayClose || '23:59:59',
        sunday_open: sundayOpen || '00:00:00',
        sunday_close: sundayClose || '23:59:59',
      };
      mockTradingHours.push(newHour);
      return NextResponse.json({
        success: true,
        hour: newHour,
      });
    }

    return NextResponse.json({
      success: true,
      hour: data,
    });
  } catch (error) {
    console.error('Failed to create trading hours:', error);
    return NextResponse.json(
      {
        success: false,
        error: '创建开盘时间配置失败',
      },
      { status: 500 }
    );
  }
}
