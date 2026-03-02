import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
const supabase = getSupabaseClient();
// DELETE /api/admin/wallet/wire-info/[id] - 删除电汇信息
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const infoId = parseInt(id);

    if (isNaN(infoId)) {
      return NextResponse.json({ success: false, error: 'Invalid info ID' }, { status: 400 });
    }

    const { error } = await supabase
      .from('wire_info')
      .delete()
      .eq('id', infoId);

    if (error) {
      console.error('Failed to delete wire info:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE wire info:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH /api/admin/wallet/wire-info/[id] - 更新电汇信息
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const infoId = parseInt(id);
    const body = await request.json();

    if (isNaN(infoId)) {
      return NextResponse.json({ success: false, error: 'Invalid info ID' }, { status: 400 });
    }

    // 将驼峰命名转换为下划线命名
    const updateData: any = {
      updated_at: new Date().toISOString()
    };

    if (body.bankName !== undefined) updateData.bank_name = body.bankName;
    if (body.bankAddress !== undefined) updateData.bank_address = body.bankAddress;
    if (body.swift !== undefined) updateData.swift = body.swift;
    if (body.beneficiaryName !== undefined) updateData.beneficiary_name = body.beneficiaryName;
    if (body.beneficiaryAccount !== undefined) updateData.beneficiary_account = body.beneficiaryAccount;
    if (body.beneficiaryCurrency !== undefined) updateData.beneficiary_currency = body.beneficiaryCurrency;
    if (body.remark !== undefined) updateData.remark = body.remark;
    if (body.isVisible !== undefined) updateData.is_visible = body.isVisible;

    const { data: wireInfo, error } = await supabase
      .from('wire_info')
      .update(updateData)
      .eq('id', infoId)
      .select()
      .single();

    if (error) {
      console.error('Failed to update wire info:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, wireInfo });
  } catch (error) {
    console.error('Error in PATCH wire info:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

// GET /api/admin/wallet/wire-info/[id] - 获取单个电汇信息详情
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const infoId = parseInt(id);

    if (isNaN(infoId)) {
      return NextResponse.json({ success: false, error: 'Invalid info ID' }, { status: 400 });
    }

    const { data: wireInfo, error } = await supabase
      .from('wire_info')
      .select('*')
      .eq('id', infoId)
      .single();

    if (error) {
      console.error('Failed to fetch wire info:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    // 转换数据格式
    const formattedWireInfo = {
      id: wireInfo.id,
      bankName: wireInfo.bank_name,
      bankAddress: wireInfo.bank_address,
      swift: wireInfo.swift,
      beneficiaryName: wireInfo.beneficiary_name,
      beneficiaryAccount: wireInfo.beneficiary_account,
      beneficiaryCurrency: wireInfo.beneficiary_currency,
      remark: wireInfo.remark,
      isVisible: wireInfo.is_visible,
      createdAt: wireInfo.created_at,
      updatedAt: wireInfo.updated_at,
    };

    return NextResponse.json({ success: true, wireInfo: formattedWireInfo });
  } catch (error) {
    console.error('Error in GET wire info:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
