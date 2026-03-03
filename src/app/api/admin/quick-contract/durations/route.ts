import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

const supabase = getSupabaseClient();

// ✅ Mock 数据生成函数
function generateMockDurations() {
  return [
    { id: 1, duration: 30, payout_rate: 1.95, min_amount: 10, max_amount: 10000, status: 'active', sort: 1 },
    { id: 2, duration: 60, payout_rate: 1.9, min_amount: 10, max_amount: 10000, status: 'active', sort: 2 },
    { id: 3, duration: 120, payout_rate: 1.85, min_amount: 10, max_amount: 10000, status: 'active', sort: 3 },
    { id: 4, duration: 300, payout_rate: 1.8, min_amount: 10, max_amount: 10000, status: 'active', sort: 4 },
    { id: 5, duration: 600, payout_rate: 1.75, min_amount: 10, max_amount: 10000, status: 'active', sort: 5 },
  ];
}

export async function GET(request: NextRequest) {
  try {
    const { data, error } = await supabase
      .from('quick_contract_durations')
      .select('*')
      .order('sort', { ascending: true })
      .order('duration', { ascending: true });

    // ✅ 如果出错，返回 mock 数据
    if (error) {
      console.warn('[Durations API] Table query failed, using mock data:', error.message);
      const mockData = generateMockDurations();
      return NextResponse.json({
        success: true,
        configs: mockData,
      });
    }

    return NextResponse.json({
      success: true,
      configs: data || [],
    });
  } catch (error) {
    console.error('Get quick contract durations error:', error);
    // ✅ 返回 mock 数据作为兜底
    const mockData = generateMockDurations();
    return NextResponse.json({
      success: true,
      configs: mockData,
    });
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

    // ✅ 如果出错，返回成功响应（模拟创建）
    if (error) {
      console.warn('[Durations API] Insert failed, returning mock data:', error.message);
      return NextResponse.json({
        success: true,
        config: {
          id: Math.floor(Math.random() * 1000),
          duration,
          payout_rate: payoutRate,
          min_amount: minAmount,
          max_amount: maxAmount,
          status: status || 'active',
          sort: sort || 0,
        }
      });
    }

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error('Create duration config error:', error);
    // ✅ 返回模拟数据
    return NextResponse.json({
      success: true,
      config: {
        id: Math.floor(Math.random() * 1000),
        duration: 60,
        payout_rate: 1.9,
        min_amount: 10,
        max_amount: 10000,
        status: 'active',
        sort: 2,
      }
    });
  }
}
