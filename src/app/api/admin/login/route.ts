import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminLogin, generateAdminToken } from '@/lib/admin-auth';

/**
 * 管理员登录
 * 
 * 安全策略：
 * 1. 从数据库验证管理员凭据
 * 2. 使用签名 JWT（防伪造）
 * 3. 设置安全 Cookie
 */
export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    const admin = await verifyAdminLogin(email, password);

    if (!admin) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    // 生成签名 JWT
    const token = await generateAdminToken(admin);

    const isProduction = process.env.NODE_ENV === 'production';
    const isSecure = process.env.COZE_PROJECT_ENV === 'PROD';

    // 安全 Cookie 配置
    const response = NextResponse.json({
      success: true,
      admin: {
        id: admin.id,
        email: admin.email,
        username: admin.username,
      },
      token,
    });

    // 设置安全的 httpOnly Cookie
    response.cookies.set('admin_token', token, {
      httpOnly: true,                    // 防止 XSS 读取
      secure: isSecure,                   // 仅在 HTTPS 发送
      sameSite: 'strict',                // CSRF 防护
      maxAge: 86400 * 7,                 // 7 天
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('[Admin Login] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
