import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
const supabase = getSupabaseClient();
export async function GET() {
  try {
    const { data, error } = await supabase
      .from('wire_info')
      .select('*')
      .order('id', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    const info = data ? {
      bankName: data.bank_name,
      bankAddress: data.bank_address,
      accountName: data.account_name,
      accountNumber: data.account_number,
      swiftCode: data.swift_code,
      iban: data.iban,
      routingNumber: data.routing_number,
    } : null;

    return NextResponse.json({
      success: true,
      info,
    });
  } catch (error) {
    console.error('Get wire info error:', error);
    return NextResponse.json(
      { success: false, error: '获取电汇信息失败' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const { data: existing } = await supabase
      .from('wire_info')
      .select('id')
      .limit(1);

    let result;
    if (existing && existing.length > 0) {
      result = await supabase
        .from('wire_info')
        .update({
          bank_name: body.bankName,
          bank_address: body.bankAddress,
          account_name: body.accountName,
          account_number: body.accountNumber,
          swift_code: body.swiftCode,
          iban: body.iban,
          routing_number: body.routingNumber,
        })
        .eq('id', existing[0].id);
    } else {
      result = await supabase
        .from('wire_info')
        .insert([{
          bank_name: body.bankName,
          bank_address: body.bankAddress,
          account_name: body.accountName,
          account_number: body.accountNumber,
          swift_code: body.swiftCode,
          iban: body.iban,
          routing_number: body.routingNumber,
        }]);
    }

    if (result.error) {
      return NextResponse.json(
        { success: false, error: result.error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: '电汇信息保存成功',
    });
  } catch (error) {
    console.error('Save wire info error:', error);
    return NextResponse.json(
      { success: false, error: '保存电汇信息失败' },
      { status: 500 }
    );
  }
}
