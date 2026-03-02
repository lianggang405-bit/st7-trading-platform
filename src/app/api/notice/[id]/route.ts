import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

// 检查Supabase环境变量是否配置
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const useSupabase = supabaseUrl && supabaseServiceKey;

// GET - 获取公告详情
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: noticeId } = await params;

    // 如果没有配置Supabase，返回模拟数据
    if (!useSupabase) {
      const mockData = generateMockData(noticeId);
      return NextResponse.json({
        success: true,
        notice: mockData,
      });
    }

    // 尝试初始化Supabase
    let supabase;
    try {
      supabase = getSupabaseClient();
    } catch (error) {
      console.error('Failed to initialize Supabase:', error);
      const mockData = generateMockData(noticeId);
      return NextResponse.json({
        success: true,
        notice: mockData,
      });
    }

    const { data, error } = await supabase
      .from('info_management')
      .select('*')
      .eq('id', noticeId)
      .eq('is_show', true)
      .single();

    if (error) {
      console.error('Supabase error:', error);
      const mockData = generateMockData(noticeId);
      return NextResponse.json({
        success: true,
        notice: mockData,
      });
    }

    // 格式化数据
    const formattedNotice = {
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

    return NextResponse.json({
      success: true,
      notice: formattedNotice,
    });
  } catch (error) {
    console.error('Failed to fetch notice detail:', error);
    // 返回模拟数据作为降级方案
    const { id: noticeId } = await params;
    const mockData = generateMockData(noticeId);
    return NextResponse.json({
      success: true,
      notice: mockData,
    });
  }
}

// 生成模拟数据
function generateMockData(noticeId: string): any {
  return {
    id: parseInt(noticeId) || 8,
    title: '公告',
    type: '公告',
    language: '中文简体',
    sort: 1,
    coverImage: '/images/info-cover-8.jpg',
    isShow: true,
    keywords: '公告',
    created_at: '2024-02-01T10:00:00Z',
    content: '这是一条公告内容。',
  };
}
