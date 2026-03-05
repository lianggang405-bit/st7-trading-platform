import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

// 检查Supabase环境变量是否配置
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.COZE_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.COZE_SUPABASE_ANON_KEY;
const useSupabase = supabaseUrl && supabaseAnonKey;

// GET - 获取公告详情
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: noticeId } = await params;

    if (!noticeId || isNaN(parseInt(noticeId))) {
      return NextResponse.json({
        success: false,
        error: 'Invalid notice ID',
      }, { status: 400 });
    }

    // 如果没有配置Supabase，返回404
    if (!useSupabase) {
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
      console.error('Failed to initialize Supabase:', error);
      return NextResponse.json({
        success: false,
        error: 'Failed to initialize database',
      }, { status: 500 });
    }

    const { data, error } = await supabase
      .from('info_management')
      .select('*')
      .eq('id', parseInt(noticeId))
      .single();

    if (error) {
      console.error('Supabase error:', error);

      // 处理查询不到记录的情况
      if (error.code === 'PGRST116') {
        return NextResponse.json({
          success: false,
          error: 'Notice not found',
        }, { status: 404 });
      }

      return NextResponse.json({
        success: false,
        error: 'Failed to fetch notice',
      }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({
        success: false,
        error: 'Notice not found',
      }, { status: 404 });
    }

    // 格式化数据
    const notice = {
      id: data.id,
      title: data.title,
      type: data.type,
      language: data.language,
      sort: data.sort,
      coverImage: data.cover_image,
      isShow: data.is_show,
      keywords: data.keywords,
      created_at: data.created_at,
      summary: data.summary,
      content: data.content,
    };

    console.log(`[Notice Detail API] Fetched notice id=${noticeId}, title=${notice.title}, has_content=${!!notice.content}`);

    return NextResponse.json({
      success: true,
      notice,
    });
  } catch (error) {
    console.error('Failed to fetch notice detail:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch notice detail',
      },
      { status: 500 }
    );
  }
}
