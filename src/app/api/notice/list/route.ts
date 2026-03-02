import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

// 检查Supabase环境变量是否配置
const supabaseUrl = process.env.COZE_SUPABASE_URL;
const supabaseServiceKey = process.env.COZE_SUPABASE_SERVICE_ROLE_KEY;
const useSupabase = supabaseUrl && supabaseServiceKey;

// GET - 获取公告列表（仅返回展示的公告）
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const type = searchParams.get('type') || '';
    const language = searchParams.get('language') || '';

    // 如果没有配置Supabase，返回模拟数据
    if (!useSupabase) {
      const mockData = generateMockData(page, limit, type, language);
      return NextResponse.json({
        success: true,
        notices: mockData,
        total: 1,
        page,
        limit,
      });
    }

    // 尝试初始化Supabase
    let supabase;
    try {
      supabase = getSupabaseClient();
    } catch (error) {
      console.error('Failed to initialize Supabase:', error);
      const mockData = generateMockData(page, limit, type, language);
      return NextResponse.json({
        success: true,
        notices: mockData,
        total: 1,
        page,
        limit,
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

    if (error) {
      console.error('Supabase error:', error);
      const mockData = generateMockData(page, limit, type, language);
      return NextResponse.json({
        success: true,
        notices: mockData,
        total: 1,
        page,
        limit,
      });
    }

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
    console.error('Failed to fetch notice list:', error);
    // 返回模拟数据作为降级方案
    const searchParams = request.nextUrl.searchParams;
    const mockData = generateMockData(
      parseInt(searchParams.get('page') || '1'),
      parseInt(searchParams.get('limit') || '20'),
      searchParams.get('type') || '',
      searchParams.get('language') || ''
    );
    return NextResponse.json({
      success: true,
      notices: mockData,
      total: 1,
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '20'),
    });
  }
}

// 生成模拟数据
function generateMockData(page: number, limit: number, type: string, language: string): any[] {
  const mockData = [
    {
      id: 8,
      title: '公告',
      type: '公告',
      language: '中文简体',
      sort: 1,
      coverImage: '/images/info-cover-8.jpg',
      isShow: true,
      keywords: '公告',
      created_at: '2024-02-01T10:00:00Z',
    },
  ];

  // 如果有类型筛选，过滤数据
  if (type) {
    const filtered = mockData.filter(item => item.type === type);
    return filtered;
  }

  // 如果有语言筛选，过滤数据
  if (language) {
    const filtered = mockData.filter(item => item.language === language);
    return filtered;
  }

  const offset = (page - 1) * limit;
  return mockData.slice(offset, offset + limit);
}
