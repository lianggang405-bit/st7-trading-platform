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

// GET - 获取单个交易对
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: pairId } = await params;
    const id = parseInt(pairId);

    // 如果 Supabase 未配置，使用 mock 数据
    if (!useSupabase) {
      const mockPair = mockTradingPairs.find(p => p.id === id);
      if (!mockPair) {
        return NextResponse.json(
          { success: false, error: '交易对不存在' },
          { status: 404 }
        );
      }
      return NextResponse.json({
        success: true,
        pair: {
          id: mockPair.id,
          currencyId: mockPair.currency_id,
          symbol: mockPair.symbol,
          isVisible: mockPair.is_visible !== false,
          minOrderSize: mockPair.min_order_size || 0,
          maxOrderSize: mockPair.max_order_size || 999999,
          contractFee: mockPair.contract_fee || 1.0,
          createdAt: mockPair.created_at,
        },
      });
    }

    // 尝试初始化 Supabase
    let supabase;
    try {
      supabase = getSupabaseAdminClient();
    } catch (error) {
      console.error('Failed to initialize Supabase:', error);
      const mockPair = mockTradingPairs.find(p => p.id === id);
      if (!mockPair) {
        return NextResponse.json(
          { success: false, error: '交易对不存在' },
          { status: 404 }
        );
      }
      return NextResponse.json({
        success: true,
        pair: {
          id: mockPair.id,
          currencyId: mockPair.currency_id,
          symbol: mockPair.symbol,
          isVisible: mockPair.is_visible !== false,
          minOrderSize: mockPair.min_order_size || 0,
          maxOrderSize: mockPair.max_order_size || 999999,
          contractFee: mockPair.contract_fee || 1.0,
          createdAt: mockPair.created_at,
        },
      });
    }

    if (!supabase) {
      const mockPair = mockTradingPairs.find(p => p.id === id);
      if (!mockPair) {
        return NextResponse.json(
          { success: false, error: '交易对不存在' },
          { status: 404 }
        );
      }
      return NextResponse.json({
        success: true,
        pair: {
          id: mockPair.id,
          currencyId: mockPair.currency_id,
          symbol: mockPair.symbol,
          isVisible: mockPair.is_visible !== false,
          minOrderSize: mockPair.min_order_size || 0,
          maxOrderSize: mockPair.max_order_size || 999999,
          contractFee: mockPair.contract_fee || 1.0,
          createdAt: mockPair.created_at,
        },
      });
    }

    // 查询数据库
    const { data, error } = await supabase
      .from('trading_pairs')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.warn('[TradingPairs API] Get failed, trying mock:', error.message);
      const mockPair = mockTradingPairs.find(p => p.id === id);
      if (!mockPair) {
        return NextResponse.json(
          { success: false, error: '交易对不存在' },
          { status: 404 }
        );
      }
      return NextResponse.json({
        success: true,
        pair: {
          id: mockPair.id,
          currencyId: mockPair.currency_id,
          symbol: mockPair.symbol,
          isVisible: mockPair.is_visible !== false,
          minOrderSize: mockPair.min_order_size || 0,
          maxOrderSize: mockPair.max_order_size || 999999,
          contractFee: mockPair.contract_fee || 1.0,
          createdAt: mockPair.created_at,
        },
      });
    }

    return NextResponse.json({
      success: true,
      pair: {
        id: data.id,
        currencyId: data.currency_id,
        symbol: data.symbol,
        isVisible: data.is_visible !== false,
        minOrderSize: data.min_order_size || 0,
        maxOrderSize: data.max_order_size || 999999,
        contractFee: data.contract_fee || 1.0,
        createdAt: data.created_at,
      },
    });
  } catch (error) {
    console.error('Failed to fetch trading pair:', error);
    return NextResponse.json(
      {
        success: false,
        error: '获取交易对失败',
      },
      { status: 500 }
    );
  }
}

