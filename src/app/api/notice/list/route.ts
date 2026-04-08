import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

// 检查Supabase环境变量是否配置
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.COZE_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.COZE_SUPABASE_ANON_KEY;
const useSupabase = supabaseUrl && supabaseAnonKey;

// 备用公告数据（当数据库不可用时使用）
const mockNotices = [
  {
    id: 1,
    title: '平台服务升级公告',
    type: 'notice',
    language: 'zh-CN',
    sort: 1,
    coverImage: '',
    isShow: true,
    keywords: '升级,维护',
    created_at: new Date().toISOString(),
    summary: '平台将于本周进行服务升级，届时部分功能可能暂时不可用。',
    content: '平台将于本周进行服务升级，届时部分功能可能暂时不可用。敬请谅解！',
  },
  {
    id: 2,
    title: '新功能上线通知',
    type: 'notice',
    language: 'zh-CN',
    sort: 2,
    coverImage: '',
    isShow: true,
    keywords: '新功能,上线',
    created_at: new Date(Date.now() - 86400000).toISOString(),
    summary: '我们很高兴地宣布，平台新增多项功能，欢迎体验！',
    content: '我们很高兴地宣布，平台新增多项功能，欢迎体验！',
  },
  {
    id: 3,
    title: '交易规则调整通知',
    type: 'notice',
    language: 'zh-CN',
    sort: 3,
    coverImage: '',
    isShow: true,
    keywords: '规则,调整',
    created_at: new Date(Date.now() - 172800000).toISOString(),
    summary: '为更好地服务用户，平台对部分交易规则进行了优化调整。',
    content: '为更好地服务用户，平台对部分交易规则进行了优化调整。',
  },
];

// GET - 获取公告列表（仅返回展示的公告）
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const type = searchParams.get('type') || '';
    const language = searchParams.get('language') || '';

    // 如果没有配置Supabase，返回备用数据
    if (!useSupabase) {
      console.log('[Notice API] Using mock data (database not configured)');
      return NextResponse.json({
        success: true,
        notices: mockNotices,
        total: mockNotices.length,
        page,
        limit,
        isMockData: true,
      });
    }

    // 尝试初始化Supabase
    let supabase;
    try {
      supabase = getSupabaseClient();
    } catch (error) {
      console.error('[Notice API] Failed to initialize Supabase:', error);
      // 返回备用数据而不是错误
      console.log('[Notice API] Using mock data (Supabase init failed)');
      return NextResponse.json({
        success: true,
        notices: mockNotices,
        total: mockNotices.length,
        page,
        limit,
        isMockData: true,
      });
    }

    const offset = (page - 1) * limit;

    let query = supabase
      .from('info_management')
      .select('*', { count: 'exact' })
      .eq('is_show', true)
      .order('sort', { ascending: true })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // 如果有类型筛选
    if (type) {
      query = query.eq('type', type);
    }

    // 如果有语言筛选
    if (language) {
      query = query.eq('language', language);
    }

    const { data, error, count } = await query;

    // 如果数据库查询失败，返回备用数据
    if (error) {
      console.error('[Notice API] Supabase error:', error);
      console.log('[Notice API] Using mock data (query failed)');
      return NextResponse.json({
        success: true,
        notices: mockNotices,
        total: mockNotices.length,
        page,
        limit,
        isMockData: true,
      });
    }

    // 添加详细日志
    console.log('[Notice API] Count:', count);
    console.log('[Notice API] Data items count:', data?.length || 0);
    data?.forEach((item: any, index: number) => {
      console.log(`[Notice API] Item ${index}: id=${item.id}, title=${item.title}, is_show=${item.is_show}`);
    });

    // 格式化数据
    const formattedNotices = data?.map((item: any) => ({
      id: item.id,
      title: item.title,
      type: item.type,
      language: item.language,
      sort: item.sort,
      coverImage: item.cover_image,
      isShow: item.is_show,
      keywords: item.keywords,
      created_at: item.created_at,
      summary: item.summary,
      content: item.content,
    })) || [];

    return NextResponse.json({
      success: true,
      notices: formattedNotices,
      total: count,
      page,
      limit,
    });
  } catch (error) {
    console.error('[Notice API] Failed to fetch notice list:', error);
    // 发生异常时也返回备用数据
    console.log('[Notice API] Using mock data (exception caught)');
    return NextResponse.json({
      success: true,
      notices: mockNotices,
      total: mockNotices.length,
      page: 1,
      limit: 20,
      isMockData: true,
    });
  }
}
