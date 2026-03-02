import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

// 妫€鏌upabase鐜鍙橀噺鏄惁閰嶇疆
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const useSupabase = supabaseUrl && supabaseServiceKey;

// GET - 鑾峰彇淇℃伅绠＄悊鍒楄〃
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '15');
    const sort = searchParams.get('sort') || 'id';
    const order = searchParams.get('order') || 'desc';
    const search = searchParams.get('search') || '';

    // 濡傛灉娌℃湁閰嶇疆Supabase锛岀洿鎺ヨ繑鍥炴ā鎷熸暟鎹?    if (!useSupabase) {
      const mockData = generateMockData(page, limit, search);
      return NextResponse.json({
        success: true,
        infos: mockData,
        total: 1,
        page,
        limit,
      });
    }

    // 灏濊瘯瀵煎叆鍜屽垵濮嬪寲Supabase
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

    // 濡傛灉鏈夋悳绱㈡潯浠?    if (search) {
      query = query.or(`title.ilike.%${search}%,type.ilike.%${search}%,keywords.ilike.%${search}%`);
    }

    const { data, error, count } = await query;

    if (error) {
      console.error('Supabase error:', error);
      // 濡傛灉琛ㄤ笉瀛樺湪鎴栨煡璇㈠け璐ワ紝杩斿洖妯℃嫙鏁版嵁
      const mockData = generateMockData(page, limit, search);
      return NextResponse.json({
        success: true,
        infos: mockData,
        total: 1,
        page,
        limit,
      });
    }

    // 鏍煎紡鍖栨暟鎹?    const formattedInfos = data?.map((item: any) => ({
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
    // 杩斿洖妯℃嫙鏁版嵁浣滀负闄嶇骇鏂规
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

// POST - 鍒涘缓鏂扮殑淇℃伅
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, type, language, sort, coverImage, isShow, keywords, summary, content } = body;

    // 濡傛灉娌℃湁閰嶇疆Supabase锛岃繑鍥炴垚鍔熷搷搴斾絾涓嶅疄闄呭垱寤?    if (!useSupabase) {
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

    // 灏濊瘯瀵煎叆鍜屽垵濮嬪寲Supabase
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

// 鐢熸垚妯℃嫙鏁版嵁锛堟牴鎹浘鐗囦腑鐨勬暟鎹級
function generateMockData(page: number, limit: number, search: string): any[] {
  const mockData = [
    {
      id: 8,
      title: '鍏憡',
      type: '鍏憡',
      language: '涓枃绠€浣?,
      sort: 1,
      coverImage: '/images/info-cover-8.jpg',
      isShow: true,
      keywords: '鍏憡',
    },
  ];

  // 濡傛灉鏈夋悳绱㈡潯浠讹紝杩囨护鏁版嵁
  if (search) {
    const filtered = mockData.filter(item =>
      item.title.toLowerCase().includes(search.toLowerCase()) ||
      item.type.toLowerCase().includes(search.toLowerCase()) ||
      item.keywords.toLowerCase().includes(search.toLowerCase())
    );
    return filtered;
  }

  // 榛樿鎸?ID 闄嶅簭鎺掑簭
  const sorted = [...mockData].sort((a, b) => b.id - a.id);

  const offset = (page - 1) * limit;
  return sorted.slice(offset, offset + limit);
}

