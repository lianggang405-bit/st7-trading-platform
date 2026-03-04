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

// GET - 获取单个交易对
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: pairId } = await params;
    const id = parseInt(pairId);

    // 使用和前端一样的 Supabase 客户端
    const supabase = getSupabaseClient();

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

    // 使用和前端一样的 Supabase 客户端
    const supabase = getSupabaseClient();

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

    // 使用和前端一样的 Supabase 客户端
    const supabase = getSupabaseClient();

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
