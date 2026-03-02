import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import bcrypt from 'bcrypt';

// GET - 获取模拟账户列表
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '15');
    const sort = searchParams.get('sort') || 'created_at';
    const order = searchParams.get('order') || 'desc';
    const search = searchParams.get('search') || '';

    const offset = (page - 1) * limit;

    // 从 Supabase 读取模拟账户（is_demo = true）
    let query = supabase
      .from('users')
      .select('*', { count: 'exact' })
      .eq('is_demo', true)  // 只查询模拟账户
      .range(offset, offset + limit - 1)
      .order(sort, { ascending: order === 'asc' });

    // 搜索条件
    if (search) {
      query = query.or(`email.ilike.%${search}%,username.ilike.%${search}%`);
    }

    const { data, error, count } = await query;

    if (error) {
      throw error;
    }

    // 格式化数据
    const formattedAccounts = data?.map((account: any) => ({
      id: account.id,
      email: account.email,
      status: account.status || '正常',
      balance: account.balance,
      createdAt: formatDateTime(account.created_at),
      lastLoginAt: account.last_login_at
        ? formatDateTime(account.last_login_at)
        : '—',
    })) || [];

    return NextResponse.json({
      success: true,
      accounts: formattedAccounts,
      total: count,
      page,
      limit,
    });
  } catch (error) {
    console.error('Failed to fetch demo accounts:', error);
    return NextResponse.json(
      {
        success: false,
        error: '获取模拟账户列表失败',
      },
      { status: 500 }
    );
  }
}

// POST - 创建模拟账户
export async function POST(request: NextRequest) {
  try {
    const { email, password, status } = await request.json();

    // 验证必填字段
    if (!email || !password) {
      return NextResponse.json(
        {
          success: false,
          error: '邮箱和密码为必填项',
        },
        { status: 400 }
      );
    }

    // 验证邮箱格式
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        {
          success: false,
          error: '请输入有效的邮箱地址',
        },
        { status: 400 }
      );
    }

    // 检查邮箱是否已存在
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (existingUser) {
      return NextResponse.json(
        {
          success: false,
          error: '该邮箱已被使用',
        },
        { status: 400 }
      );
    }

    // 加密密码
    const passwordHash = await bcrypt.hash(password, 10);

    // 插入模拟账户到 Supabase
    const { data, error } = await supabase
      .from('users')
      .insert([{
        email,
        password_hash: passwordHash,
        username: email.split('@')[0],
        account_type: 'demo',      // 模拟账户
        balance: 100000,            // 初始金额 100,000
        credit_score: 100,
        is_verified: false,
        is_demo: true,              // 标记为模拟账户
        is_active: true,
        user_level: '1',
        status: status || '正常',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }])
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      message: '模拟账户创建成功',
      account: data,
    });
  } catch (error) {
    console.error('Failed to create demo account:', error);
    return NextResponse.json(
      {
        success: false,
        error: '创建模拟账户失败',
      },
      { status: 500 }
    );
  }
}

// 格式化日期时间
function formatDateTime(dateString: string): string {
  const date = new Date(dateString);
  return date
    .toLocaleString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZone: 'GMT',
    })
    .replace(',', '');
}
