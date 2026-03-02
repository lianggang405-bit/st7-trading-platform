import { NextResponse } from 'next/server';

// GET - 获取角色列表
export async function GET() {
  try {
    // 返回模拟数据
    const roles = [
      {
        id: 1,
        name: '超级管理员',
        description: '拥有系统的所有权限',
        permissions: ['user:read', 'user:write', 'user:delete', 'trade:read', 'trade:write', 'admin:read', 'admin:write', 'admin:delete'],
        createdAt: '2026-01-01 00:00:00',
      },
      {
        id: 2,
        name: '操作员',
        description: '拥有基本的操作权限',
        permissions: ['user:read', 'trade:read', 'trade:write'],
        createdAt: '2026-01-15 00:00:00',
      },
      {
        id: 3,
        name: '客服',
        description: '拥有客服相关权限',
        permissions: ['user:read', 'trade:read'],
        createdAt: '2026-02-01 00:00:00',
      },
    ];

    return NextResponse.json({
      success: true,
      roles,
    });
  } catch (error) {
    console.error('Error in GET /api/admin/admin/roles:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
