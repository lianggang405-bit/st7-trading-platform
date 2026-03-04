import { NextResponse } from 'next/server';
import { getSupabaseAdminClient } from '@/storage/database/supabase-admin-client';

// POST - 创建 financial_records 表
export async function POST() {
  try {
    const supabase = getSupabaseAdminClient();

    // 检查表是否存在
    const { error: checkError } = await supabase
      .from('financial_records')
      .select('id')
      .limit(1);

    if (!checkError || checkError.code !== '42P01') {
      return NextResponse.json({
        success: true,
        message: 'financial_records 表已存在',
      });
    }

    // 使用 SQL 创建表
    const { error: createError } = await supabase.rpc('execute_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS public.financial_records (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          wallet_id INTEGER,
          account_type VARCHAR(20) DEFAULT 'demo' NOT NULL CHECK (account_type IN ('demo', 'real')),
          operation_type VARCHAR(50) NOT NULL,
          amount DECIMAL(20, 2) NOT NULL,
          balance_before DECIMAL(20, 2) NOT NULL,
          balance_after DECIMAL(20, 2) NOT NULL,
          description TEXT,
          reference_id VARCHAR(100),
          reference_type VARCHAR(50),
          status VARCHAR(20) DEFAULT 'completed' NOT NULL CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')),
          created_by VARCHAR(100),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
        );
      `,
    });

    if (createError) {
      console.error('[Create Table] 创建表失败:', createError);
      return NextResponse.json({
        success: false,
        error: '创建表失败',
        details: createError.message,
      });
    }

    // 插入示例数据
    const { error: insertError } = await supabase.rpc('execute_sql', {
      sql: `
        INSERT INTO financial_records (
          user_id, wallet_id, account_type, operation_type,
          amount, balance_before, balance_after,
          description, reference_id, reference_type,
          status, created_by, created_at
        ) VALUES
          (1, 1, 'demo', 'deposit', 100000.00, 0.00, 100000.00,
           '初始资金充值', NULL, 'initial', 'completed', 'system', NOW()),
          (1, 1, 'demo', 'trade_profit', 200.00, 100000.00, 100200.00,
           'BTC交易盈利', 'order_1', 'trade', 'completed', 'system', NOW()),
          (1, 1, 'demo', 'trade_fee', -10.00, 100200.00, 100190.00,
           'BTC交易手续费', 'order_1', 'fee', 'completed', 'system', NOW())
        ON CONFLICT DO NOTHING;
      `,
    });

    if (insertError) {
      console.error('[Create Table] 插入数据失败:', insertError);
    }

    return NextResponse.json({
      success: true,
      message: 'financial_records 表创建成功',
    });
  } catch (error) {
    console.error('[Create Table] 异常:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
