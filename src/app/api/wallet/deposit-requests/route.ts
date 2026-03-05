import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// 获取环境变量
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// 如果没有配置 Supabase，返回空数据或错误
// 注意：不要在模块顶层抛出错误，否则会导致构建失败
const supabase = (supabaseUrl && supabaseKey) 
  ? createClient(supabaseUrl, supabaseKey) 
  : null;

export async function POST(request: NextRequest) {
  // 如果 Supabase 未初始化
  if (!supabase) {
    console.error('Supabase 未配置');
    return NextResponse.json({
      error: '系统配置错误'
    }, { status: 500 });
  }

  try {
    const body = await request.json();
    const { currency, network, amount, txHash } = body;

    if (!currency || !network || !amount) {
      return NextResponse.json(
        { error: '缺少必要参数' },
        { status: 400 }
      );
    }

    // 从 Authorization header 获取 token
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: '未提供认证令牌' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);

    // 解析 token 获取 user_id
    const match = token.match(/^token_(.+)_(\d+)$/);
    if (!match) {
      // 检查是否为模拟账户token
      const demoMatch = token.match(/^token_demo_(.+)_(\d+)$/);
      if (demoMatch) {
        return NextResponse.json(
          { error: '模拟账户无法进行入金操作' },
          { status: 403 }
        );
      }
      return NextResponse.json(
        { error: '无效的认证令牌' },
        { status: 401 }
      );
    }

    const userId = match[1];

    // 查询用户信息，检查账户类型
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, is_demo, account_type')
      .eq('id', userId)
      .maybeSingle();

    if (userError || !user) {
      return NextResponse.json(
        { error: '用户不存在' },
        { status: 404 }
      );
    }

    // 禁止模拟账户入金
    if (user.is_demo || user.account_type === 'demo') {
      console.error(`[Deposit Request] Demo account ${userId} attempted to make a deposit`);
      return NextResponse.json(
        { error: '模拟账户无法进行入金操作，请切换到正式账户' },
        { status: 403 }
      );
    }

    // 插入入金请求
    const { data: depositRequest, error } = await supabase
      .from('deposit_requests')
      .insert([
        {
          user_id: userId,
          type: 'crypto',
          currency,
          amount: parseFloat(amount),
          tx_hash: txHash || null,
          status: 'pending',
          remark: `网络: ${network}`,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error('提交入金请求失败:', error);
      return NextResponse.json(
        { error: '提交入金请求失败' },
        { status: 500 }
      );
    }

    console.log(`[Deposit Request] User ${userId} (account_type: ${user.account_type}) submitted deposit request: ${depositRequest.id}`);

    return NextResponse.json({
      success: true,
      data: depositRequest,
      message: '入金请求已提交，请等待审核',
    });
  } catch (error) {
    console.error('提交入金请求失败:', error);
    return NextResponse.json(
      { error: '提交入金请求失败' },
      { status: 500 }
    );
  }
}
