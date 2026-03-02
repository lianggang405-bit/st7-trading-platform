import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import bcrypt from 'bcrypt';

// GET - 获取用户列表
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '15');
    const sort = searchParams.get('sort') || 'id';
    const order = searchParams.get('order') || 'desc';
    const search = searchParams.get('search') || '';

    const offset = (page - 1) * limit;

    // 只查询注册用户（排除模拟账户）
    let query = supabase
      .from('users')
      .select('*', { count: 'exact' })
      .eq('is_demo', false)  // 只查询注册用户
      .range(offset, offset + limit - 1)
      .order(sort, { ascending: order === 'asc' });

    // 如果有搜索条件
    if (search) {
      query = query.or(`email.ilike.%${search}%,invite_code.ilike.%${search}%`);
    }

    const { data, error, count } = await query;

    if (error) {
      throw error;
    }

    // 格式化数据
    const formattedUsers = data?.map((user: any) => ({
      id: user.id,
      email: user.email,
      parent: user.parent_id ? '' : '无',
      inviteCode: user.invite_code || '-',
      userType: user.is_demo ? '模拟用户' : '普通用户',
      userLevel: '普通会员',
      status: user.is_active ? 'normal' : 'disabled',
      balance: user.balance || 0,
      createdAt: new Date(user.created_at).toLocaleString('zh-CN'),
      lastLoginAt: user.last_login_at
        ? new Date(user.last_login_at).toLocaleString('zh-CN')
        : '从未登录',
    })) || [];

    return NextResponse.json({
      success: true,
      users: formattedUsers,
      total: count,
      page,
      limit,
    });
  } catch (error) {
    console.error('Failed to fetch users:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch users',
      },
      { status: 500 }
    );
  }
}

// POST - 创建用户
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      email,
      inviteCode,
      status,
      balance,
      password,
      remark,
      createdAt,
    } = body;

    // 验证必填字段
    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // 加密密码
    const passwordHash = await bcrypt.hash(password, 10);

    // 生成邀请码（如果未提供）
    const generatedInviteCode = inviteCode || `INV${Date.now().toString().slice(-8)}`;

    // 生成用户名（基于邮箱）
    const username = email.split('@')[0];

    // 插入数据（注册用户）
    const { data, error } = await supabase
      .from('users')
      .insert([
        {
          email,
          password_hash: passwordHash,
          username,
          invite_code: generatedInviteCode,
          account_type: 'real',       // 注册用户
          balance: balance || 0,       // 初始金额 0
          user_level: '普通会员',
          status: status || 'active',
          is_demo: false,              // 标记为注册用户
          is_active: status === 'active' || status === 'normal',
          is_verified: false,
          remark,
          created_at: createdAt ? new Date(createdAt).toISOString() : new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    if (error) {
      console.error('Error creating user:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to create user' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error('Error in POST /api/admin/users/list:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
