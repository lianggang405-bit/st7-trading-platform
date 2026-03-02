import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminLogin, generateAdminToken } from '@/lib/admin-auth';

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

    const token = generateAdminToken(admin);

    // 返回 token，客户端需要存储到 localStorage
    const response = NextResponse.json({
      success: true,
      admin,
      token,
    });

    // 也设置 cookie 作为备选方案（不使用 httpOnly，方便调试）
    response.cookies.set('admin_token', token, {
      httpOnly: false,
      secure: false, // 部署环境可能需要 true
      sameSite: 'lax',
      maxAge: 86400 * 7, // 7 days
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('[Admin Login] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
