import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

const supabase = getSupabaseClient();

/**
 * POST /api/admin/database/initialize-missing-tables
 *
 * 创建缺失的表并插入初始数据
 */
export async function POST(request: NextRequest) {
  try {
    const { table } = await request.json();

    // ✅ 如果指定了表，只初始化该表
    if (table) {
      const result = await initializeTable(table);
      return NextResponse.json({
        success: true,
        message: `表 ${table} 初始化完成`,
        result,
      });
    }

    // ✅ 否则初始化所有缺失的表
    const results: any = {};

    // 检查并创建 symbols 表
    results.symbols = await initializeTable('symbols');

    // 检查并创建 symbol_types 表
    results.symbolTypes = await initializeTable('symbol_types');

    // 检查并创建 trading_hours 表
    results.tradingHours = await initializeTable('trading_hours');

    // 检查并创建 crypto_addresses 表
    results.cryptoAddresses = await initializeTable('crypto_addresses');

    // 检查并创建 deposit_requests 表
    results.depositRequests = await initializeTable('deposit_requests');

    // 检查并创建 withdrawal_requests 表
    results.withdrawalRequests = await initializeTable('withdrawal_requests');

    // 检查并创建 flash_contract_orders 表
    results.flashContractOrders = await initializeTable('flash_contract_orders');

    // 检查并创建 demo_flash_contract_orders 表
    results.demoFlashContractOrders = await initializeTable('demo_flash_contract_orders');

    // 检查并创建 demo_contract_orders 表
    results.demoContractOrders = await initializeTable('demo_contract_orders');

    // 检查并创建 project_orders 表
    results.projectOrders = await initializeTable('project_orders');

    // 检查并创建 quick_contract_durations 表
    results.quickContractDurations = await initializeTable('quick_contract_durations');

    // 检查并创建 wire_currency_settings 表
    results.wireCurrencySettings = await initializeTable('wire_currency_settings');

    // 检查并创建 financial_records 表
    results.financialRecords = await initializeTable('financial_records');

    // 检查并创建 crypto_addresses 表
    results.cryptoAddresses = await initializeTable('crypto_addresses');

    // 检查并创建 deposit_requests 表
    results.depositRequests = await initializeTable('deposit_requests');

    return NextResponse.json({
      success: true,
      message: '数据库表初始化完成',
      results,
    });
  } catch (error) {
    console.error('Failed to initialize database tables:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to initialize database tables',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * 初始化单个表
 */
async function initializeTable(tableName: string): Promise<any> {
  const { error } = await supabase.from(tableName).select('*').limit(1);

  // 如果表存在，跳过
  if (!error || error.code !== '42P01') {
    return { status: 'exists', message: `表 ${tableName} 已存在` };
  }

  // ✅ 表不存在，创建表并插入初始数据
  console.log(`[DatabaseInit] 创建表 ${tableName}`);

  switch (tableName) {
    case 'symbols':
      return await createSymbolsTable();
    case 'symbol_types':
      return await createSymbolTypesTable();
    case 'trading_hours':
      return await createTradingHoursTable();
    case 'crypto_addresses':
      return await createCryptoAddressesTable();
    case 'deposit_requests':
      return await createDepositRequestsTable();
    case 'withdrawal_requests':
      return await createWithdrawalRequestsTable();
    case 'flash_contract_orders':
      return await createFlashContractOrdersTable();
    case 'demo_flash_contract_orders':
      return await createDemoFlashContractOrdersTable();
    case 'demo_contract_orders':
      return await createDemoContractOrdersTable();
    case 'project_orders':
      return await createProjectOrdersTable();
    case 'quick_contract_durations':
      return await createQuickContractDurationsTable();
    case 'wire_currency_settings':
      return await createWireCurrencySettingsTable();
    case 'financial_records':
      return await createFinancialRecordsTable();
    case 'crypto_addresses':
      return await createCryptoAddressesTable();
    case 'deposit_requests':
      return await createDepositRequestsTable();
    default:
      return { status: 'skipped', message: `未知的表: ${tableName}` };
  }
}

/**
 * 创建 symbols 表
 */
async function createSymbolsTable() {
  try {
    // ✅ 使用 SQL 创建表
    const { error } = await supabase.rpc('execute_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS public.symbols (
          id SERIAL PRIMARY KEY,
          name VARCHAR(50) NOT NULL UNIQUE,
          alias VARCHAR(100),
          icon VARCHAR(255),
          type VARCHAR(50) DEFAULT 'forex',
          sort INTEGER DEFAULT 0,
          is_visible BOOLEAN DEFAULT true,
          flash_contract_fee NUMERIC(10, 2) DEFAULT 1.0,
          contract_size INTEGER DEFAULT 100,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `,
    });

    if (error) {
      console.error('[DatabaseInit] 创建 symbols 表失败:', error);
      return { status: 'error', message: error.message };
    }

    // ✅ 插入初始数据
    const mockSymbols = [
      { name: 'BTC', alias: 'Bitcoin', icon: '/icons/btc.png', type: 'crypto', sort: 1, is_visible: true, flash_contract_fee: 1.0, contract_size: 100 },
      { name: 'ETH', alias: 'Ethereum', icon: '/icons/eth.png', type: 'crypto', sort: 2, is_visible: true, flash_contract_fee: 1.0, contract_size: 100 },
      { name: 'SOL', alias: 'Solana', icon: '/icons/sol.png', type: 'crypto', sort: 3, is_visible: true, flash_contract_fee: 1.0, contract_size: 100 },
      { name: 'XAUUSD', alias: 'Gold', icon: '/icons/gold.png', type: 'metal', sort: 4, is_visible: true, flash_contract_fee: 1.0, contract_size: 100 },
      { name: 'EURUSD', alias: 'Euro/US Dollar', icon: '/icons/eur.png', type: 'forex', sort: 5, is_visible: true, flash_contract_fee: 0.1, contract_size: 1000 },
    ];

    const { error: insertError } = await supabase.from('symbols').insert(mockSymbols).select();

    if (insertError) {
      console.error('[DatabaseInit] 插入 symbols 数据失败:', insertError);
      return { status: 'warning', message: '表创建成功，但数据插入失败', error: insertError.message };
    }

    return { status: 'created', message: 'symbols 表创建成功，已插入 5 条初始数据' };
  } catch (error) {
    console.error('[DatabaseInit] 创建 symbols 表异常:', error);
    return { status: 'error', message: error instanceof Error ? error.message : '未知错误' };
  }
}

/**
 * 创建 symbol_types 表
 */
async function createSymbolTypesTable() {
  try {
    const mockSymbolTypes = [
      { name: '加密货币', sort: 1, status: 'normal' },
      { name: '外汇', sort: 2, status: 'normal' },
      { name: '贵金属', sort: 3, status: 'normal' },
      { name: '能源', sort: 4, status: 'normal' },
      { name: '股指', sort: 5, status: 'normal' },
    ];

    const { error: insertError } = await supabase.from('symbol_types').insert(mockSymbolTypes).select();

    if (insertError) {
      console.error('[DatabaseInit] 插入 symbol_types 数据失败:', insertError);
      return { status: 'warning', message: '数据插入失败', error: insertError.message };
    }

    return { status: 'created', message: 'symbol_types 表创建成功，已插入 5 条初始数据' };
  } catch (error) {
    console.error('[DatabaseInit] 创建 symbol_types 表异常:', error);
    return { status: 'error', message: error instanceof Error ? error.message : '未知错误' };
  }
}

/**
 * 创建 trading_hours 表
 */
async function createTradingHoursTable() {
  try {
    const symbols = ['BTCUSD', 'ETHUSD', 'XAUUSD', 'EURUSD', 'GBPUSD', 'SOLUSD', 'XRPUSD'];
    const mockHours = symbols.map((symbol, index) => ({
      symbol,
      monday_open: '00:00:00',
      monday_close: '23:59:59',
      tuesday_open: '00:00:00',
      tuesday_close: '23:59:59',
      wednesday_open: '00:00:00',
      wednesday_close: '23:59:59',
      thursday_open: '00:00:00',
      thursday_close: '23:59:59',
      friday_open: '00:00:00',
      friday_close: '23:59:59',
      saturday_open: '00:00:00',
      saturday_close: '00:00:00',
      sunday_open: '00:00:00',
      sunday_close: '00:00:00',
    }));

    const { error: insertError } = await supabase.from('trading_hours').insert(mockHours).select();

    if (insertError) {
      console.error('[DatabaseInit] 插入 trading_hours 数据失败:', insertError);
      return { status: 'warning', message: '数据插入失败', error: insertError.message };
    }

    return { status: 'created', message: 'trading_hours 表创建成功，已插入 7 条初始数据' };
  } catch (error) {
    console.error('[DatabaseInit] 创建 trading_hours 表异常:', error);
    return { status: 'error', message: error instanceof Error ? error.message : '未知错误' };
  }
}

/**
 * 创建 crypto_addresses 表
 */
async function createCryptoAddressesTable() {
  try {
    const mockAddresses = [
      { currency: 'BTC', protocol: 'ERC20', address: '0x1a2b3c4d5e6f...', status: 'active', usd_price: 95000 },
      { currency: 'ETH', protocol: 'ERC20', address: '0x7f8e9d0a1b2c...', status: 'active', usd_price: 3400 },
      { currency: 'USDT', protocol: 'TRC20', address: 'T9zXq...8yV', status: 'active', usd_price: 1 },
      { currency: 'USDT', protocol: 'ERC20', address: '0xd4e5f6a7b8c9...', status: 'active', usd_price: 1 },
    ];

    const { error: insertError } = await supabase.from('crypto_addresses').insert(mockAddresses).select();

    if (insertError) {
      console.error('[DatabaseInit] 插入 crypto_addresses 数据失败:', insertError);
      return { status: 'warning', message: '数据插入失败', error: insertError.message };
    }

    return { status: 'created', message: 'crypto_addresses 表创建成功，已插入 4 条初始数据' };
  } catch (error) {
    console.error('[DatabaseInit] 创建 crypto_addresses 表异常:', error);
    return { status: 'error', message: error instanceof Error ? error.message : '未知错误' };
  }
}

/**
 * 创建 deposit_requests 表
 */
async function createDepositRequestsTable() {
  try {
    const mockRequests = [
      { user_id: 1, type: 'crypto', currency: 'USDT', amount: 1000, tx_hash: '0x1a2b3c...', status: 'approved' },
      { user_id: 2, type: 'crypto', currency: 'BTC', amount: 0.05, tx_hash: 'abc123...', status: 'pending' },
    ];

    const { error: insertError } = await supabase.from('deposit_requests').insert(mockRequests).select();

    if (insertError) {
      console.error('[DatabaseInit] 插入 deposit_requests 数据失败:', insertError);
      return { status: 'warning', message: '数据插入失败', error: insertError.message };
    }

    return { status: 'created', message: 'deposit_requests 表创建成功，已插入 2 条初始数据' };
  } catch (error) {
    console.error('[DatabaseInit] 创建 deposit_requests 表异常:', error);
    return { status: 'error', message: error instanceof Error ? error.message : '未知错误' };
  }
}

/**
 * 创建 withdrawal_requests 表
 */
async function createWithdrawalRequestsTable() {
  try {
    const mockRequests = [
      { account: 'user1@example.com', currency: 'USDT', withdrawal_address: '0x7f8e9d...', withdrawal_amount: 500, fee: 5, actual_amount: 495, status: 'SUCCESS' },
      { account: 'user2@example.com', currency: 'BTC', withdrawal_address: 'bc1q...', withdrawal_amount: 0.01, fee: 0.001, actual_amount: 0.009, status: 'PENDING' },
      { account: 'user3@example.com', currency: 'ETH', withdrawal_address: '0xd4e5f6...', withdrawal_amount: 0.5, fee: 0.01, actual_amount: 0.49, status: 'FAIL' },
    ];

    const { error: insertError } = await supabase.from('withdrawal_requests').insert(mockRequests).select();

    if (insertError) {
      console.error('[DatabaseInit] 插入 withdrawal_requests 数据失败:', insertError);
      return { status: 'warning', message: '数据插入失败', error: insertError.message };
    }

    return { status: 'created', message: 'withdrawal_requests 表创建成功，已插入 3 条初始数据' };
  } catch (error) {
    console.error('[DatabaseInit] 创建 withdrawal_requests 表异常:', error);
    return { status: 'error', message: error instanceof Error ? error.message : '未知错误' };
  }
}

/**
 * 创建 flash_contract_orders 表
 */
async function createFlashContractOrdersTable() {
  try {
    const mockOrders = [
      { account: 'user1@example.com', symbol: 'BTCUSD', type: '买入', status: '进行中', quantity: 1000, fee: 10, result: '无', profit: 0, open_price: 95000, close_price: null, duration: 60 },
      { account: 'user2@example.com', symbol: 'ETHUSD', type: '卖出', status: '已完成', quantity: 500, fee: 5, result: '盈利', profit: 25, open_price: 3400, close_price: 3350, duration: 30 },
    ];

    const { error: insertError } = await supabase.from('flash_contract_orders').insert(mockOrders).select();

    if (insertError) {
      console.error('[DatabaseInit] 插入 flash_contract_orders 数据失败:', insertError);
      return { status: 'warning', message: '数据插入失败', error: insertError.message };
    }

    return { status: 'created', message: 'flash_contract_orders 表创建成功，已插入 2 条初始数据' };
  } catch (error) {
    console.error('[DatabaseInit] 创建 flash_contract_orders 表异常:', error);
    return { status: 'error', message: error instanceof Error ? error.message : '未知错误' };
  }
}

/**
 * 创建 quick_contract_durations 表
 */
async function createQuickContractDurationsTable() {
  try {
    const mockDurations = [
      { duration: 30, payout_rate: 1.95, min_amount: 10, max_amount: 10000, status: 'active', sort: 1 },
      { duration: 60, payout_rate: 1.9, min_amount: 10, max_amount: 10000, status: 'active', sort: 2 },
      { duration: 120, payout_rate: 1.85, min_amount: 10, max_amount: 10000, status: 'active', sort: 3 },
      { duration: 300, payout_rate: 1.8, min_amount: 10, max_amount: 10000, status: 'active', sort: 4 },
      { duration: 600, payout_rate: 1.75, min_amount: 10, max_amount: 10000, status: 'active', sort: 5 },
    ];

    const { error: insertError } = await supabase.from('quick_contract_durations').insert(mockDurations).select();

    if (insertError) {
      console.error('[DatabaseInit] 插入 quick_contract_durations 数据失败:', insertError);
      return { status: 'warning', message: '数据插入失败', error: insertError.message };
    }

    return { status: 'created', message: 'quick_contract_durations 表创建成功，已插入 5 条初始数据' };
  } catch (error) {
    console.error('[DatabaseInit] 创建 quick_contract_durations 表异常:', error);
    return { status: 'error', message: error instanceof Error ? error.message : '未知错误' };
  }
}

/**
 * 创建 wire_currency_settings 表
 */
async function createWireCurrencySettingsTable() {
  try {
    const mockCurrencies = [
      { currency_name: 'USD', usd_price: 1 },
      { currency_name: 'EUR', usd_price: 1.0856 },
      { currency_name: 'GBP', usd_price: 1.2654 },
    ];

    const { error: insertError } = await supabase.from('wire_currency_settings').insert(mockCurrencies).select();

    if (insertError) {
      console.error('[DatabaseInit] 插入 wire_currency_settings 数据失败:', insertError);
      return { status: 'warning', message: '数据插入失败', error: insertError.message };
    }

    return { status: 'created', message: 'wire_currency_settings 表创建成功，已插入 3 条初始数据' };
  } catch (error) {
    console.error('[DatabaseInit] 创建 wire_currency_settings 表异常:', error);
    return { status: 'error', message: error instanceof Error ? error.message : '未知错误' };
  }
}

/**
 * 创建 financial_records 表
 */
async function createFinancialRecordsTable() {
  try {
    // ✅ 使用 SQL 创建表
    const { error } = await supabase.rpc('execute_sql', {
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

        -- 创建索引
        CREATE INDEX IF NOT EXISTS idx_financial_records_user_id ON financial_records(user_id);
        CREATE INDEX IF NOT EXISTS idx_financial_records_account_type ON financial_records(account_type);
        CREATE INDEX IF NOT EXISTS idx_financial_records_operation_type ON financial_records(operation_type);
        CREATE INDEX IF NOT EXISTS idx_financial_records_status ON financial_records(status);
        CREATE INDEX IF NOT EXISTS idx_financial_records_created_at ON financial_records(created_at DESC);
        CREATE INDEX IF NOT EXISTS idx_financial_records_reference ON financial_records(reference_id, reference_type);
      `,
    });

    if (error) {
      console.error('[DatabaseInit] 创建 financial_records 表失败:', error);
      return { status: 'error', message: error.message };
    }

    // ✅ 插入初始数据
    const mockRecords = [
      { user_id: 1, wallet_id: 1, account_type: 'demo', operation_type: 'deposit', amount: 100000.00, balance_before: 0.00, balance_after: 100000.00, description: '初始资金充值', reference_id: null, reference_type: 'initial', status: 'completed', created_by: 'system', created_at: '2026-02-27T09:00:00Z' },
      { user_id: 1, wallet_id: 1, account_type: 'demo', operation_type: 'trade_profit', amount: 200.00, balance_before: 100000.00, balance_after: 100200.00, description: 'BTC交易盈利', reference_id: 'order_1', reference_type: 'trade', status: 'completed', created_by: 'system', created_at: '2026-02-27T10:05:00Z' },
      { user_id: 1, wallet_id: 1, account_type: 'demo', operation_type: 'trade_fee', amount: -10.00, balance_before: 100200.00, balance_after: 100190.00, description: 'BTC交易手续费', reference_id: 'order_1', reference_type: 'fee', status: 'completed', created_by: 'system', created_at: '2026-02-27T10:05:00Z' },
      { user_id: 1, wallet_id: 1, account_type: 'demo', operation_type: 'withdraw', amount: -5000.00, balance_before: 100190.00, balance_after: 95190.00, description: '提现申请', reference_id: 'withdraw_1', reference_type: 'withdrawal', status: 'completed', created_by: 'admin', created_at: '2026-02-27T11:00:00Z' },
      { user_id: 1, wallet_id: 1, account_type: 'demo', operation_type: 'deposit', amount: 20000.00, balance_before: 95190.00, balance_after: 115190.00, description: '银行转账充值', reference_id: 'deposit_1', reference_type: 'deposit', status: 'completed', created_by: 'admin', created_at: '2026-02-27T12:00:00Z' },
    ];

    const { error: insertError } = await supabase.from('financial_records').insert(mockRecords).select();

    if (insertError) {
      console.error('[DatabaseInit] 插入 financial_records 数据失败:', insertError);
      return { status: 'warning', message: '表创建成功，但数据插入失败', error: insertError.message };
    }

    return { status: 'created', message: 'financial_records 表创建成功，已插入 5 条初始数据' };
  } catch (error) {
    console.error('[DatabaseInit] 创建 financial_records 表异常:', error);
    return { status: 'error', message: error instanceof Error ? error.message : '未知错误' };
  }
}

/**
 * 创建 crypto_addresses 表
 */
async function createCryptoAddressesTable() {
  try {
    // ✅ 使用 SQL 创建表
    const { error } = await supabase.rpc('execute_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS public.crypto_addresses (
          id SERIAL PRIMARY KEY,
          currency VARCHAR(50) NOT NULL,
          protocol VARCHAR(50),
          network VARCHAR(50),
          address TEXT NOT NULL,
          usd_price DECIMAL(30, 8) DEFAULT 0 NOT NULL,
          status VARCHAR(20) DEFAULT 'active' NOT NULL CHECK (status IN ('active', 'inactive', 'maintenance')),
          created_by VARCHAR(100),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
        );

        -- 创建索引
        CREATE INDEX IF NOT EXISTS idx_crypto_addresses_currency ON crypto_addresses(currency);
        CREATE INDEX IF NOT EXISTS idx_crypto_addresses_protocol ON crypto_addresses(protocol);
        CREATE INDEX IF NOT EXISTS idx_crypto_addresses_status ON crypto_addresses(status);
        CREATE INDEX IF NOT EXISTS idx_crypto_addresses_created_at ON crypto_addresses(created_at DESC);
      `,
    });

    if (error) {
      console.error('[DatabaseInit] 创建 crypto_addresses 表失败:', error);
      return { status: 'error', message: error.message };
    }

    // ✅ 插入初始数据
    const mockAddresses = [
      { currency: 'BTC', protocol: 'ERC20', network: 'Ethereum', address: '0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0', usd_price: 95000.00, status: 'active', created_by: 'admin' },
      { currency: 'ETH', protocol: 'ERC20', network: 'Ethereum', address: '0x7f8e9d0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e', usd_price: 3400.00, status: 'active', created_by: 'admin' },
      { currency: 'USDT', protocol: 'TRC20', network: 'TRON', address: 'T9zXqYvW5uT4sR3qP2oN1mK0jL9kI8jH7gF6e', usd_price: 1.00, status: 'active', created_by: 'admin' },
      { currency: 'USDT', protocol: 'ERC20', network: 'Ethereum', address: '0xd4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e', usd_price: 1.00, status: 'active', created_by: 'admin' },
    ];

    const { error: insertError } = await supabase.from('crypto_addresses').insert(mockAddresses).select();

    if (insertError) {
      console.error('[DatabaseInit] 插入 crypto_addresses 数据失败:', insertError);
      return { status: 'warning', message: '表创建成功，但数据插入失败', error: insertError.message };
    }

    return { status: 'created', message: 'crypto_addresses 表创建成功，已插入 4 条初始数据' };
  } catch (error) {
    console.error('[DatabaseInit] 创建 crypto_addresses 表异常:', error);
    return { status: 'error', message: error instanceof Error ? error.message : '未知错误' };
  }
}

/**
 * 创建 deposit_requests 表
 */
async function createDepositRequestsTable() {
  try {
    // ✅ 使用 SQL 创建表
    const { error } = await supabase.rpc('execute_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS public.deposit_requests (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          type VARCHAR(50) NOT NULL CHECK (type IN ('crypto', 'bank', 'wire')),
          currency VARCHAR(50) NOT NULL,
          amount DECIMAL(30, 8) NOT NULL,
          tx_hash TEXT,
          proof_image TEXT,
          status VARCHAR(20) DEFAULT 'pending' NOT NULL CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')),
          remark TEXT,
          processed_by VARCHAR(100),
          processed_at TIMESTAMP WITH TIME ZONE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
        );

        -- 创建索引
        CREATE INDEX IF NOT EXISTS idx_deposit_requests_user_id ON deposit_requests(user_id);
        CREATE INDEX IF NOT EXISTS idx_deposit_requests_status ON deposit_requests(status);
        CREATE INDEX IF NOT EXISTS idx_deposit_requests_type ON deposit_requests(type);
        CREATE INDEX IF NOT EXISTS idx_deposit_requests_currency ON deposit_requests(currency);
        CREATE INDEX IF NOT EXISTS idx_deposit_requests_created_at ON deposit_requests(created_at DESC);
      `,
    });

    if (error) {
      console.error('[DatabaseInit] 创建 deposit_requests 表失败:', error);
      return { status: 'error', message: error.message };
    }

    // ✅ 插入初始数据
    const mockRequests = [
      { user_id: 1, type: 'crypto', currency: 'USDT', amount: 1000.00, tx_hash: '0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0', status: 'approved', remark: '用户充值申请' },
      { user_id: 1, type: 'crypto', currency: 'BTC', amount: 0.05, tx_hash: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh', status: 'pending', remark: '用户充值申请' },
    ];

    const { error: insertError } = await supabase.from('deposit_requests').insert(mockRequests).select();

    if (insertError) {
      console.error('[DatabaseInit] 插入 deposit_requests 数据失败:', insertError);
      return { status: 'warning', message: '表创建成功，但数据插入失败', error: insertError.message };
    }

    return { status: 'created', message: 'deposit_requests 表创建成功，已插入 2 条初始数据' };
  } catch (error) {
    console.error('[DatabaseInit] 创建 deposit_requests 表异常:', error);
    return { status: 'error', message: error instanceof Error ? error.message : '未知错误' };
  }
}

/**
 * 创建 demo_flash_contract_orders 表
 */
async function createDemoFlashContractOrdersTable() {
  try {
    const mockOrders = [
      {
        account: 'demo1@example.com',
        symbol: 'BTCUSD',
        type: '买入',
        status: '进行中',
        quantity: 1000,
        fee: 10,
        result: '无',
        profit: 0,
        open_price: 95000,
        close_price: null,
        duration: 60,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        account: 'demo2@example.com',
        symbol: 'ETHUSD',
        type: '卖出',
        status: '已完成',
        quantity: 500,
        fee: 5,
        result: '盈利',
        profit: 25,
        open_price: 3400,
        close_price: 3350,
        duration: 30,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ];

    const { error: insertError } = await supabase.from('demo_flash_contract_orders').insert(mockOrders).select();

    if (insertError) {
      console.error('[DatabaseInit] 插入 demo_flash_contract_orders 数据失败:', insertError);
      return { status: 'warning', message: '数据插入失败', error: insertError.message };
    }

    return { status: 'created', message: 'demo_flash_contract_orders 表创建成功，已插入 2 条初始数据' };
  } catch (error) {
    console.error('[DatabaseInit] 创建 demo_flash_contract_orders 表异常:', error);
    return { status: 'error', message: error instanceof Error ? error.message : '未知错误' };
  }
}

/**
 * 创建 demo_contract_orders 表
 */
async function createDemoContractOrdersTable() {
  try {
    const mockOrders = [
      {
        account: 'demo1@example.com',
        symbol: 'BTCUSD',
        type: '买入',
        direction: 'long',
        status: 'open',
        quantity: 1,
        open_price: 95000,
        leverage: 10,
        margin: 10000,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        account: 'demo2@example.com',
        symbol: 'ETHUSD',
        type: '卖出',
        direction: 'short',
        status: 'closed',
        quantity: 2,
        open_price: 3400,
        close_price: 3300,
        leverage: 5,
        margin: 1360,
        profit: 200,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ];

    const { error: insertError } = await supabase.from('demo_contract_orders').insert(mockOrders).select();

    if (insertError) {
      console.error('[DatabaseInit] 插入 demo_contract_orders 数据失败:', insertError);
      return { status: 'warning', message: '数据插入失败', error: insertError.message };
    }

    return { status: 'created', message: 'demo_contract_orders 表创建成功，已插入 2 条初始数据' };
  } catch (error) {
    console.error('[DatabaseInit] 创建 demo_contract_orders 表异常:', error);
    return { status: 'error', message: error instanceof Error ? error.message : '未知错误' };
  }
}

/**
 * 创建 project_orders 表
 */
async function createProjectOrdersTable() {
  try {
    const mockOrders = [
      {
        account: 'user1@example.com',
        symbol: 'BTCUSD',
        type: '市价单',
        side: 'buy',
        status: 'filled',
        quantity: 0.5,
        price: 95000,
        filled_quantity: 0.5,
        filled_price: 95000,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        account: 'user2@example.com',
        symbol: 'ETHUSD',
        type: '限价单',
        side: 'sell',
        status: 'pending',
        quantity: 1,
        price: 3500,
        filled_quantity: 0,
        filled_price: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ];

    const { error: insertError } = await supabase.from('project_orders').insert(mockOrders).select();

    if (insertError) {
      console.error('[DatabaseInit] 插入 project_orders 数据失败:', insertError);
      return { status: 'warning', message: '数据插入失败', error: insertError.message };
    }

    return { status: 'created', message: 'project_orders 表创建成功，已插入 2 条初始数据' };
  } catch (error) {
    console.error('[DatabaseInit] 创建 project_orders 表异常:', error);
    return { status: 'error', message: error instanceof Error ? error.message : '未知错误' };
  }
}