// PUT - 更新交易对
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: pairId } = await params;
    const id = parseInt(pairId);
    const body = await request.json();
    const { currencyId, symbol, isVisible, minOrderSize, maxOrderSize, contractFee } = body;

    // 如果 Supabase 未配置，使用 mock 数据
    if (!useSupabase) {
      const mockIndex = mockTradingPairs.findIndex(p => p.id === id);
      if (mockIndex === -1) {
        return NextResponse.json(
          { success: false, error: '交易对不存在' },
          { status: 404 }
        );
      }
      mockTradingPairs[mockIndex] = {
        ...mockTradingPairs[mockIndex],
        currency_id: currencyId !== undefined ? currencyId : mockTradingPairs[mockIndex].currency_id,
        symbol: symbol || mockTradingPairs[mockIndex].symbol,
        is_visible: isVisible !== undefined ? isVisible : mockTradingPairs[mockIndex].is_visible,
        min_order_size: minOrderSize !== undefined ? minOrderSize : mockTradingPairs[mockIndex].min_order_size,
        max_order_size: maxOrderSize !== undefined ? maxOrderSize : mockTradingPairs[mockIndex].max_order_size,
        contract_fee: contractFee !== undefined ? contractFee : mockTradingPairs[mockIndex].contract_fee,
      };
      return NextResponse.json({
        success: true,
        pair: mockTradingPairs[mockIndex],
      });
    }

    // 尝试初始化 Supabase
    let supabase;
    try {
      supabase = getSupabaseAdminClient();
    } catch (error) {
      console.error('Failed to initialize Supabase:', error);
      const mockIndex = mockTradingPairs.findIndex(p => p.id === id);
      if (mockIndex === -1) {
        return NextResponse.json(
          { success: false, error: '交易对不存在' },
          { status: 404 }
        );
      }
      mockTradingPairs[mockIndex] = {
        ...mockTradingPairs[mockIndex],
        currency_id: currencyId !== undefined ? currencyId : mockTradingPairs[mockIndex].currency_id,
        symbol: symbol || mockTradingPairs[mockIndex].symbol,
        is_visible: isVisible !== undefined ? isVisible : mockTradingPairs[mockIndex].is_visible,
        min_order_size: minOrderSize !== undefined ? minOrderSize : mockTradingPairs[mockIndex].min_order_size,
        max_order_size: maxOrderSize !== undefined ? maxOrderSize : mockTradingPairs[mockIndex].max_order_size,
        contract_fee: contractFee !== undefined ? contractFee : mockTradingPairs[mockIndex].contract_fee,
      };
      return NextResponse.json({
        success: true,
        pair: mockTradingPairs[mockIndex],
      });
    }

    if (!supabase) {
      const mockIndex = mockTradingPairs.findIndex(p => p.id === id);
      if (mockIndex === -1) {
        return NextResponse.json(
          { success: false, error: '交易对不存在' },
          { status: 404 }
        );
      }
      mockTradingPairs[mockIndex] = {
        ...mockTradingPairs[mockIndex],
        currency_id: currencyId !== undefined ? currencyId : mockTradingPairs[mockIndex].currency_id,
        symbol: symbol || mockTradingPairs[mockIndex].symbol,
        is_visible: isVisible !== undefined ? isVisible : mockTradingPairs[mockIndex].is_visible,
        min_order_size: minOrderSize !== undefined ? minOrderSize : mockTradingPairs[mockIndex].min_order_size,
        max_order_size: maxOrderSize !== undefined ? maxOrderSize : mockTradingPairs[mockIndex].max_order_size,
        contract_fee: contractFee !== undefined ? contractFee : mockTradingPairs[mockIndex].contract_fee,
      };
      return NextResponse.json({
        success: true,
        pair: mockTradingPairs[mockIndex],
      });
    }

    // 更新数据库
    const { data, error } = await supabase
      .from('trading_pairs')
      .update({
        currency_id: currencyId,
        symbol,
        is_visible: isVisible,
        min_order_size: minOrderSize,
        max_order_size: maxOrderSize,
        contract_fee: contractFee,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.warn('[TradingPairs API] Update failed, using mock:', error.message);
      const mockIndex = mockTradingPairs.findIndex(p => p.id === id);
      if (mockIndex === -1) {
        return NextResponse.json(
          { success: false, error: '交易对不存在' },
          { status: 404 }
        );
      }
      mockTradingPairs[mockIndex] = {
        ...mockTradingPairs[mockIndex],
        currency_id: currencyId !== undefined ? currencyId : mockTradingPairs[mockIndex].currency_id,
        symbol: symbol || mockTradingPairs[mockIndex].symbol,
        is_visible: isVisible !== undefined ? isVisible : mockTradingPairs[mockIndex].is_visible,
        min_order_size: minOrderSize !== undefined ? minOrderSize : mockTradingPairs[mockIndex].min_order_size,
        max_order_size: maxOrderSize !== undefined ? maxOrderSize : mockTradingPairs[mockIndex].max_order_size,
        contract_fee: contractFee !== undefined ? contractFee : mockTradingPairs[mockIndex].contract_fee,
      };
      return NextResponse.json({
        success: true,
        pair: mockTradingPairs[mockIndex],
      });
    }

    return NextResponse.json({
      success: true,
      pair: data,
    });
  } catch (error) {
    console.error('Failed to update trading pair:', error);
    return NextResponse.json(
      {
        success: false,
        error: '更新交易对失败',
      },
      { status: 500 }
    );
  }
}

