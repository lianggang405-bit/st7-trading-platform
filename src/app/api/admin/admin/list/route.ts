import { NextResponse } from 'next/server';

// GET - 获取管理员列表
export async function GET() {
  try {
    // 返回模拟数据
    const admins = [
      {
        id: 1,
        username: 'admin',
        email: 'admin@admin.com',
        roleName: '超级管理员',
        status: 'active' as const,
        lastLogin: '2026-02-24 22:00:00',
        createdAt: '2026-01-01 00:00:00',
      },
      {
        id: 2,
        username: 'operator',
        email: 'operator@admin.com',
        roleName: '操作员',
        status: 'active' as const,
        lastLogin: '2026-02-24 21:00:00',
        createdAt: '2026-01-15 00:00:00',
      },
    ];

    return NextResponse.json({
      success: true,
      admins,
    });
  } catch (error) {
    console.error('Error in GET /api/admin/admin/list:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
