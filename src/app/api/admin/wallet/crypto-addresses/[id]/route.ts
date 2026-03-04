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

    // 尝试执行删除，如果遇到 schema cache 错误则先刷新 schema cache 再重试
    let error: any;
    
    try {
      const result = await supabase
        .from('crypto_addresses')
        .delete()
        .eq('id', addressId);
      
      error = result.error;
    } catch (firstError: any) {
      console.log('[CryptoAddresses DELETE] First attempt failed, trying to refresh schema cache...');
      
      // 如果遇到 schema cache 错误，尝试刷新 schema cache 并重试
      if (firstError.message && firstError.message.includes('schema cache')) {
        // 刷新 schema cache：通过执行一个简单的查询来刷新
        try {
          await supabase.from('crypto_addresses').select('id').limit(1);
          console.log('[CryptoAddresses DELETE] Schema cache refreshed, retrying delete...');
          
          // 重试删除
          const retryResult = await supabase
            .from('crypto_addresses')
            .delete()
            .eq('id', addressId);
          
          error = retryResult.error;
        } catch (retryError: any) {
          console.error('[CryptoAddresses DELETE] Retry also failed:', retryError);
          error = retryError;
        }
      } else {
        error = firstError;
      }
    }

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
    if (body.protocol !== undefined) {
      updateData.protocol = body.protocol;
      updateData.network = body.protocol; // 同时更新 network 字段
    }
    if (body.address !== undefined) updateData.address = body.address;
    if (body.usdPrice !== undefined) updateData.usd_price = body.usdPrice;
    if (body.status !== undefined) updateData.status = body.status;

    console.log('[CryptoAddresses PATCH] Update data:', updateData);

    // 尝试执行更新，如果遇到 schema cache 错误则先刷新 schema cache 再重试
    let cryptoAddress: any;
    let error: any;
    
    try {
      const result = await supabase
        .from('crypto_addresses')
        .update(updateData)
        .eq('id', addressId)
        .select()
        .single();
      
      cryptoAddress = result.data;
      error = result.error;
    } catch (firstError: any) {
      console.log('[CryptoAddresses PATCH] First attempt failed, trying to refresh schema cache...');
      
      // 如果遇到 schema cache 错误，尝试刷新 schema cache 并重试
      if (firstError.message && firstError.message.includes('schema cache')) {
        // 刷新 schema cache：通过执行一个简单的查询来刷新
        try {
          await supabase.from('crypto_addresses').select('id').limit(1);
          console.log('[CryptoAddresses PATCH] Schema cache refreshed, retrying update...');
          
          // 重试更新
          const retryResult = await supabase
            .from('crypto_addresses')
            .update(updateData)
            .eq('id', addressId)
            .select()
            .single();
          
          cryptoAddress = retryResult.data;
          error = retryResult.error;
        } catch (retryError: any) {
          console.error('[CryptoAddresses PATCH] Retry also failed:', retryError);
          error = retryError;
        }
      } else {
        error = firstError;
      }
    }

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

    // 尝试执行查询，如果遇到 schema cache 错误则先刷新 schema cache 再重试
    let cryptoAddress: any;
    let error: any;
    
    try {
      const result = await supabase
        .from('crypto_addresses')
        .select('*')
        .eq('id', addressId)
        .single();
      
      cryptoAddress = result.data;
      error = result.error;
    } catch (firstError: any) {
      console.log('[CryptoAddresses GET] First attempt failed, trying to refresh schema cache...');
      
      // 如果遇到 schema cache 错误，尝试刷新 schema cache 并重试
      if (firstError.message && firstError.message.includes('schema cache')) {
        // 刷新 schema cache：通过执行一个简单的查询来刷新
        try {
          await supabase.from('crypto_addresses').select('id').limit(1);
          console.log('[CryptoAddresses GET] Schema cache refreshed, retrying query...');
          
          // 重试查询
          const retryResult = await supabase
            .from('crypto_addresses')
            .select('*')
            .eq('id', addressId)
            .single();
          
          cryptoAddress = retryResult.data;
          error = retryResult.error;
        } catch (retryError: any) {
          console.error('[CryptoAddresses GET] Retry also failed:', retryError);
          error = retryError;
        }
      } else {
        error = firstError;
      }
    }

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