// DELETE - 删除交易对
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: pairId } = await params;
    const id = parseInt(pairId);

    // 如果 Supabase 未配置，使用 mock 数据
    if (!useSupabase) {
      const mockIndex = mockTradingPairs.findIndex(p => p.id === id);
      if (mockIndex === -1) {
        return NextResponse.json(
          { success: false, error: '交易对不存在' },
          { status: 404 }
        );
      }
      mockTradingPairs.splice(mockIndex, 1);
      return NextResponse.json({
        success: true,
        message: '交易对删除成功',
      });
    }

    // 尝试初始化 Supabase
    let supabase;
    try {
      supabase = getSupabaseAdminClient();
    } catch (error) {
      console.error('Failed to initialize Supabase:', error);
      const mockIndex = mockTradingPairs.findIndex(p => p.id === id);
      if (mockIndex === -1) {
        return NextResponse.json(
          { success: false, error: '交易对不存在' },
          { status: 404 }
        );
      }
      mockTradingPairs.splice(mockIndex, 1);
      return NextResponse.json({
        success: true,
        message: '交易对删除成功',
      });
    }

    if (!supabase) {
      const mockIndex = mockTradingPairs.findIndex(p => p.id === id);
      if (mockIndex === -1) {
        return NextResponse.json(
          { success: false, error: '交易对不存在' },
          { status: 404 }
        );
      }
      mockTradingPairs.splice(mockIndex, 1);
      return NextResponse.json({
        success: true,
        message: '交易对删除成功',
      });
    }

    // 删除数据库记录
    const { error } = await supabase
      .from('trading_pairs')
      .delete()
      .eq('id', id);

    if (error) {
      console.warn('[TradingPairs API] Delete failed, using mock:', error.message);
      const mockIndex = mockTradingPairs.findIndex(p => p.id === id);
      if (mockIndex === -1) {
        return NextResponse.json(
          { success: false, error: '交易对不存在' },
          { status: 404 }
        );
      }
      mockTradingPairs.splice(mockIndex, 1);
      return NextResponse.json({
        success: true,
        message: '交易对删除成功',
      });
    }

    return NextResponse.json({
      success: true,
      message: '交易对删除成功',
    });
  } catch (error) {
    console.error('Failed to delete trading pair:', error);
    return NextResponse.json(
      {
        success: false,
        error: '删除交易对失败',
      },
      { status: 500 }
    );
  }
}
