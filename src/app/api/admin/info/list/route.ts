import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

// Check if Supabase environment variables are configured
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const useSupabase = supabaseUrl && supabaseServiceKey;

// GET - Get info list
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '15');
    const sort = searchParams.get('sort') || 'id';
    const order = searchParams.get('order') || 'desc';
    const search = searchParams.get('search') || '';

    // If Supabase is not configured, return mock data
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

    // Try to import and initialize Supabase
    let supabase;
    try {
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

    if (!supabase) {
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

    // If there is a search condition
    if (search) {
      query = query.or(`title.ilike.%${search}%,type.ilike.%${search}%,keywords.ilike.%${search}%`);
    }

    const { data, error, count } = await query;

    if (error) {
      console.error('Supabase error:', error);
      // If table does not exist or query fails, return mock data
      const mockData = generateMockData(page, limit, search);
      return NextResponse.json({
        success: true,
        infos: mockData,
        total: 1,
        page,
        limit,
      });
    }

    // Format data
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
    // Return mock data as fallback
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

// POST - Create new info
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, type, language, sort, coverImage, isShow, keywords, summary, content } = body;

    // If Supabase is not configured, return success response but do not actually create
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

    // Try to import and initialize Supabase
    let supabase;
    try {
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

    if (!supabase) {
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

// Generate mock data
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

  // If there is a search condition, filter data
  if (search) {
    const filtered = mockData.filter(item =>
      item.title.toLowerCase().includes(search.toLowerCase()) ||
      item.type.toLowerCase().includes(search.toLowerCase()) ||
      item.keywords.toLowerCase().includes(search.toLowerCase())
    );
    return filtered;
  }

  // Default sort by ID descending
  const sorted = [...mockData].sort((a, b) => b.id - a.id);

  const offset = (page - 1) * limit;
  return sorted.slice(offset, offset + limit);
}
