import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET - 获取实名认证详情
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: requestId } = await params;

    // 获取实名认证详情
    const { data: kycRequest, error } = await supabase
      .from('kyc_requests')
      .select('*')
      .eq('id', requestId)
      .single();

    if (error) {
      console.error('Error fetching KYC request:', error);
      return NextResponse.json(
        { success: false, error: 'KYC request not found' },
        { status: 404 }
      );
    }

    // 获取关联的用户信息
    const { data: user } = await supabase
      .from('users')
      .select('email')
      .eq('id', kycRequest.user_id)
      .single();

    // 格式化数据
    const formattedKYC = {
      id: kycRequest.id,
      userId: kycRequest.user_id,
      email: user?.email || '',
      realName: kycRequest.real_name || '—',
      idNumber: kycRequest.id_number || '—',
      idCardFront: kycRequest.id_card_front_url || '',
      idCardBack: kycRequest.id_card_back_url || '',
      applyTime: kycRequest.created_at
        ? new Date(kycRequest.created_at).toLocaleString('zh-CN')
        : '—',
      reviewTime: kycRequest.updated_at
        ? new Date(kycRequest.updated_at).toLocaleString('zh-CN')
        : '—',
      status: kycRequest.status || 'pending',
      rejectReason: kycRequest.reject_reason || '—',
    };

    return NextResponse.json({
      success: true,
      kyc: formattedKYC,
    });
  } catch (error) {
    console.error('Error in GET /api/admin/users/kyc/[id]:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH - 更新实名认证状态
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: requestId } = await params;
    const body = await request.json();
    const { status, rejectReason } = body;

    const updateData: any = {
      status,
      updated_at: new Date().toISOString(),
    };

    if (rejectReason) {
      updateData.reject_reason = rejectReason;
    }

    const { data, error } = await supabase
      .from('kyc_requests')
      .update(updateData)
      .eq('id', requestId)
      .select()
      .single();

    if (error) {
      throw error;
    }

    // 如果审核通过，更新用户表的实名认证状态
    if (status === 'approved') {
      await supabase
        .from('users')
        .update({ is_verified: true })
        .eq('id', data.user_id);
    }

    return NextResponse.json({
      success: true,
      message: 'KYC request updated successfully',
      data,
    });
  } catch (error) {
    console.error('Failed to update KYC request:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update KYC request',
      },
      { status: 500 }
    );
  }
}
