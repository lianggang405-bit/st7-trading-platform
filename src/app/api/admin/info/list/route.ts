import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

// Check if Supabase environment variables are configured
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.COZE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.COZE_SUPABASE_SERVICE_ROLE_KEY;
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

    // If Supabase is not configured, return error
    if (!useSupabase) {
      console.error('[Admin Info API] Database configuration missing');
      return NextResponse.json({
        success: false,
        error: 'Database configuration missing',
      }, { status: 500 });
    }

    // Try to initialize Supabase
    let supabase;
    try {
      supabase = getSupabaseClient();
    } catch (error) {
      console.error('[Admin Info API] Failed to initialize Supabase:', error);
      return NextResponse.json({
        success: false,
        error: 'Failed to initialize database',
      }, { status: 500 });
    }

    if (!supabase) {
      console.error('[Admin Info API] Database connection failed');
      return NextResponse.json({
        success: false,
        error: 'Database connection failed',
      }, { status: 500 });
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
      console.error('[Admin Info API] Supabase error:', error);
      return NextResponse.json({
        success: false,
        error: 'Failed to fetch info from database',
      }, { status: 500 });
    }

    // 添加详细日志
    console.log('[Admin Info API] Count:', count);
    console.log('[Admin Info API] Data items count:', data?.length || 0);
    data?.forEach((item: any, index: number) => {
      console.log(`[Admin Info API] Item ${index}: id=${item.id}, title=${item.title}, is_show=${item.is_show}`);
    });

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
    console.error('[Admin Info API] Failed to fetch info list:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch info list',
      },
      { status: 500 }
    );
  }
}

// POST - Create new info
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, type, language, sort, coverImage, isShow, keywords, summary, content } = body;

    // If Supabase is not configured, return error
    if (!useSupabase) {
      console.error('[Admin Info API] Database configuration missing');
      return NextResponse.json({
        success: false,
        error: 'Database configuration missing',
      }, { status: 500 });
    }

    // Try to initialize Supabase
    let supabase;
    try {
      supabase = getSupabaseClient();
    } catch (error) {
      console.error('[Admin Info API] Failed to initialize Supabase:', error);
      return NextResponse.json({
        success: false,
        error: 'Failed to initialize database client',
      }, { status: 500 });
    }

    if (!supabase) {
      console.error('[Admin Info API] Database connection failed');
      return NextResponse.json({
        success: false,
        error: 'Database connection failed',
      }, { status: 500 });
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
      console.error('[Admin Info API] Supabase insert error:', error);
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
    console.error('[Admin Info API] Failed to create info:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create info',
      },
      { status: 500 }
    );
  }
}
