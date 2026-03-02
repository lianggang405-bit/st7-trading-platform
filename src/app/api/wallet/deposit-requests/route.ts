import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.COZE_SUPABASE_URL || '',
  process.env.COZE_SUPABASE_ANON_KEY || ''
);

export async function POST(request: NextRequest) {
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
    const authHeader = request.headers.get('authorization');
    let userId = 1; // 默认用户 ID（实际应该从 token 中解析）

    // 这里应该验证用户身份，但为了演示，我们使用默认值
    // 在生产环境中，应该从 JWT token 中解析 user_id

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
