import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

// Check if Supabase environment variables are configured
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const useSupabase = supabaseUrl && supabaseServiceKey;

// GET - Get leverage settings list
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '15');
    const sort = searchParams.get('sort') || 'id';
    const order = searchParams.get('order') || 'desc';
    const search = searchParams.get('search') || '';

    // If Supabase is not configured, return mock data
    if (!useSupabase) {
      const mockData = generateMockData(page, limit, search);
      return NextResponse.json({
        success: true,
        settings: mockData,
        total: 11,
        page,
        limit,
      });
    }

    // Try to import and initialize Supabase
    let supabase;
    try {
      supabase = getSupabaseClient();
    } catch (error) {
      console.error('Failed to initialize Supabase:', error);
      const mockData = generateMockData(page, limit, search);
      return NextResponse.json({
        success: true,
        settings: mockData,
        total: 11,
        page,
        limit,
      });
    }

    if (!supabase) {
        const mockData = generateMockData(page, limit, search);
        return NextResponse.json({
          success: true,
          settings: mockData,
          total: 11,
          page,
          limit,
        });
    }

    const offset = (page - 1) * limit;

    let query = supabase
      .from('leverage_settings')
      .select('*', { count: 'exact' })
      .range(offset, offset + limit - 1)
      .order(sort, { ascending: order === 'asc' });

    // If there is a search condition
    if (search) {
      query = query.or(`type.ilike.%${search}%,symbol.ilike.%${search}%`);
    }

    const { data, error, count } = await query;

    if (error) {
      console.error('Supabase error:', error);
      // If table does not exist or query fails, return mock data
      const mockData = generateMockData(page, limit, search);
      return NextResponse.json({
        success: true,
        settings: mockData,
        total: 11,
        page,
        limit,
      });
    }

    // Format data
    const formattedSettings = data?.map((item: any) => ({
      id: item.id,
      type: item.type,
      value: item.value,
      symbol: item.symbol,
    })) || [];

    return NextResponse.json({
      success: true,
      settings: formattedSettings,
      total: count,
      page,
      limit,
    });
  } catch (error) {
    console.error('Failed to fetch leverage settings:', error);
    // Return mock data as fallback
    const searchParams = request.nextUrl.searchParams;
    const mockData = generateMockData(
      parseInt(searchParams.get('page') || '1'),
      parseInt(searchParams.get('limit') || '15'),
      searchParams.get('search') || ''
    );
    return NextResponse.json({
      success: true,
      settings: mockData,
      total: 11,
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '15'),
    });
  }
}

// POST - Create new leverage setting
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, value, symbol } = body;

    // If Supabase is not configured, return success response but do not actually create
    if (!useSupabase) {
      return NextResponse.json({
        success: true,
        setting: {
          id: Math.floor(Math.random() * 1000),
          type,
          value,
          symbol,
        },
      });
    }

    // Try to import and initialize Supabase
    let supabase;
    try {
      supabase = getSupabaseClient();
    } catch (error) {
      console.error('Failed to initialize Supabase:', error);
      return NextResponse.json({
        success: true,
        setting: {
          id: Math.floor(Math.random() * 1000),
          type,
          value,
          symbol,
        },
      });
    }

    if (!supabase) {
        return NextResponse.json({
            success: true,
            setting: {
              id: Math.floor(Math.random() * 1000),
              type,
              value,
              symbol,
            },
          });
    }

    const { data, error } = await supabase
      .from('leverage_settings')
      .insert([
        {
          type,
          value,
          symbol,
        },
      ])
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      setting: {
        id: data.id,
        type: data.type,
        value: data.value,
        symbol: data.symbol,
      },
    });
  } catch (error) {
    console.error('Failed to create leverage setting:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create leverage setting',
      },
      { status: 500 }
    );
  }
}

// Generate mock data
function generateMockData(page: number, limit: number, search: string): any[] {
  let mockData = [
    // ETH leverage
    { id: 376, type: '倍数', value: 500, symbol: 'ETH' },
    { id: 375, type: '倍数', value: 200, symbol: 'ETH' },
    { id: 374, type: '倍数', value: 100, symbol: 'ETH' },
    // BTC leverage
    { id: 373, type: '倍数', value: 500, symbol: 'BTC' },
    { id: 371, type: '倍数', value: 200, symbol: 'BTC' },
    { id: 370, type: '倍数', value: 100, symbol: 'BTC' },
    // XAUUSD leverage
    { id: 369, type: '倍数', value: 500, symbol: 'XAUUSD' },
    { id: 368, type: '倍数', value: 400, symbol: 'XAUUSD' },
    { id: 367, type: '倍数', value: 300, symbol: 'XAUUSD' },
    { id: 366, type: '倍数', value: 200, symbol: 'XAUUSD' },
    { id: 365, type: '倍数', value: 100, symbol: 'XAUUSD' },
  ];

  // If there is a search condition, filter data
  if (search) {
    mockData = mockData.filter(item =>
      item.type.toLowerCase().includes(search.toLowerCase()) ||
      item.symbol.toLowerCase().includes(search.toLowerCase())
    );
  }

  // Default sort by ID descending
  const sorted = [...mockData].sort((a, b) => b.id - a.id);

  const offset = (page - 1) * limit;
  return sorted.slice(offset, offset + limit);
}
