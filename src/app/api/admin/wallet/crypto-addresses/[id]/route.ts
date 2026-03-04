import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
const supabase = getSupabaseClient();
// DELETE /api/admin/wallet/crypto-addresses/[id] - 删除数字货币地址
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const addressId = parseInt(id);

    if (isNaN(addressId)) {
      return NextResponse.json({ success: false, error: 'Invalid address ID' }, { status: 400 });
    }

    const { error } = await supabase
      .from('crypto_addresses')
      .delete()
      .eq('id', addressId);

    if (error) {
      console.error('Failed to delete crypto address:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE crypto address:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH /api/admin/wallet/crypto-addresses/[id] - 更新数字货币地址
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const addressId = parseInt(id);
    const body = await request.json();
    
    console.log('[CryptoAddresses PATCH] Received request:', { id, addressId, body });

    if (isNaN(addressId)) {
      console.log('[CryptoAddresses PATCH] Invalid address ID:', id);
      return NextResponse.json({ success: false, error: 'Invalid address ID' }, { status: 400 });
    }

    // 将驼峰命名转换为下划线命名
    const updateData: any = {
      updated_at: new Date().toISOString()
    };

    if (body.currency !== undefined) updateData.currency = body.currency;
    if (body.protocol !== undefined) updateData.protocol = body.protocol;
    if (body.address !== undefined) updateData.address = body.address;
    if (body.usdPrice !== undefined) updateData.usd_price = body.usdPrice;
    if (body.status !== undefined) updateData.status = body.status;

    console.log('[CryptoAddresses PATCH] Update data:', updateData);

    const { data: cryptoAddress, error } = await supabase
      .from('crypto_addresses')
      .update(updateData)
      .eq('id', addressId)
      .select()
      .single();

    console.log('[CryptoAddresses PATCH] Supabase response:', { data: cryptoAddress, error });

    if (error) {
      console.error('[CryptoAddresses PATCH] Failed to update crypto address:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    // 转换数据格式以匹配前端期望
    const formattedAddress = {
      id: cryptoAddress.id,
      currency: cryptoAddress.currency,
      protocol: cryptoAddress.protocol,
      address: cryptoAddress.address,
      status: cryptoAddress.status,
      usdPrice: cryptoAddress.usd_price,
      createdAt: cryptoAddress.created_at,
      updatedAt: cryptoAddress.updated_at,
    };

    console.log('[CryptoAddresses PATCH] Returning success response:', formattedAddress);
    return NextResponse.json({ success: true, address: formattedAddress });
  } catch (error) {
    console.error('[CryptoAddresses PATCH] Error in PATCH crypto address:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

// GET /api/admin/wallet/crypto-addresses/[id] - 获取单个数字货币地址详情
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const addressId = parseInt(id);

    if (isNaN(addressId)) {
      return NextResponse.json({ success: false, error: 'Invalid address ID' }, { status: 400 });
    }

    const { data: cryptoAddress, error } = await supabase
      .from('crypto_addresses')
      .select('*')
      .eq('id', addressId)
      .single();

    if (error) {
      console.error('Failed to fetch crypto address:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    // 转换数据格式
    const formattedAddress = {
      id: cryptoAddress.id,
      currency: cryptoAddress.currency,
      protocol: cryptoAddress.protocol,
      address: cryptoAddress.address,
      status: cryptoAddress.status,
      usdPrice: cryptoAddress.usd_price,
      createdAt: cryptoAddress.created_at,
      updatedAt: cryptoAddress.updated_at,
    };

    return NextResponse.json({ success: true, address: formattedAddress });
  } catch (error) {
    console.error('Error in GET crypto address:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
