import { NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

// POST - 创建测试用户到数据库
export async function POST() {
  try {
    const supabase = getSupabaseClient();

    // 用户 1：模拟账户
    const user1 = {
      username: 'test.user1',
      email: 'test.user1@example.com',
      password_hash: '$2b$10$gsauqYejTyGeMFyqMliSPO7ZIOSriLwVZ58huGRnVvEin.wBKUABO', // Test123456
      balance: 100000,
      account_type: 'demo',
      is_demo: true,
      is_active: true,
      status: '正常',
      user_level: '1',
      credit_score: 100,
      is_verified: false
    };

    // 用户 2：正式账户
    const user2 = {
      username: 'test.user2',
      email: 'test.user2@example.com',
      password_hash: '$2b$10$gsauqYejTyGeMFyqMliSPO7ZIOSriLwVZ58huGRnVvEin.wBKUABO', // Test123456
      balance: 0,
      account_type: 'real',
      is_demo: false,
      is_active: true,
      status: '正常',
      user_level: '1',
      credit_score: 100,
      is_verified: false
    };

    // 插入用户 1
    const { data: data1, error: error1 } = await supabase
      .from('users')
      .insert([user1])
      .select()
      .single();

    if (error1) {
      console.error('Error inserting user1:', error1);
      return NextResponse.json({
        success: false,
        error: '创建用户1失败',
        details: error1
      }, { status: 500 });
    }

    // 插入用户 2
    const { data: data2, error: error2 } = await supabase
      .from('users')
      .insert([user2])
      .select()
      .single();

    if (error2) {
      console.error('Error inserting user2:', error2);
      return NextResponse.json({
        success: false,
        error: '创建用户2失败',
        details: error2
      }, { status: 500 });
    }

    console.log('Users created:', data1, data2);

    return NextResponse.json({
      success: true,
      message: '测试用户创建成功',
      users: [
        { id: data1.id, email: data1.email, balance: data1.balance, account_type: data1.account_type },
        { id: data2.id, email: data2.email, balance: data2.balance, account_type: data2.account_type }
      ]
    });

  } catch (error: any) {
    console.error('Error creating test users:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
