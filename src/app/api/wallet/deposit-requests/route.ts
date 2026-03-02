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

    // 从请求头或 cookie 中获取 user_id
    // 注意：这里需要完善身份验证逻辑
    let userId = 1; // 默认用户 ID（实际应该从 token 中解析）

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
