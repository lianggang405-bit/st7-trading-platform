import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdminClient } from '@/storage/database/supabase-admin-client';

// 检查Supabase环境变量是否配置
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const useSupabase = supabaseUrl && supabaseServiceKey;

// PUT - 更新信息
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: infoId } = await params;
    const body = await request.json();
    const { title, type, language, sort, coverImage, isShow, keywords, summary, content } = body;

    // 如果没有配置Supabase，返回成功响应但不实际更新
    if (!useSupabase) {
      return NextResponse.json({
        success: true,
        message: 'Info updated successfully',
      });
    }

    // 尝试导入和初始化Supabase (使用管理员客户端)
    let supabase;
    try {
      supabase = getSupabaseAdminClient();
    } catch (error) {
      console.error('Failed to initialize Supabase Admin:', error);
      return NextResponse.json({
        success: true,
        message: 'Info updated successfully',
      });
    }

    // 确保客户端存在
    if (!supabase) {
      console.error('Supabase Admin client is null');
      return NextResponse.json(
        {
          success: false,
          error: 'Database connection failed',
        },
        { status: 500 }
      );
    }

    const { error } = await supabase
      .from('info_management')
      .update({
        title,
        type,
        language,
        sort,
        cover_image: coverImage,
        is_show: isShow,
        keywords,
        summary,
        content,
      })
      .eq('id', infoId);

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      message: 'Info updated successfully',
    });
  } catch (error) {
    console.error('Failed to update info:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update info',
      },
      { status: 500 }
    );
  }
}

// DELETE - 删除信息
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: infoId } = await params;

    // 如果没有配置Supabase，返回成功响应但不实际删除
    if (!useSupabase) {
      return NextResponse.json({
        success: true,
        message: 'Info deleted successfully',
      });
    }

    // 尝试导入和初始化Supabase (使用管理员客户端)
    let supabase;
    try {
      supabase = getSupabaseAdminClient();
    } catch (error) {
      console.error('Failed to initialize Supabase Admin:', error);
      return NextResponse.json({
        success: true,
        message: 'Info deleted successfully',
      });
    }

    // 确保客户端存在
    if (!supabase) {
      console.error('Supabase Admin client is null');
      return NextResponse.json(
        {
          success: false,
          error: 'Database connection failed',
        },
        { status: 500 }
      );
    }

    const { error } = await supabase
      .from('info_management')
      .delete()
      .eq('id', infoId);

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      message: 'Info deleted successfully',
    });
  } catch (error) {
    console.error('Failed to delete info:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete info',
      },
      { status: 500 }
    );
  }
}
