import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
const supabase = getSupabaseClient();
// GET /api/admin/wallet/user-wallets - 获取用户钱包列表
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '15');
    const sort = searchParams.get('sort') || 'id';
    const order = searchParams.get('order') || 'desc';
    const search = searchParams.get('search') || '';

    const offset = (page - 1) * limit;

    // 构建查询 - 从 users 表获取用户钱包信息
    let query = supabase
      .from('users')
      .select('id, email, balance, account_type', { count: 'exact' });

    // 搜索条件 - 搜索邮箱或ID
    if (search) {
      // 检查是否是数字，如果是则搜索ID，否则搜索邮箱
      const isNumeric = /^\d+$/.test(search);
      if (isNumeric) {
        query = query.eq('id', parseInt(search));
      } else {
        query = query.ilike('email', `%${search}%`);
      }
    }

    // 排序
    query = query.order(sort, { ascending: order === 'asc' });

    // 分页
    query = query.range(offset, offset + limit - 1);

    const { data: users, error, count } = await query;

    if (error) {
      console.error('Failed to fetch user wallets:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    // 转换数据格式以匹配前端期望
    const wallets = users?.map(user => ({
      id: user.id,
      account: user.email,
      currency: 'USDT',
      balance: user.balance || 0,
      lockedBalance: 0, // users 表中没有 locked_balance 字段，暂时设为 0
    })) || [];

    return NextResponse.json({
      success: true,
      wallets,
      total: count || 0,
      page,
      pageSize: limit
    });
  } catch (error) {
    console.error('Error in GET user wallets:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
