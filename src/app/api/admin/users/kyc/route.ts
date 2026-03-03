import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { databaseService } from '@/lib/database-service';

// GET - 获取实名认证列表
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '15');
    const sort = searchParams.get('sort') || 'id';
    const order = searchParams.get('order') || 'desc';
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || 'all';

    // 从 applications 表获取所有实名认证申请
    let applications = await databaseService.getApplications({
      status: status !== 'all' ? (status as 'pending' | 'approved' | 'rejected') : undefined,
    });

    // 过滤只保留实名认证类型的申请
    let kycApplications = applications.filter(app => app.type === 'verification');

    // 搜索过滤
    if (search) {
      const searchLower = search.toLowerCase();
      kycApplications = kycApplications.filter(app =>
        (app.real_name && app.real_name.toLowerCase().includes(searchLower)) ||
        (app.id_card && app.id_card.toLowerCase().includes(searchLower))
      );
    }

    // 获取用户邮箱信息
    const userIds = kycApplications.map(app => app.user_id);
    const users = await Promise.all(
      userIds.map(async (userId) => {
        const user = await databaseService.getUserById(userId);
        return user;
      })
    );

    const userMap = new Map(
      users.filter((u): u is NonNullable<typeof u> => u !== null).map(u => [u.id, u.email])
    );

    // 格式化数据
    const formattedRequests = kycApplications.map(app => ({
      id: app.id,
      userId: app.user_id,
      email: userMap.get(app.user_id) || '—',
      realName: app.real_name || '—',
      idNumber: app.id_card || '—',
      applyTime: new Date(app.created_at).toLocaleString('zh-CN'),
      status: app.status,
      rejectReason: app.reject_reason || '',
      idCardFront: '', // 暂时不支持图片
      idCardBack: '', // 暂时不支持图片
    }));

    // 排序
    formattedRequests.sort((a, b) => {
      let valueA: any = a[sort as keyof typeof a];
      let valueB: any = b[sort as keyof typeof b];

      if (sort === 'id') {
        valueA = parseInt(valueA as string);
        valueB = parseInt(valueB as string);
      }

      if (order === 'asc') {
        return valueA > valueB ? 1 : -1;
      } else {
        return valueA < valueB ? 1 : -1;
      }
    });

    // 分页
    const offset = (page - 1) * limit;
    const paginatedRequests = formattedRequests.slice(offset, offset + limit);

    return NextResponse.json({
      success: true,
      requests: paginatedRequests,
      total: formattedRequests.length,
      page,
      limit,
    });
  } catch (error) {
    console.error('Failed to fetch KYC requests:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch KYC requests',
      },
      { status: 500 }
    );
  }
}
