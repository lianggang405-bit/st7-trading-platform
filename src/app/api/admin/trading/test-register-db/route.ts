import { NextResponse } from 'next/server';

// POST - 测试注册并验证数据库
export async function POST() {
  try {
    const email = 'test.db.check@example.com';
    const password = 'Test123456';

    console.log('[Test Register] Starting registration test...');

    // 1. 调用注册 API
    const registerResponse = await fetch('http://localhost:5000/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, accountType: 'demo' })
    });

    const registerData = await registerResponse.json();
    console.log('[Test Register] Registration response:', registerData);

    if (!registerData.success) {
      return NextResponse.json({
        success: false,
        error: '注册失败',
        details: registerData
      });
    }

    // 2. 查询 Supabase 数据库验证
    const dbResponse = await fetch('https://brfzboxaxknlypapwajy.supabase.co/rest/v1/users?select=id,email,balance,account_type&email=eq.' + email, {
      method: 'GET',
      headers: {
        'apikey': 'sb_publishable_3FOyR_TdA-_zwg4K-8Feqg_Lka84e0o',
        'Authorization': 'Bearer sb_publishable_3FOyR_TdA-_zwg4K-8Feqg_Lka84e0o',
      }
    });

    const dbData = await dbResponse.json();
    console.log('[Test Register] Database query result:', dbData);

    return NextResponse.json({
      success: true,
      registration: registerData,
      database: {
        found: dbData.length > 0,
        users: dbData
      },
      message: dbData.length > 0 ? '✅ 用户已成功存储到数据库' : '❌ 用户未存储到数据库'
    });

  } catch (error: any) {
    console.error('[Test Register] Error:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
