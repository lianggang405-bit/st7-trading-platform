import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

const supabase = getSupabaseClient();

// GET - 获取单个电汇币种详情
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const { data, error } = await supabase
      .from('wire_currency_settings')
      .select('*')
      .eq('id', parseInt(id))
      .single();

    if (error || !data) {
      return NextResponse.json(
        {
          success: false,
          message: '电汇币种不存在',
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        id: data.id,
        currencyName: data.currency_name,
        usdPrice: parseFloat(data.usd_price) || 0,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      },
    });
  } catch (error) {
    console.error('Failed to fetch wire currency:', error);
    return NextResponse.json(
      {
        success: false,
        message: '获取电汇币种失败',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// PUT - 更新电汇币种
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { currencyName, usdPrice } = body;

    // 验证必填字段
    if (!currencyName || currencyName.trim() === '') {
      return NextResponse.json(
        {
          success: false,
          message: '币种名称不能为空',
        },
        { status: 400 }
      );
    }

    // 检查币种是否已存在（排除当前记录）
    const { data: existing } = await supabase
      .from('wire_currency_settings')
      .select('id')
      .eq('currency_name', currencyName.trim().toUpperCase())
      .neq('id', parseInt(id))
      .single();

    if (existing) {
      return NextResponse.json(
        {
          success: false,
          message: '该币种已存在',
        },
        { status: 400 }
      );
    }

    // 更新记录
    const { data, error } = await supabase
      .from('wire_currency_settings')
      .update({
        currency_name: currencyName.trim().toUpperCase(),
        usd_price: parseFloat(usdPrice) || 0,
      })
      .eq('id', parseInt(id))
      .select()
      .single();

    if (error || !data) {
      console.error('Failed to update wire currency:', error);
      return NextResponse.json(
        {
          success: false,
          message: '更新电汇币种失败',
          error: error?.message || 'Record not found',
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: '更新成功',
      data: {
        id: data.id,
        currencyName: data.currency_name,
        usdPrice: parseFloat(data.usd_price) || 0,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      },
    });
  } catch (error) {
    console.error('Failed to update wire currency:', error);
    return NextResponse.json(
      {
        success: false,
        message: '更新电汇币种失败',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// DELETE - 删除电汇币种
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // 检查记录是否存在
    const { data: existing } = await supabase
      .from('wire_currency_settings')
      .select('id')
      .eq('id', parseInt(id))
      .single();

    if (!existing) {
      return NextResponse.json(
        {
          success: false,
          message: '电汇币种不存在',
        },
        { status: 404 }
      );
    }

    // 删除记录
    const { error } = await supabase
      .from('wire_currency_settings')
      .delete()
      .eq('id', parseInt(id));

    if (error) {
      console.error('Failed to delete wire currency:', error);
      return NextResponse.json(
        {
          success: false,
          message: '删除电汇币种失败',
          error: error.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: '删除成功',
    });
  } catch (error) {
    console.error('Failed to delete wire currency:', error);
    return NextResponse.json(
      {
        success: false,
        message: '删除电汇币种失败',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
