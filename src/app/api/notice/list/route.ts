import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

// 检查Supabase环境变量是否配置
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const useSupabase = supabaseUrl && supabaseAnonKey;

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
  // 注意：这只是fallback数据，实际生产环境应该使用真实数据库数据
  // 如果使用mock数据，请确保与数据库中的数据一致
  const mockData = [
    {
      id: 9,
      title: '特别公告',
      type: '公告',
      language: '中文繁体',
      sort: 1,
      coverImage: '',
      isShow: true,
      keywords: '公告',
      summary: '特别强调！！',
      content: '由於政策原因，不向朝鮮，以色列，中國，瓦努阿圖，古巴提供服務。',
      created_at: '2026-03-05T13:15:23.90018+00:00',
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
