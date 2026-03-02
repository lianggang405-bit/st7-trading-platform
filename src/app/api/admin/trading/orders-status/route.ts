import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET - 检查 orders 表状态并提供创建指南
export async function GET() {
  try {
    // 尝试查询 orders 表
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .limit(0);

    if (error) {
      return NextResponse.json({
        success: false,
        exists: false,
        message: 'orders 表不存在',
        error: error.message,
        solution: {
          title: '创建 orders 表',
          steps: [
            '1. 访问 Supabase 控制台: https://app.supabase.com',
            '2. 选择项目: brfzboxaxknlypapwajy',
            '3. 打开 SQL Editor',
            '4. 复制 /workspace/projects/scripts/create_orders_table.sql 中的 SQL',
            '5. 粘贴到 SQL Editor 并执行',
          ],
          documentation: '/workspace/projects/docs/CREATE_ORDERS_TABLE.md',
        },
      });
    }

    // 获取表结构信息
    const { data: columns, error: columnsError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable')
      .eq('table_name', 'orders')
      .eq('table_schema', 'public')
      .order('ordinal_position');

    return NextResponse.json({
      success: true,
      exists: true,
      message: 'orders 表已存在',
      tableInfo: {
        name: 'orders',
        columnCount: columns?.length || 0,
        columns: columns || [],
      },
      nextSteps: [
        '测试交易功能',
        '验证订单创建',
        '验证持仓管理',
      ],
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      exists: false,
      error: error instanceof Error ? error.message : String(error),
      solution: {
        title: '创建 orders 表',
        steps: [
          '1. 访问 Supabase 控制台: https://app.supabase.com',
          '2. 选择项目: brfzboxaxknlypapwajy',
          '3. 打开 SQL Editor',
          '4. 复制 /workspace/projects/scripts/create_orders_table.sql 中的 SQL',
          '5. 粘贴到 SQL Editor 并执行',
        ],
        documentation: '/workspace/projects/docs/CREATE_ORDERS_TABLE.md',
      },
    });
  }
}
