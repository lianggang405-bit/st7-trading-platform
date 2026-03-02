import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { currency, network, amount, txHash } = body;

    if (!currency || !network || !amount) {
      return NextResponse.json(
        { error: '缂哄皯蹇呰鍙傛暟' },
        { status: 400 }
      );
    }

    // 浠庤姹傚ご鎴?cookie 涓幏鍙?user_id
    const authHeader = request.headers.get('authorization');
    let userId = 1; // 榛樿鐢ㄦ埛 ID锛堝疄闄呭簲璇ヤ粠 token 涓В鏋愶級

    // 杩欓噷搴旇楠岃瘉鐢ㄦ埛韬唤锛屼絾涓轰簡婕旂ず锛屾垜浠娇鐢ㄩ粯璁ゅ€?    // 鍦ㄧ敓浜х幆澧冧腑锛屽簲璇ヤ粠 JWT token 涓В鏋?user_id

    // 鎻掑叆鍏ラ噾璇锋眰
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
          remark: `缃戠粶: ${network}`,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error('鎻愪氦鍏ラ噾璇锋眰澶辫触:', error);
      return NextResponse.json(
        { error: '鎻愪氦鍏ラ噾璇锋眰澶辫触' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: depositRequest,
      message: '鍏ラ噾璇锋眰宸叉彁浜わ紝璇风瓑寰呭鏍?,
    });
  } catch (error) {
    console.error('鎻愪氦鍏ラ噾璇锋眰澶辫触:', error);
    return NextResponse.json(
      { error: '鎻愪氦鍏ラ噾璇锋眰澶辫触' },
      { status: 500 }
    );
  }
}

