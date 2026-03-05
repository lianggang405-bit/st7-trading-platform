import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

// 检查Supabase环境变量是否配置
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.COZE_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.COZE_SUPABASE_ANON_KEY;
const useSupabase = supabaseUrl && supabaseAnonKey;

// GET - 获取公告列表（仅返回展示的公告）
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const type = searchParams.get('type') || '';
    const language = searchParams.get('language') || '';

    // 如果没有配置Supabase，返回错误
    if (!useSupabase) {
      console.error('[Notice API] Database configuration missing');
      return NextResponse.json({
        success: false,
        error: 'Database configuration missing',
      }, { status: 500 });
    }

    // 尝试初始化Supabase
    let supabase;
    try {
      supabase = getSupabaseClient();
    } catch (error) {
      console.error('[Notice API] Failed to initialize Supabase:', error);
      return NextResponse.json({
        success: false,
        error: 'Failed to initialize database',
      }, { status: 500 });
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
      console.error('[Notice API] Supabase error:', error);
      return NextResponse.json({
        success: false,
        error: 'Failed to fetch notices from database',
      }, { status: 500 });
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
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch notices',
      },
      { status: 500 }
    );
  }
}
