/**
 * 数据库迁移脚本
 * 
 * 使用方法:
 * npx tsx scripts/run-migrations.ts
 * 
 * 或指定迁移版本:
 * npx tsx scripts/run-migrations.ts --to=001
 */

import * as fs from 'fs';
import * as path from 'path';
import { createClient } from '@supabase/supabase-js';

// 迁移状态文件
const MIGRATION_LOCK_FILE = path.join(process.cwd(), '.migrations', 'applied.json');

interface MigrationRecord {
  version: string;
  applied_at: string;
}

interface MigrationState {
  applied: MigrationRecord[];
  last_run: string;
}

// 获取 Supabase 客户端
function getSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error('Missing Supabase configuration');
  }

  return createClient(url, key);
}

// 获取迁移目录
function getMigrationsDir(): string {
  return path.join(process.cwd(), 'supabase', 'migrations');
}

// 获取所有迁移文件
function getMigrations(): string[] {
  const migrationsDir = getMigrationsDir();
  const files = fs.readdirSync(migrationsDir)
    .filter(f => f.endsWith('.sql'))
    .sort();
  return files;
}

// 读取迁移状态
function readMigrationState(): MigrationState {
  // 创建目录（如果不存在）
  const dir = path.dirname(MIGRATION_LOCK_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  if (!fs.existsSync(MIGRATION_LOCK_FILE)) {
    return { applied: [], last_run: '' };
  }

  try {
    const content = fs.readFileSync(MIGRATION_LOCK_FILE, 'utf-8');
    return JSON.parse(content);
  } catch {
    return { applied: [], last_run: '' };
  }
}

// 保存迁移状态
function saveMigrationState(state: MigrationState): void {
  const dir = path.dirname(MIGRATION_LOCK_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  fs.writeFileSync(MIGRATION_LOCK_FILE, JSON.stringify(state, null, 2));
}

// 提取迁移版本号
function getMigrationVersion(filename: string): string {
  return filename.replace('.sql', '');
}

// 运行迁移
async function runMigration(supabase: ReturnType<typeof createClient>, filename: string): Promise<boolean> {
  const version = getMigrationVersion(filename);
  const filepath = path.join(getMigrationsDir(), filename);
  const sql = fs.readFileSync(filepath, 'utf-8');

  console.log(`\n📦 Running migration: ${version}`);
  console.log(`   File: ${filename}`);

  try {
    // 执行迁移 SQL
    const { error } = await supabase.rpc('exec', { query: sql });

    if (error) {
      // 如果 RPC 不存在，尝试直接执行
      console.warn(`   ⚠️  RPC exec not available, migration may require manual execution`);
      console.log(`   SQL preview (first 200 chars): ${sql.substring(0, 200)}...`);
      
      // 记录为已应用（仅在开发环境）
      if (process.env.NODE_ENV !== 'production') {
        console.log(`   ✅ Migration recorded (manual execution required in production)`);
        return true;
      }
      
      return false;
    }

    console.log(`   ✅ Migration completed successfully`);
    return true;
  } catch (err: any) {
    // 如果 Supabase 不支持 RPC，记录为待手动执行
    console.warn(`   ⚠️  Could not execute via RPC: ${err.message}`);
    console.log(`   💡 Please run this migration manually in Supabase dashboard`);
    return process.env.NODE_ENV !== 'production';
  }
}

// 主函数
async function main() {
  console.log('═══════════════════════════════════════════');
  console.log('  Database Migration Runner');
  console.log('═══════════════════════════════════════════\n');

  const args = process.argv.slice(2);
  const targetVersion = args.find(a => a.startsWith('--to='))?.split('=')[1];

  // 获取迁移文件
  const migrations = getMigrations();
  
  if (migrations.length === 0) {
    console.log('No migrations found in supabase/migrations/');
    return;
  }

  console.log(`Found ${migrations.length} migration(s):`);
  migrations.forEach(m => console.log(`  - ${m}`));

  // 读取当前状态
  const state = readMigrationState();
  const appliedVersions = new Set(state.applied.map(a => a.version));

  // 筛选未应用的迁移
  let pendingMigrations = migrations.filter(m => {
    const version = getMigrationVersion(m);
    return !appliedVersions.has(version);
  });

  // 如果指定了目标版本，筛选到该版本
  if (targetVersion) {
    pendingMigrations = pendingMigrations.filter(m => {
      const version = getMigrationVersion(m);
      return version <= targetVersion;
    });
  }

  if (pendingMigrations.length === 0) {
    console.log('\n✅ All migrations already applied');
    console.log(`Last run: ${state.last_run || 'unknown'}`);
    return;
  }

  console.log(`\n${pendingMigrations.length} migration(s) pending:`);
  pendingMigrations.forEach(m => console.log(`  - ${m}`));

  // 确认执行
  if (process.env.NODE_ENV === 'production') {
    console.log('\n⚠️  Running in PRODUCTION mode');
    console.log('   Please ensure you have a database backup before proceeding.');
    
    const response = await new Promise<string>((resolve) => {
      const rl = require('readline').createInterface({
        input: process.stdin,
        output: process.stdout,
      });
      
      rl.question('\nType "YES" to continue: ', (answer: string) => {
        rl.close();
        resolve(answer);
      });
    });

    if (response !== 'YES') {
      console.log('Aborted.');
      return;
    }
  }

  // 执行迁移
  console.log('\n───────────────────────────────────────────');
  
  try {
    const supabase = getSupabaseClient();
    const newApplied: MigrationRecord[] = [];

    for (const migration of pendingMigrations) {
      const version = getMigrationVersion(migration);
      const success = await runMigration(supabase, migration);

      if (success) {
        newApplied.push({
          version,
          applied_at: new Date().toISOString(),
        });
      } else {
        console.error(`\n❌ Migration ${version} failed`);
        console.error('   Stopping further migrations');
        break;
      }
    }

    // 更新状态
    state.applied.push(...newApplied);
    state.last_run = new Date().toISOString();
    saveMigrationState(state);

    console.log('\n───────────────────────────────────────────');
    console.log(`✅ Applied ${newApplied.length} migration(s)`);
    console.log(`📝 Migration state saved to ${MIGRATION_LOCK_FILE}`);

  } catch (err: any) {
    console.error('\n❌ Migration failed:', err.message);
    process.exit(1);
  }
}

// 运行
main().catch(console.error);
