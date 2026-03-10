import { NextResponse } from 'next/server';
import { getSupabaseAdminClient } from '@/storage/database/supabase-admin-client';

/**
 * POST - 创建交易流水表
 */
export async function POST() {
  try {
    const supabase = getSupabaseAdminClient();

    console.log('[Init Transactions API] Starting transactions table initialization...');

    // 1. 创建交易流水表
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS transactions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        type VARCHAR(20) NOT NULL CHECK (type IN ('deposit', 'withdraw', 'transfer', 'fee', 'open_position', 'close_position', 'adjustment', 'bonus', 'penalty')),
        amount DECIMAL(20, 8) NOT NULL,
        balance DECIMAL(20, 8) NOT NULL,
        order_id VARCHAR(100),
        description TEXT,
        related_user_id INTEGER,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `;

    // 2. 创建索引
    const createIndexesSQL = [
      `CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);`,
      `CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);`,
      `CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at DESC);`,
      `CREATE INDEX IF NOT EXISTS idx_transactions_order_id ON transactions(order_id);`,
    ];

    // 3. 创建外键约束
    const createForeignKeySQL = `
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint 
          WHERE conname = 'fk_transactions_user_id'
        ) THEN
          ALTER TABLE transactions ADD CONSTRAINT fk_transactions_user_id 
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
        END IF;
      END
      $$;
    `;

    // 4. 创建触发器函数（如果不存在）
    const createTriggerFunctionSQL = `
      CREATE OR REPLACE FUNCTION update_transactions_updated_at()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
      END;
      $$ language 'plpgsql';
    `;

    // 5. 创建触发器
    const createTriggerSQL = `
      DROP TRIGGER IF EXISTS update_transactions_updated_at ON transactions;
      CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON transactions
      FOR EACH ROW EXECUTE FUNCTION update_transactions_updated_at();
    `;

    // 执行 SQL 命令
    try {
      // 创建表
      await supabase.rpc('exec_sql', { sql: createTableSQL });
      console.log('[Init Transactions API] Transactions table created');
    } catch (error: any) {
      console.error('[Init Transactions API] Error creating table:', error);
    }

    try {
      // 创建索引
      for (const indexSQL of createIndexesSQL) {
        await supabase.rpc('exec_sql', { sql: indexSQL });
      }
      console.log('[Init Transactions API] Indexes created');
    } catch (error: any) {
      console.error('[Init Transactions API] Error creating indexes:', error);
    }

    try {
      // 创建外键约束
      await supabase.rpc('exec_sql', { sql: createForeignKeySQL });
      console.log('[Init Transactions API] Foreign key constraint created');
    } catch (error: any) {
      console.error('[Init Transactions API] Error creating foreign key:', error);
    }

    try {
      // 创建触发器函数
      await supabase.rpc('exec_sql', { sql: createTriggerFunctionSQL });
      console.log('[Init Transactions API] Trigger function created');
    } catch (error: any) {
      console.error('[Init Transactions API] Error creating trigger function:', error);
    }

    try {
      // 创建触发器
      await supabase.rpc('exec_sql', { sql: createTriggerSQL });
      console.log('[Init Transactions API] Trigger created');
    } catch (error: any) {
      console.error('[Init Transactions API] Error creating trigger:', error);
    }

    // 验证表是否创建成功
    const { data: tables, error: checkError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .eq('table_name', 'transactions')
      .single();

    if (checkError || !tables) {
      console.error('[Init Transactions API] Failed to verify table creation:', checkError);
      return NextResponse.json(
        {
          success: false,
          error: '验证表创建失败',
        },
        { status: 500 }
      );
    }

    console.log('[Init Transactions API] Transactions table initialization completed successfully');

    return NextResponse.json({
      success: true,
      message: '交易流水表初始化成功',
      details: {
        tableName: 'transactions',
        fields: [
          'id',
          'user_id',
          'type',
          'amount',
          'balance',
          'order_id',
          'description',
          'related_user_id',
          'created_at',
          'updated_at',
        ],
        types: [
          'deposit',      // 充值
          'withdraw',     // 提现
          'transfer',     // 转账
          'fee',          // 手续费
          'open_position', // 开仓
          'close_position', // 平仓
          'adjustment',   // 调整
          'bonus',        // 奖金
          'penalty',      // 罚款
        ],
        indexes: ['user_id', 'type', 'created_at', 'order_id'],
        triggers: ['update_transactions_updated_at'],
        constraints: ['fk_transactions_user_id'],
      },
    });
  } catch (error) {
    console.error('[Init Transactions API] Initialization failed:', error);
    return NextResponse.json(
      {
        success: false,
        error: '初始化失败',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
