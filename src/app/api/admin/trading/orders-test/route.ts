import { NextResponse } from 'next/server';

// POST - 直接查询 orders 表（绕过 REST API 缓存）
export async function POST() {
  try {
    const response = await fetch('https://brfzboxaxknlypapwajy.supabase.co/rest/v1/orders?select=id', {
      method: 'GET',
      headers: {
        'apikey': 'sb_publishable_3FOyR_TdA-_zwg4K-8Feqg_Lka84e0o',
        'Authorization': 'Bearer sb_publishable_3FOyR_TdA-_zwg4K-8Feqg_Lka84e0o',
      }
    });

    if (response.ok) {
      const data = await response.json();
      return NextResponse.json({
        success: true,
        message: 'orders 表可以访问',
        data: data
      });
    } else {
      const error = await response.text();
      return NextResponse.json({
        success: false,
        error: error,
        status: response.status
      });
    }

  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
