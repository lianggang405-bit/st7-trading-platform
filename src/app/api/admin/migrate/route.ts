import { NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import bcrypt from 'bcrypt';
import fs from 'fs';
import path from 'path';

// 数据存储路径
const DATA_DIR = path.join(process.cwd(), 'data');
const ACCOUNTS_FILE = path.join(DATA_DIR, 'demo-accounts.json');

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

// POST - 执行数据迁移
export async function POST() {
  try {
    // 读取文件系统数据
    if (!fs.existsSync(ACCOUNTS_FILE)) {
      return NextResponse.json({
        success: true,
        message: 'No accounts to migrate',
        migrated: 0,
        failed: 0,
      });
    }

    const accounts: DemoAccount[] = JSON.parse(fs.readFileSync(ACCOUNTS_FILE, 'utf-8'));

    if (accounts.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No accounts to migrate',
        migrated: 0,
        failed: 0,
      });
    }

    const client = getSupabaseClient();
    const results: any[] = [];
    let successCount = 0;
    let failCount = 0;

    for (const account of accounts) {
      try {
        // 检查邮箱是否已存在
        const { data: existingUser } = await client
          .from('users')
          .select('id')
          .eq('email', account.email)
          .single();

        if (existingUser) {
          results.push({
            email: account.email,
            success: false,
            reason: 'Email already exists',
          });
          failCount++;
          continue;
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
        const { data, error } = await client
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
          results.push({
            email: account.email,
            success: false,
            error: error.message,
          });
          failCount++;
        } else {
          results.push({
            email: account.email,
            success: true,
            userId: data.id,
          });
          successCount++;
        }
      } catch (error: any) {
        results.push({
          email: account.email,
          success: false,
          error: error.message,
        });
        failCount++;
      }
    }

    return NextResponse.json({
      success: true,
      message: `Migration complete: ${successCount} success, ${failCount} failed`,
      migrated: successCount,
      failed: failCount,
      results,
    });
  } catch (error: any) {
    console.error('[Migrate API] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 }
    );
  }
}
