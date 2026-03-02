// 直接使用 Supabase REST API 创建表
// 使用方式：node scripts/create-trading-tables.js

const { getSupabaseClient } = require('../src/storage/database/supabase-client');

async function createTables() {
  const supabase = getSupabaseClient();

  console.log('开始创建数据库表...');

  // 方法1: 尝试使用 supabase.from 直接插入，如果表不存在会报错
  // 但我们可以根据错误信息判断是否需要创建表

  try {
    // 尝试查询表是否存在
    const { data, error } = await supabase
      .from('trading_pairs')
      .select('*')
      .limit(1);

    if (error) {
      console.log('表不存在，需要手动创建');
      console.log('错误信息:', error.message);
      console.log('\n请在 Supabase 管理界面的 SQL Editor 中执行以下 SQL：\n');
      console.log(`
-- 创建交易对表
CREATE TABLE IF NOT EXISTS trading_pairs (
  id SERIAL PRIMARY KEY,
  symbol VARCHAR(20) UNIQUE NOT NULL,
  currency_id INTEGER NOT NULL,
  is_visible BOOLEAN DEFAULT true,
  min_order_size DECIMAL(20, 8) DEFAULT 0.001,
  max_order_size DECIMAL(20, 8) DEFAULT 999999,
  contract_fee DECIMAL(5, 2) DEFAULT 0.1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_trading_pairs_symbol ON trading_pairs(symbol);
CREATE INDEX IF NOT EXISTS idx_trading_pairs_visible ON trading_pairs(is_visible);

-- 创建调控机器人表
CREATE TABLE IF NOT EXISTS trading_bots (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  pair_id INTEGER NOT NULL REFERENCES trading_pairs(id) ON DELETE CASCADE,
  float_value DECIMAL(20, 8) DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(pair_id)
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_trading_bots_pair_id ON trading_bots(pair_id);
CREATE INDEX IF NOT EXISTS idx_trading_bots_active ON trading_bots(is_active);

-- 插入默认交易对
INSERT INTO trading_pairs (symbol, currency_id, is_visible, min_order_size, max_order_size, contract_fee)
VALUES
  ('BTC/USDT', 1, true, 0.001, 100, 0.1),
  ('ETH/USDT', 2, true, 0.01, 1000, 0.1),
  ('XAU/USD', 3, true, 0.01, 100, 0.1),
  ('XAU/USDT', 4, true, 0.01, 100, 0.1)
ON CONFLICT (symbol) DO NOTHING;
      `);
      process.exit(1);
    } else {
      console.log('表已存在，检查数据...');
      console.log('trading_pairs 表中的数据:', data);

      // 尝试插入测试数据（如果表为空）
      if (!data || data.length === 0) {
        console.log('\n表为空，正在插入默认数据...');

        const { data: insertData, error: insertError } = await supabase
          .from('trading_pairs')
          .insert([
            { symbol: 'BTC/USDT', currency_id: 1, is_visible: true, min_order_size: 0.001, max_order_size: 100, contract_fee: 0.1 },
            { symbol: 'ETH/USDT', currency_id: 2, is_visible: true, min_order_size: 0.01, max_order_size: 1000, contract_fee: 0.1 },
            { symbol: 'XAU/USD', currency_id: 3, is_visible: true, min_order_size: 0.01, max_order_size: 100, contract_fee: 0.1 },
            { symbol: 'XAU/USDT', currency_id: 4, is_visible: true, min_order_size: 0.01, max_order_size: 100, contract_fee: 0.1 },
          ])
          .select();

        if (insertError) {
          console.error('插入数据失败:', insertError);
          process.exit(1);
        } else {
          console.log('默认数据插入成功:', insertData);
        }
      } else {
        console.log('表中已有数据，跳过插入');
      }
    }
  } catch (error) {
    console.error('检查表时出错:', error);
    process.exit(1);
  }

  console.log('\n✅ 数据库初始化完成！');
  console.log('现在可以访问 /admin/trading/bots 页面了');
}

createTables();
