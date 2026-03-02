import { NextResponse } from 'next/server';

// GET - 查询所有用户
export async function GET() {
  try {
    const response = await fetch('https://brfzboxaxknlypapwajy.supabase.co/rest/v1/users?select=id,username,email,balance,account_type,created_at&order=id.desc', {
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
        count: data.length,
        users: data
      });
    } else {
      const error = await response.text();
      return NextResponse.json({
        success: false,
        error: error
      });
    }

  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
