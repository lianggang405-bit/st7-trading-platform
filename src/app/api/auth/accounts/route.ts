import { NextRequest, NextResponse } from 'next/server';
import {
  getAllAccounts,
  findAccountByEmail,
  createDemoAccount,
} from '@/lib/demo-account-storage';

// GET - 获取所有账户（用于前端同步）
export async function GET(request: NextRequest) {
  try {
    const accounts = getAllAccounts();

    return NextResponse.json({
      success: true,
      accounts,
    });
  } catch (error) {
    console.error('Failed to get accounts:', error);
    return NextResponse.json(
      {
        success: false,
        error: '获取账户列表失败',
      },
      { status: 500 }
    );
  }
}

// POST - 创建账户（用于前端注册时同步到文件）
export async function POST(request: NextRequest) {
  try {
    const { email, password, accountType } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        {
          success: false,
          error: '邮箱和密码为必填项',
        },
        { status: 400 }
      );
    }

    // 检查是否已存在
    const existing = findAccountByEmail(email);
    if (existing) {
      return NextResponse.json(
        {
          success: false,
          error: '该邮箱已被使用',
        },
        { status: 400 }
      );
    }

    // 创建账户
    const newAccount = createDemoAccount({
      id: Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15),
      email,
      password,
      username: email.split('@')[0],
      balance: 100000,
      accountType: accountType || 'demo',
    });

    return NextResponse.json({
      success: true,
      account: newAccount,
    });
  } catch (error) {
    console.error('Failed to create account:', error);
    return NextResponse.json(
      {
        success: false,
        error: '创建账户失败',
      },
      { status: 500 }
    );
  }
}
