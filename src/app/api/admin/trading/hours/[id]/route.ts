import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const useSupabase = supabaseUrl && supabaseServiceKey;

// 伦敦交易所交易时间（UTC+0）- 周一至周五 08:00-16:30，周末休市
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

// GET - 获取单个开盘时间配置
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: hourId } = await params;
    const id = parseInt(hourId);

    // 使用和前端一样的 Supabase 客户端
    const supabase = getSupabaseClient();

    // 查询数据库
    const { data, error } = await supabase
      .from('trading_hours')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.warn('[TradingHours API] Get failed, trying mock:', error.message);
      const mockHour = mockTradingHours.find(h => h.id === id);
      if (!mockHour) {
        return NextResponse.json(
          { success: false, error: '开盘时间配置不存在' },
          { status: 404 }
        );
      }
      return NextResponse.json({
        success: true,
        hour: {
          id: mockHour.id,
          symbol: mockHour.symbol,
          mondayOpen: mockHour.monday_open || '00:00:00',
          mondayClose: mockHour.monday_close || '23:59:59',
          tuesdayOpen: mockHour.tuesday_open || '00:00:00',
          tuesdayClose: mockHour.tuesday_close || '23:59:59',
          wednesdayOpen: mockHour.wednesday_open || '00:00:00',
          wednesdayClose: mockHour.wednesday_close || '23:59:59',
          thursdayOpen: mockHour.thursday_open || '00:00:00',
          thursdayClose: mockHour.thursday_close || '23:59:59',
          fridayOpen: mockHour.friday_open || '00:00:00',
          fridayClose: mockHour.friday_close || '23:59:59',
          saturdayOpen: mockHour.saturday_open || '00:00:00',
          saturdayClose: mockHour.saturday_close || '23:59:59',
          sundayOpen: mockHour.sunday_open || '00:00:00',
          sundayClose: mockHour.sunday_close || '23:59:59',
        },
      });
    }

    return NextResponse.json({
      success: true,
      hour: {
        id: data.id,
        symbol: data.symbol,
        mondayOpen: data.monday_open || '00:00:00',
        mondayClose: data.monday_close || '23:59:59',
        tuesdayOpen: data.tuesday_open || '00:00:00',
        tuesdayClose: data.tuesday_close || '23:59:59',
        wednesdayOpen: data.wednesday_open || '00:00:00',
        wednesdayClose: data.wednesday_close || '23:59:59',
        thursdayOpen: data.thursday_open || '00:00:00',
        thursdayClose: data.thursday_close || '23:59:59',
        fridayOpen: data.friday_open || '00:00:00',
        fridayClose: data.friday_close || '23:59:59',
        saturdayOpen: data.saturday_open || '00:00:00',
        saturdayClose: data.saturday_close || '23:59:59',
        sundayOpen: data.sunday_open || '00:00:00',
        sundayClose: data.sunday_close || '23:59:59',
      },
    });
  } catch (error) {
    console.error('Failed to fetch trading hour:', error);
    return NextResponse.json(
      {
        success: false,
        error: '获取开盘时间配置失败',
      },
      { status: 500 }
    );
  }
}

// PUT - 更新开盘时间配置
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: hourId } = await params;
    const id = parseInt(hourId);
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

    // 使用和前端一样的 Supabase 客户端
    const supabase = getSupabaseClient();

    // 更新数据库
    const { data, error } = await supabase
      .from('trading_hours')
      .update({
        symbol,
        monday_open: mondayOpen,
        monday_close: mondayClose,
        tuesday_open: tuesdayOpen,
        tuesday_close: tuesdayClose,
        wednesday_open: wednesdayOpen,
        wednesday_close: wednesdayClose,
        thursday_open: thursdayOpen,
        thursday_close: thursdayClose,
        friday_open: fridayOpen,
        friday_close: fridayClose,
        saturday_open: saturdayOpen,
        saturday_close: saturdayClose,
        sunday_open: sundayOpen,
        sunday_close: sundayClose,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.warn('[TradingHours API] Update failed, using mock:', error.message);
      const mockIndex = mockTradingHours.findIndex(h => h.id === id);
      if (mockIndex === -1) {
        return NextResponse.json(
          { success: false, error: '开盘时间配置不存在' },
          { status: 404 }
        );
      }
      mockTradingHours[mockIndex] = {
        ...mockTradingHours[mockIndex],
        symbol: symbol || mockTradingHours[mockIndex].symbol,
        monday_open: mondayOpen || mockTradingHours[mockIndex].monday_open,
        monday_close: mondayClose || mockTradingHours[mockIndex].monday_close,
        tuesday_open: tuesdayOpen || mockTradingHours[mockIndex].tuesday_open,
        tuesday_close: tuesdayClose || mockTradingHours[mockIndex].tuesday_close,
        wednesday_open: wednesdayOpen || mockTradingHours[mockIndex].wednesday_open,
        wednesday_close: wednesdayClose || mockTradingHours[mockIndex].wednesday_close,
        thursday_open: thursdayOpen || mockTradingHours[mockIndex].thursday_open,
        thursday_close: thursdayClose || mockTradingHours[mockIndex].thursday_close,
        friday_open: fridayOpen || mockTradingHours[mockIndex].friday_open,
        friday_close: fridayClose || mockTradingHours[mockIndex].friday_close,
        saturday_open: saturdayOpen || mockTradingHours[mockIndex].saturday_open,
        saturday_close: saturdayClose || mockTradingHours[mockIndex].saturday_close,
        sunday_open: sundayOpen || mockTradingHours[mockIndex].sunday_open,
        sunday_close: sundayClose || mockTradingHours[mockIndex].sunday_close,
      };
      return NextResponse.json({
        success: true,
        hour: mockTradingHours[mockIndex],
      });
    }

    return NextResponse.json({
      success: true,
      hour: data,
    });
  } catch (error) {
    console.error('Failed to update trading hours:', error);
    return NextResponse.json(
      {
        success: false,
        error: '更新开盘时间配置失败',
      },
      { status: 500 }
    );
  }
}

// DELETE - 删除开盘时间配置
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: hourId } = await params;
    const id = parseInt(hourId);

    // 使用和前端一样的 Supabase 客户端
    const supabase = getSupabaseClient();

    // 删除数据库记录
    const { error } = await supabase
      .from('trading_hours')
      .delete()
      .eq('id', id);

    if (error) {
      console.warn('[TradingHours API] Delete failed, using mock:', error.message);
      const mockIndex = mockTradingHours.findIndex(h => h.id === id);
      if (mockIndex === -1) {
        return NextResponse.json(
          { success: false, error: '开盘时间配置不存在' },
          { status: 404 }
        );
      }
      mockTradingHours.splice(mockIndex, 1);
      return NextResponse.json({
        success: true,
        message: '开盘时间配置删除成功',
      });
    }

    return NextResponse.json({
      success: true,
      message: '开盘时间配置删除成功',
    });
  } catch (error) {
    console.error('Failed to delete trading hours:', error);
    return NextResponse.json(
      {
        success: false,
        error: '删除开盘时间配置失败',
      },
      { status: 500 }
    );
  }
}
