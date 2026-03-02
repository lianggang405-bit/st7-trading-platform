import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
const supabase = getSupabaseClient();
export async function GET(request: NextRequest) {
  try {
    const { data, error } = await supabase
      .from('quick_contract_durations')
      .select('*')
      .order('sort', { ascending: true })
      .order('duration', { ascending: true });

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      configs: data || [],
    });
  } catch (error) {
    console.error('Get quick contract durations error:', error);
    return NextResponse.json(
      { success: false, error: '获取秒数配置失败' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { duration, payoutRate, minAmount, maxAmount, status, sort } = body;

    if (!duration || duration <= 0) {
      return NextResponse.json(
        { success: false, error: '秒数必须大于0' },
        { status: 400 }
      );
    }

    if (payoutRate < 1 || payoutRate > 10) {
      return NextResponse.json(
        { success: false, error: '赔付倍率必须在1到10之间' },
        { status: 400 }
      );
    }

    if (minAmount < 0.01) {
      return NextResponse.json(
        { success: false, error: '最小金额不能小于0.01' },
        { status: 400 }
      );
    }

    if (maxAmount <= minAmount) {
      return NextResponse.json(
        { success: false, error: '最大金额必须大于最小金额' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('quick_contract_durations')
      .insert([{
        duration,
        payout_rate: payoutRate,
        min_amount: minAmount,
        max_amount: maxAmount,
        status: status || 'active',
        sort: sort || 0,
      }])
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      config: data,
    });
  } catch (error) {
    console.error('Create quick contract duration error:', error);
    return NextResponse.json(
      { success: false, error: '创建秒数配置失败' },
      { status: 500 }
    );
  }
}
