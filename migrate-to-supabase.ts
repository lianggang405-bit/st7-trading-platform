/**
 * 数据迁移脚本 - 从文件系统迁移到 Supabase
 */

import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcrypt';

// 手动加载环境变量
const envPath = path.join(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  envContent.split('\n').forEach((line) => {
    const [key, value] = line.split('=');
    if (key && value && !process.env[key]) {
      process.env[key] = value.trim();
    }
  });
  console.log('[Migration] Environment variables loaded');
}

// 创建 Supabase 客户端
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  console.error('[Migration] ❌ Supabase credentials not found in environment');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);
console.log('[Migration] Supabase client created');

// 数据存储路径
const DATA_DIR = path.join(process.cwd(), 'data');
const ACCOUNTS_FILE = path.join(DATA_DIR, 'demo-accounts.json');
const NEXT_ID_FILE = path.join(DATA_DIR, 'demo-next-id.txt');

interface DemoAccount {
  id: string;
  email: string;
  password: string;
  status: 'normal' | 'disabled' | 'frozen';
  createdAt: string;
  lastLoginAt: string | null;
  balance: number;
  accountType: 'demo' | 'real';
  userType: string;
  userLevel: string;
  inviteCode: string;
  remark: string;
}

/**
 * 读取文件系统中的账户数据
 */
function readAccountsFromFile(): DemoAccount[] {
  if (!fs.existsSync(ACCOUNTS_FILE)) {
    console.log('[Migration] No demo accounts file found');
    return [];
  }

  try {
    const data = fs.readFileSync(ACCOUNTS_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('[Migration] Failed to read accounts file:', error);
    return [];
  }
}

/**
 * 读取下一个 ID
 */
function readNextIdFromFile(): number {
  if (!fs.existsSync(NEXT_ID_FILE)) {
    return 600151;
  }

  try {
    const data = fs.readFileSync(NEXT_ID_FILE, 'utf-8');
    return parseInt(data, 10);
  } catch (error) {
    console.error('[Migration] Failed to read next ID file:', error);
    return 600151;
  }
}

/**
 * 迁移账户到 Supabase
 */
async function migrateAccountToSupabase(account: DemoAccount) {
  // 检查邮箱是否存在
  const { data: existingUser } = await supabase
    .from('users')
    .select('id')
    .eq('email', account.email)
    .single();

  if (existingUser) {
    console.log(`[Migration] ⚠️  User already exists: ${account.email}`);
    return { success: false, reason: 'Email already exists' };
  }

  // 加密密码
  const passwordHash = await bcrypt.hash(account.password, 10);

  // 映射状态
  const statusMap: Record<string, string> = {
    normal: '正常',
    disabled: '禁用',
    frozen: '冻结',
  };

  // 插入用户
  const { data, error } = await supabase
    .from('users')
    .insert({
      id: parseInt(account.id),
      email: account.email,
      password_hash: passwordHash,
      username: account.email.split('@')[0],
      account_type: account.accountType,
      balance: account.balance.toString(),
      credit_score: 100,
      is_verified: false,
      user_level: account.userLevel,
      status: statusMap[account.status] || '正常',
      is_demo: account.accountType === 'demo',
      is_active: account.status === 'normal',
      remark: account.remark,
      invite_code: account.inviteCode || null,
      created_at: account.createdAt,
      updated_at: account.createdAt,
      last_login_at: account.lastLoginAt,
    })
    .select()
    .single();

  if (error) {
    console.error(`[Migration] ❌ Failed to migrate ${account.email}:`, error);
    return { success: false, error };
  }

  console.log(`[Migration] ✅ Migrated user: ${data.email} (ID: ${data.id})`);
  return { success: true, data };
}

/**
 * 主迁移函数
 */
async function migrate() {
  console.log('[Migration] ========================================');
  console.log('[Migration] Starting migration from file system to Supabase');
  console.log('[Migration] ========================================');

  // 读取文件系统数据
  const accounts = readAccountsFromFile();

  if (accounts.length === 0) {
    console.log('[Migration] No accounts to migrate');
    return;
  }

  console.log(`[Migration] Found ${accounts.length} accounts to migrate`);

  let successCount = 0;
  let failCount = 0;

  // 迁移每个账户
  for (const account of accounts) {
    const result = await migrateAccountToSupabase(account);
    if (result.success) {
      successCount++;
    } else {
      failCount++;
    }
  }

  console.log('[Migration] ========================================');
  console.log(`[Migration] Migration complete: ${successCount} success, ${failCount} failed`);
  console.log('[Migration] ========================================');

  // 备份原始数据（重命名文件）
  if (successCount > 0) {
    const backupFile = path.join(DATA_DIR, `demo-accounts.json.backup.${Date.now()}`);
    try {
      fs.copyFileSync(ACCOUNTS_FILE, backupFile);
      console.log(`[Migration] Backup saved to: ${backupFile}`);
    } catch (error) {
      console.error('[Migration] Failed to create backup:', error);
    }
  }
}

// 运行迁移
migrate().catch((error) => {
  console.error('[Migration] Fatal error:', error);
  process.exit(1);
});
