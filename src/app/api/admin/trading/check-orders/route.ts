import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET - 检查 orders 表是否存在
export async function GET() {
  try {
    // 尝试查询 orders 表（空查询）
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .limit(0);

    if (error) {
      return NextResponse.json({
        success: false,
        exists: false,
        error: error.message,
      });
    }

    // 获取表结构信息
    const { data: columns, error: columnsError } = await supabase
      .rpc('get_table_structure', { table_name: 'orders' })
      .select('*')
      .limit(1);

    return NextResponse.json({
      success: true,
      exists: true,
      message: 'Orders 表存在',
      columns: columnsError ? '无法获取列信息' : columns,
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      exists: false,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}
