export interface AdminUser {
  id: number;
  email: string;
  username: string;
}

/**
 * 验证管理员登录
 */
export async function verifyAdminLogin(email: string, password: string): Promise<AdminUser | null> {
  // 从环境变量获取管理员账号
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@example.com';
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';

  // 检查是否是管理员账号
  if (email !== adminEmail) {
    return null;
  }

  // 验证密码
  if (password !== adminPassword) {
    return null;
  }

  // 返回管理员信息（不依赖数据库）
  return {
    id: 999999, // 特殊的管理员 ID
    email: adminEmail,
    username: 'Admin',
  };
}

/**
 * 生成管理员 token
 */
export function generateAdminToken(admin: AdminUser): string {
  const token = Buffer.from(JSON.stringify(admin)).toString('base64');
  return `admin_${token}`;
}

/**
 * 验证管理员 token
 */
export function verifyAdminToken(token: string): AdminUser | null {
  try {
    if (!token.startsWith('admin_')) {
      return null;
    }

    const data = JSON.parse(Buffer.from(token.slice(6), 'base64').toString());
    return data as AdminUser;
  } catch {
    return null;
  }
}
