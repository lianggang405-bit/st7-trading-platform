import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { verifyAdminToken } from '@/lib/admin-auth';

// GET - 获取品种详情
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const adminToken = request.cookies.get('admin_token')?.value ||
                      request.headers.get('authorization')?.replace('Bearer ', '');

    // 验证管理员权限
    const admin = verifyAdminToken(adminToken || '');
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = getSupabaseClient();

    // 获取交易对详情
    const { data, error } = await supabase
      .from('trading_pairs')
      .select('*')
      .eq('id', parseInt(id))
      .single();

    if (error) {
      console.error('[Get Symbol Detail] Error:', error);
      return NextResponse.json(
        { error: 'Failed to get symbol detail' },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { error: 'Symbol not found' },
        { status: 404 }
      );
    }

    // 格式化返回数据
    const symbol = data;
    const symbolName = symbol.symbol.toUpperCase();
    let type = 'forex';
    let alias = symbol.symbol;

    // 根据交易对确定类型和别名
    if (symbolName.includes('BTC') || symbolName.includes('ETH') || symbolName.includes('LTC') ||
        symbolName.includes('SOL') || symbolName.includes('XRP') || symbolName.includes('DOGE')) {
      type = 'crypto';
      if (symbolName.includes('BTC')) alias = 'Bitcoin';
      else if (symbolName.includes('ETH')) alias = 'Ethereum';
      else if (symbolName.includes('LTC')) alias = 'Litecoin';
      else if (symbolName.includes('SOL')) alias = 'Solana';
      else if (symbolName.includes('XRP')) alias = 'Ripple';
      else if (symbolName.includes('DOGE')) alias = 'Dogecoin';
    } else if (symbolName.includes('XAU')) {
      type = 'metal';
      alias = 'Gold';
    } else if (symbolName.includes('XAG')) {
      type = 'metal';
      alias = 'Silver';
    } else if (symbolName.includes('USOIL') || symbolName.includes('UKOIL')) {
      type = 'energy';
      alias = symbolName.includes('USOIL') ? 'US Crude Oil' : 'UK Crude Oil';
    } else if (symbolName.includes('NGAS')) {
      type = 'energy';
      alias = 'Natural Gas';
    } else if (symbolName.includes('US500') || symbolName.includes('ND25') || symbolName.includes('AUS200')) {
      type = 'indices';
      if (symbolName.includes('US500')) alias = 'S&P 500';
      else if (symbolName.includes('ND25')) alias = 'NASDAQ 100';
      else if (symbolName.includes('AUS200')) alias = 'ASX 200';
    } else {
      alias = getForexAlias(symbolName);
    }

    return NextResponse.json({
      success: true,
      symbol: {
        id: symbol.id,
        name: symbol.symbol,
        alias: alias,
        type: type,
        sort: symbol.id - 30,
        isVisible: symbol.is_visible !== false,
        flashContractFee: symbol.contract_fee || 1.0,
        contractSize: 100,
        min_order_size: symbol.min_order_size || 0.001,
        max_order_size: symbol.max_order_size || 999999,
      },
    });
  } catch (error) {
    console.error('[Get Symbol Detail] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
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

// PATCH - 更新品种
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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
      is_visible,
      min_order_size,
      max_order_size,
      contract_fee,
    } = body;

    const supabase = getSupabaseClient();

    // 构建更新数据对象
    const updateData: any = {};
    if (symbol !== undefined) updateData.symbol = symbol;
    if (currency_id !== undefined) updateData.currency_id = currency_id;
    if (is_visible !== undefined) updateData.is_visible = is_visible;
    if (min_order_size !== undefined) updateData.min_order_size = min_order_size;
    if (max_order_size !== undefined) updateData.max_order_size = max_order_size;
    if (contract_fee !== undefined) updateData.contract_fee = contract_fee;

    // 如果修改了symbol，检查是否与其他交易对冲突
    if (symbol) {
      const { data: existing } = await supabase
        .from('trading_pairs')
        .select('id')
        .eq('symbol', symbol)
        .neq('id', parseInt(id))
        .single();

      if (existing) {
        return NextResponse.json(
          { error: 'Symbol already exists' },
          { status: 409 }
        );
      }
    }

    // 更新交易对
    const { data, error } = await supabase
      .from('trading_pairs')
      .update(updateData)
      .eq('id', parseInt(id))
      .select()
      .single();

    if (error) {
      console.error('[Update Symbol] Error:', error);
      return NextResponse.json(
        { error: 'Failed to update symbol' },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { error: 'Symbol not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: '品种更新成功',
      symbol: data,
    });
  } catch (error) {
    console.error('[Update Symbol] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE - 删除品种
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const adminToken = request.cookies.get('admin_token')?.value ||
                      request.headers.get('authorization')?.replace('Bearer ', '');

    // 验证管理员权限
    const admin = verifyAdminToken(adminToken || '');
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = getSupabaseClient();

    // 删除交易对
    const { error } = await supabase
      .from('trading_pairs')
      .delete()
      .eq('id', parseInt(id));

    if (error) {
      console.error('[Delete Symbol] Error:', error);
      return NextResponse.json(
        { error: 'Failed to delete symbol' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: '品种删除成功',
    });
  } catch (error) {
    console.error('[Delete Symbol] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
