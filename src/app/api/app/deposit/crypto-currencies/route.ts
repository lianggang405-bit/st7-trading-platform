import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

const supabase = getSupabaseClient();

// 模拟加密货币数据
const mockCurrencies = [
  { id: 1, code: 'BTC', name: 'Bitcoin', nameEn: 'Bitcoin', symbol: 'BTC', protocol: 'ERC20', walletAddress: '0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0', qrCode: '', minAmount: 0.001, maxAmount: 10, fee: 0, feeType: 'fixed' as const },
  { id: 2, code: 'ETH', name: 'Ethereum', nameEn: 'Ethereum', symbol: 'ETH', protocol: 'ERC20', walletAddress: '0x7f8e9d0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e', qrCode: '', minAmount: 0.01, maxAmount: 100, fee: 0, feeType: 'fixed' as const },
  { id: 3, code: 'USDT', name: 'Tether', nameEn: 'Tether', symbol: 'USDT', protocol: 'TRC20', walletAddress: 'T9zXqYvW5uT4sR3qP2oN1mK0jL9kI8jH7gF6e', qrCode: '', minAmount: 1, maxAmount: 100000, fee: 0, feeType: 'fixed' as const },
  { id: 4, code: 'USDT', name: 'Tether', nameEn: 'Tether', symbol: 'USDT', protocol: 'ERC20', walletAddress: '0xd4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e', qrCode: '', minAmount: 1, maxAmount: 100000, fee: 0, feeType: 'fixed' as const },
];

// GET - 获取加密货币列表
export async function GET(request: NextRequest) {
  try {
    // 首先尝试从 crypto_addresses 表获取加密货币配置
    let data: any;
    let error: any;
    
    // 第一次尝试
    const firstResult = await supabase
      .from('crypto_addresses')
      .select('*')
      .eq('status', 'active')
      .order('id');
    
    data = firstResult.data;
    error = firstResult.error;
    
    // 如果遇到 schema cache 错误，尝试刷新 schema cache 并重试
    if (error && error.message && error.message.includes('schema cache')) {
      console.log('[Crypto Currencies API] Schema cache error detected, trying to refresh...');
      
      // 刷新 schema cache：通过执行一个简单的查询来刷新
      try {
        await supabase.from('crypto_addresses').select('id').limit(1);
        console.log('[Crypto Currencies API] Schema cache refreshed, retrying query...');
        
        // 重试查询
        const retryResult = await supabase
          .from('crypto_addresses')
          .select('*')
          .eq('status', 'active')
          .order('id');
        
        data = retryResult.data;
        error = retryResult.error;
      } catch (retryError: any) {
        console.error('[Crypto Currencies API] Retry also failed:', retryError);
        // 保持原始错误
      }
    }

    if (!error && data) {
      // 转换数据格式
      const currencies = data.map((item: any) => ({
        id: item.id,
        code: item.currency,
        name: item.currency,
        nameEn: item.currency,
        symbol: item.currency,
        protocol: item.protocol || item.network, // 添加协议字段
        walletAddress: item.address,
        qrCode: '',
        minAmount: 0,
        maxAmount: 0,
        fee: 0,
        feeType: 'fixed' as const,
      }));

      return NextResponse.json({
        success: true,
        currencies,
      });
    }

    // 如果数据库查询失败，返回模拟数据
    console.warn('[Crypto Currencies API] Database query failed, using mock data:', error);
    return NextResponse.json({
      success: true,
      currencies: mockCurrencies,
      note: '使用模拟数据',
    });
  } catch (error) {
    console.error('Failed to fetch crypto currencies:', error);
    // 返回模拟数据作为兜底
    return NextResponse.json({
      success: true,
      currencies: mockCurrencies,
      note: '使用模拟数据',
    });
  }
}
