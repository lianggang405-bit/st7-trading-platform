import { NextRequest, NextResponse } from 'next/server';
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

    // 从 kyc_requests 表获取所有实名认证申请
    let kycRequests = await databaseService.getKYCRequests({
      status: status !== 'all' ? (status as 'pending' | 'approved' | 'rejected') : undefined,
    });

    // 搜索过滤
    if (search) {
      const searchLower = search.toLowerCase();
      kycRequests = kycRequests.filter(req =>
        (req.real_name && req.real_name.toLowerCase().includes(searchLower)) ||
        (req.id_number && req.id_number.toLowerCase().includes(searchLower))
      );
    }

    // 获取用户邮箱信息
    const userIds = kycRequests.map(req => req.user_id);
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
    const formattedRequests = kycRequests.map(req => ({
      id: req.id,
      userId: req.user_id,
      email: userMap.get(req.user_id) || '—',
      realName: req.real_name || '—',
      idNumber: req.id_number || '—',
      applyTime: new Date(req.created_at).toLocaleString('zh-CN'),
      status: req.status,
      rejectReason: req.reject_reason || '',
      idCardFront: req.id_card_front_url || '', // 返回证件照正面
      idCardBack: req.id_card_back_url || '',   // 返回证件照反面
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
