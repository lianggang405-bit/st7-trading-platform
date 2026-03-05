import { NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

// GET - 获取所有公告记录（用于调试）
export async function GET() {
  try {
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
      .from('info_management')
      .select('*')
      .order('id', { ascending: false });

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json({
        success: false,
        error: error.message,
      });
    }

    console.log('[Debug API] All records from info_management:', data?.length || 0);
    data?.forEach((item: any, index: number) => {
      console.log(`[Debug API] Item ${index}: id=${item.id}, title=${item.title}, is_show=${item.is_show}, created_at=${item.created_at}`);
    });

    return NextResponse.json({
      success: true,
      count: data?.length || 0,
      records: data || [],
    });
  } catch (error) {
    console.error('Failed to fetch all info records:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch records',
    });
  }
}
