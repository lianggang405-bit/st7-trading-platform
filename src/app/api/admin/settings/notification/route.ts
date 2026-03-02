import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
const supabase = getSupabaseClient();
// GET - 获取通知设置
export async function GET(request: NextRequest) {
  try {
    const { data, error } = await supabase
      .from('settings')
      .select('*')
      .eq('key', 'notification')
      .single();

    if (error) {
      // 如果不存在，返回默认值
      return NextResponse.json({
        success: true,
        settings: {
          emailAccount: '',
          tokenPassword: '',
          port: '465',
          host: '',
          sender: '【ST5演示站】'
        }
      });
    }

    return NextResponse.json({
      success: true,
      settings: data.value
    });
  } catch (error) {
    console.error('Failed to fetch notification settings:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch settings'
    }, { status: 500 });
  }
}

// POST - 保存通知设置
export async function POST(request: NextRequest) {
  try {
    const settings = await request.json();

    // 更新或插入设置
    const { error } = await supabase
      .from('settings')
      .upsert({
        key: 'notification',
        value: settings,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'key'
      });

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      message: 'Settings saved successfully'
    });
  } catch (error) {
    console.error('Failed to save notification settings:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to save settings'
    }, { status: 500 });
  }
}
