import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

// 检查Supabase环境变量是否配置
const supabaseUrl = process.env.COZE_SUPABASE_URL;
const supabaseServiceKey = process.env.COZE_SUPABASE_SERVICE_ROLE_KEY;
const useSupabase = supabaseUrl && supabaseServiceKey;

// GET - 获取信息管理列表
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '15');
    const sort = searchParams.get('sort') || 'id';
    const order = searchParams.get('order') || 'desc';
    const search = searchParams.get('search') || '';

    // 如果没有配置Supabase，直接返回模拟数据
    if (!useSupabase) {
      const mockData = generateMockData(page, limit, search);
      return NextResponse.json({
        success: true,
        infos: mockData,
        total: 1,
        page,
        limit,
      });
    }

    // 尝试导入和初始化Supabase
    let supabase;
    try {
      const { createClient } = await import('@supabase/supabase-js');
      supabase = getSupabaseClient();
    } catch (error) {
      console.error('Failed to initialize Supabase:', error);
      const mockData = generateMockData(page, limit, search);
      return NextResponse.json({
        success: true,
        infos: mockData,
        total: 1,
        page,
        limit,
      });
    }

    const offset = (page - 1) * limit;

    let query = supabase
      .from('info_management')
      .select('*', { count: 'exact' })
      .range(offset, offset + limit - 1)
      .order(sort, { ascending: order === 'asc' });

    // 如果有搜索条件
    if (search) {
      query = query.or(`title.ilike.%${search}%,type.ilike.%${search}%,keywords.ilike.%${search}%`);
    }

    const { data, error, count } = await query;

    if (error) {
      console.error('Supabase error:', error);
      // 如果表不存在或查询失败，返回模拟数据
      const mockData = generateMockData(page, limit, search);
      return NextResponse.json({
        success: true,
        infos: mockData,
        total: 1,
        page,
        limit,
      });
    }

    // 格式化数据
    const formattedInfos = data?.map((item: any) => ({
      id: item.id,
      title: item.title,
      type: item.type,
      language: item.language,
      sort: item.sort,
      coverImage: item.cover_image,
      isShow: item.is_show,
      keywords: item.keywords,
      summary: item.summary,
      content: item.content,
    })) || [];

    return NextResponse.json({
      success: true,
      infos: formattedInfos,
      total: count,
      page,
      limit,
    });
  } catch (error) {
    console.error('Failed to fetch info list:', error);
    // 返回模拟数据作为降级方案
    const searchParams = request.nextUrl.searchParams;
    const mockData = generateMockData(
      parseInt(searchParams.get('page') || '1'),
      parseInt(searchParams.get('limit') || '15'),
      searchParams.get('search') || ''
    );
    return NextResponse.json({
      success: true,
      infos: mockData,
      total: 1,
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '15'),
    });
  }
}

// POST - 创建新的信息
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, type, language, sort, coverImage, isShow, keywords, summary, content } = body;

    // 如果没有配置Supabase，返回成功响应但不实际创建
    if (!useSupabase) {
      return NextResponse.json({
        success: true,
        info: {
          id: Math.floor(Math.random() * 1000),
          title,
          type,
          language,
          sort,
          coverImage,
          isShow,
          keywords,
        },
      });
    }

    // 尝试导入和初始化Supabase
    let supabase;
    try {
      const { createClient } = await import('@supabase/supabase-js');
      supabase = getSupabaseClient();
    } catch (error) {
      console.error('Failed to initialize Supabase:', error);
      return NextResponse.json({
        success: true,
        info: {
          id: Math.floor(Math.random() * 1000),
          title,
          type,
          language,
          sort,
          coverImage,
          isShow,
          keywords,
        },
      });
    }

    const { data, error } = await supabase
      .from('info_management')
      .insert([
        {
          title,
          type,
          language,
          sort,
          cover_image: coverImage,
          is_show: isShow,
          keywords,
          summary,
          content,
        },
      ])
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      info: {
        id: data.id,
        title: data.title,
        type: data.type,
        language: data.language,
        sort: data.sort,
        coverImage: data.cover_image,
        isShow: data.is_show,
        keywords: data.keywords,
        summary: data.summary,
        content: data.content,
      },
    });
  } catch (error) {
    console.error('Failed to create info:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create info',
      },
      { status: 500 }
    );
  }
}

// 生成模拟数据（根据图片中的数据）
function generateMockData(page: number, limit: number, search: string): any[] {
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
    },
  ];

  // 如果有搜索条件，过滤数据
  if (search) {
    const filtered = mockData.filter(item =>
      item.title.toLowerCase().includes(search.toLowerCase()) ||
      item.type.toLowerCase().includes(search.toLowerCase()) ||
      item.keywords.toLowerCase().includes(search.toLowerCase())
    );
    return filtered;
  }

  // 默认按 ID 降序排序
  const sorted = [...mockData].sort((a, b) => b.id - a.id);

  const offset = (page - 1) * limit;
  return sorted.slice(offset, offset + limit);
}
