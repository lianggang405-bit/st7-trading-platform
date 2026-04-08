import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

// 检查Supabase环境变量是否配置
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.COZE_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.COZE_SUPABASE_ANON_KEY;
const useSupabase = supabaseUrl && supabaseAnonKey;

// 备用公告数据（当数据库不可用时使用）
const mockNotices: Record<number, any> = {
  1: {
    id: 1,
    title: '平台服务升级公告',
    type: 'notice',
    language: 'zh-CN',
    sort: 1,
    coverImage: '',
    isShow: true,
    keywords: '升级,维护',
    created_at: new Date().toISOString(),
    summary: '平台将于本周进行服务升级，届时部分功能可能暂时不可用。',
    content: '# 平台服务升级公告\n\n尊敬的用户：\n\n为了给您提供更好的服务体验，平台将于本周进行服务升级。届时部分功能可能暂时不可用，请提前做好相关安排。\n\n## 升级时间\n本周六 00:00 - 06:00\n\n## 升级内容\n1. 交易系统优化\n2. 行情数据更新\n3. 用户界面改进\n\n感谢您的理解与支持！\n\n平台运营团队',
  },
  2: {
    id: 2,
    title: '新功能上线通知',
    type: 'notice',
    language: 'zh-CN',
    sort: 2,
    coverImage: '',
    isShow: true,
    keywords: '新功能,上线',
    created_at: new Date(Date.now() - 86400000).toISOString(),
    summary: '我们很高兴地宣布，平台新增多项功能，欢迎体验！',
    content: '# 新功能上线通知\n\n尊敬的用户：\n\n我们很高兴地宣布，平台新增以下功能，欢迎体验！\n\n## 新增功能\n1. **高级图表分析** - 支持更多技术指标\n2. **价格提醒** - 自定义价格波动提醒\n3. **多语言支持** - 新增多种语言版本\n\n如有任何问题，请联系客服。\n\n平台运营团队',
  },
  3: {
    id: 3,
    title: '交易规则调整通知',
    type: 'notice',
    language: 'zh-CN',
    sort: 3,
    coverImage: '',
    isShow: true,
    keywords: '规则,调整',
    created_at: new Date(Date.now() - 172800000).toISOString(),
    summary: '为更好地服务用户，平台对部分交易规则进行了优化调整。',
    content: '# 交易规则调整通知\n\n尊敬的用户：\n\n为更好地服务用户，平台对部分交易规则进行了优化调整。\n\n## 调整内容\n1. 交易时间调整\n2. 手续费优化\n3. 风控规则更新\n\n请仔细阅读新的交易规则，如有疑问请联系客服。\n\n平台运营团队',
  },
};

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

    const id = parseInt(noticeId);

    // 如果没有配置Supabase，尝试返回mock数据
    if (!useSupabase) {
      const mockNotice = mockNotices[id];
      if (mockNotice) {
        console.log('[Notice Detail API] Using mock data for notice id=' + id);
        return NextResponse.json({
          success: true,
          notice: mockNotice,
          isMockData: true,
        });
      }
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
      // 尝试返回mock数据
      const mockNotice = mockNotices[id];
      if (mockNotice) {
        console.log('[Notice Detail API] Using mock data (Supabase init failed)');
        return NextResponse.json({
          success: true,
          notice: mockNotice,
          isMockData: true,
        });
      }
      return NextResponse.json({
        success: false,
        error: 'Failed to initialize database',
      }, { status: 500 });
    }

    const { data, error } = await supabase
      .from('info_management')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Supabase error:', error);

      // 处理查询不到记录的情况，尝试返回mock数据
      if (error.code === 'PGRST116') {
        const mockNotice = mockNotices[id];
        if (mockNotice) {
          console.log('[Notice Detail API] Using mock data (notice not found in DB)');
          return NextResponse.json({
            success: true,
            notice: mockNotice,
            isMockData: true,
          });
        }
        return NextResponse.json({
          success: false,
          error: 'Notice not found',
        }, { status: 404 });
      }

      // 其他错误，尝试返回mock数据
      const mockNotice = mockNotices[id];
      if (mockNotice) {
        console.log('[Notice Detail API] Using mock data (query failed)');
        return NextResponse.json({
          success: true,
          notice: mockNotice,
          isMockData: true,
        });
      }

      return NextResponse.json({
        success: false,
        error: 'Failed to fetch notice',
      }, { status: 500 });
    }

    if (!data) {
      // 尝试返回mock数据
      const mockNotice = mockNotices[id];
      if (mockNotice) {
        return NextResponse.json({
          success: true,
          notice: mockNotice,
          isMockData: true,
        });
      }
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
    // 尝试返回mock数据
    const noticeId = parseInt(new URL(request.url).pathname.split('/').pop() || '0');
    const mockNotice = mockNotices[noticeId];
    if (mockNotice) {
      console.log('[Notice Detail API] Using mock data (exception caught)');
      return NextResponse.json({
        success: true,
        notice: mockNotice,
        isMockData: true,
      });
    }
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch notice detail',
      },
      { status: 500 }
    );
  }
}
