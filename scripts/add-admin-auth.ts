/**
 * 批量更新管理员 API 添加鉴权
 * 使用方法: npx tsx scripts/add-admin-auth.ts
 */

import * as fs from 'fs';
import * as path from 'path';

const ADMIN_API_DIR = path.join(process.cwd(), 'src/app/api/admin');

// 需要跳过的路由（公共路由）
const SKIP_ROUTES = ['login'];

// 需要跳过的目录（调试接口）
const SKIP_DIRS = ['debug'];

function shouldSkip(filePath: string): boolean {
  const relative = path.relative(ADMIN_API_DIR, filePath);
  const parts = relative.split(path.sep);
  
  // 跳过 login 路由
  if (parts.includes('login')) return true;
  
  // 跳过 debug 目录
  for (const dir of SKIP_DIRS) {
    if (parts.includes(dir)) return true;
  }
  
  return false;
}

function processFile(filePath: string): void {
  if (shouldSkip(filePath)) {
    console.log(`Skipping: ${filePath}`);
    return;
  }

  let content = fs.readFileSync(filePath, 'utf-8');
  
  // 检查是否已经有 withAdminAuth
  if (content.includes('withAdminAuth')) {
    console.log(`Already has auth: ${filePath}`);
    return;
  }

  // 检查是否是 POST/GET/PUT/DELETE 处理函数
  const hasExport = content.includes('export async function POST') ||
                    content.includes('export async function GET') ||
                    content.includes('export async function PUT') ||
                    content.includes('export async function DELETE') ||
                    content.includes('export const POST') ||
                    content.includes('export const GET') ||
                    content.includes('export const PUT') ||
                    content.includes('export const DELETE');

  if (!hasExport) {
    console.log(`No handler found: ${filePath}`);
    return;
  }

  // 添加导入
  if (!content.includes("import { withAdminAuth }")) {
    content = content.replace(
      /import {([^}]+)} from '@\/lib\/admin-guard';/,
      "import { withAdminAuth, type AuthenticatedAdmin } from '@/lib/admin-guard';"
    );
    if (!content.includes("import { withAdminAuth }")) {
      // 在现有的 import 语句后添加
      content = content.replace(
        /import (?:{[^}]+} )?from '@\/lib\//,
        "import { withAdminAuth, type AuthenticatedAdmin } from '@/lib/admin-guard';\nimport $&"
      );
    }
  }

  // 替换 export async function GET -> withAdminAuth wrapper
  content = content.replace(
    /export async function GET\(([^)]*)\)\s*{/g,
    'export const GET = withAdminAuth(async ($1: NextRequest, _admin: AuthenticatedAdmin) => {'
  );

  content = content.replace(
    /export async function POST\(([^)]*)\)\s*{/g,
    'export const POST = withAdminAuth(async ($1: NextRequest, _admin: AuthenticatedAdmin) => {'
  );

  content = content.replace(
    /export async function PUT\(([^)]*)\)\s*{/g,
    'export const PUT = withAdminAuth(async ($1: NextRequest, _admin: AuthenticatedAdmin) => {'
  );

  content = content.replace(
    /export async function DELETE\(([^)]*)\)\s*{/g,
    'export const DELETE = withAdminAuth(async ($1: NextRequest, _admin: AuthenticatedAdmin) => {'
  );

  // 添加 NextRequest 导入（如果没有）
  if (!content.includes('import { NextRequest')) {
    content = content.replace(
      /import { NextResponse/,
      "import { NextRequest, NextResponse"
    );
  }

  fs.writeFileSync(filePath, content);
  console.log(`Updated: ${filePath}`);
}

function walkDir(dir: string): void {
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      walkDir(filePath);
    } else if (file === 'route.ts') {
      processFile(filePath);
    }
  }
}

// 执行
walkDir(ADMIN_API_DIR);
console.log('Done!');
