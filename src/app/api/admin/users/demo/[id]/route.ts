import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import bcrypt from 'bcrypt';

// GET - 获取单个模拟账户详情
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // 从 Supabase 查询模拟账户
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .eq('is_demo', true)  // 只查询模拟账户
      .single();

    if (error || !data) {
      return NextResponse.json(
        {
          success: false,
          error: '模拟账户不存在',
        },
        { status: 404 }
      );
    }

    // 格式化返回数据
    const formattedAccount = {
      id: data.id,
      email: data.email,
      status: data.status || '正常',
      balance: data.balance,
      createdAt: formatDateTime(data.created_at),
      lastLoginAt: data.last_login_at
        ? formatDateTime(data.last_login_at)
        : '—',
    };

    return NextResponse.json({
      success: true,
      account: formattedAccount,
    });
  } catch (error) {
    console.error('Failed to fetch demo account:', error);
    return NextResponse.json(
      {
        success: false,
        error: '获取账户信息失败',
      },
      { status: 500 }
    );
  }
}

// PATCH - 更新模拟账户
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { email, status, password } = await request.json();

    // 验证必填字段
    if (!email) {
      return NextResponse.json(
        {
          success: false,
          error: '邮箱为必填项',
        },
        { status: 400 }
      );
    }

    // 查询现有账户
    const { data: existingUser } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .eq('is_demo', true)
      .single();

    if (!existingUser) {
      return NextResponse.json(
        {
          success: false,
          error: '模拟账户不存在',
        },
        { status: 404 }
      );
    }

    // 检查邮箱是否被其他用户使用
    if (email !== existingUser.email) {
      const { data: emailUser } = await supabase
        .from('users')
        .select('id')
        .eq('email', email)
        .neq('id', id)
        .single();

      if (emailUser) {
        return NextResponse.json(
          {
            success: false,
            error: '该邮箱已被其他用户使用',
          },
          { status: 400 }
        );
      }
    }

    // 准备更新数据
    const updateData: any = {
      email,
      status: status || existingUser.status,
      username: email.split('@')[0],
      updated_at: new Date().toISOString(),
    };

    // 如果提供了新密码，则更新密码
    if (password && password.trim()) {
      updateData.password_hash = await bcrypt.hash(password.trim(), 10);
    }

    // 更新 Supabase
    const { data, error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', id)
      .eq('is_demo', true)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      message: '模拟账户更新成功',
      account: data,
    });
  } catch (error) {
    console.error('Failed to update demo account:', error);
    return NextResponse.json(
      {
        success: false,
        error: '更新模拟账户失败',
      },
      { status: 500 }
    );
  }
}

// DELETE - 删除模拟账户
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // 从 Supabase 删除模拟账户
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', id)
      .eq('is_demo', true);  // 只删除模拟账户

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      message: '模拟账户删除成功',
    });
  } catch (error) {
    console.error('Failed to delete demo account:', error);
    return NextResponse.json(
      {
        success: false,
        error: '删除模拟账户失败',
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
