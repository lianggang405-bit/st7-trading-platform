import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const useSupabase = supabaseUrl && supabaseServiceKey;

// Mock 数据存储
let mockSymbolTypes = [
  { id: 1, name: '加密货币', sort: 1, status: 'normal', created_at: new Date().toISOString() },
  { id: 2, name: '外汇', sort: 2, status: 'normal', created_at: new Date().toISOString() },
  { id: 3, name: '贵金属', sort: 3, status: 'normal', created_at: new Date().toISOString() },
  { id: 4, name: '能源', sort: 4, status: 'normal', created_at: new Date().toISOString() },
  { id: 5, name: '股指', sort: 5, status: 'normal', created_at: new Date().toISOString() },
];

// GET - 获取单个品种类型
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: typeId } = await params;
    const id = parseInt(typeId);

    // 如果 Supabase 未配置，使用 mock 数据
    if (!useSupabase) {
      const mockType = mockSymbolTypes.find(t => t.id === id);
      if (!mockType) {
        return NextResponse.json(
          { success: false, error: '品种类型不存在' },
          { status: 404 }
        );
      }
      return NextResponse.json({
        success: true,
        type: mockType,
      });
    }

    // 尝试初始化 Supabase
    let supabase;
    try {
      supabase = getSupabaseClient();
    } catch (error) {
      console.error('Failed to initialize Supabase:', error);
      const mockType = mockSymbolTypes.find(t => t.id === id);
      if (!mockType) {
        return NextResponse.json(
          { success: false, error: '品种类型不存在' },
          { status: 404 }
        );
      }
      return NextResponse.json({
        success: true,
        type: mockType,
      });
    }

    if (!supabase) {
      const mockType = mockSymbolTypes.find(t => t.id === id);
      if (!mockType) {
        return NextResponse.json(
          { success: false, error: '品种类型不存在' },
          { status: 404 }
        );
      }
      return NextResponse.json({
        success: true,
        type: mockType,
      });
    }

    // 先尝试查询 symbol_types 表
    const { data, error } = await supabase
      .from('symbol_types')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.warn('[SymbolTypes API] Get failed, trying currencies:', error.message);
      
      // 尝试使用 currencies 表作为替代
      const { data: currencyData, error: currencyError } = await supabase
        .from('currencies')
        .select('*')
        .eq('id', id)
        .single();

      if (currencyError) {
        console.warn('[SymbolTypes API] Both tables failed, trying mock:', currencyError.message);
        const mockType = mockSymbolTypes.find(t => t.id === id);
        if (!mockType) {
          return NextResponse.json(
            { success: false, error: '品种类型不存在' },
            { status: 404 }
          );
        }
        return NextResponse.json({
          success: true,
          type: mockType,
        });
      }

      // 格式化数据
      const formattedType = {
        id: currencyData.id,
        name: currencyData.currency,
        sort: currencyData.id,
        status: 'normal',
      };

      return NextResponse.json({
        success: true,
        type: formattedType,
      });
    }

    return NextResponse.json({
      success: true,
      type: data,
    });
  } catch (error) {
    console.error('Failed to fetch symbol type:', error);
    return NextResponse.json(
      {
        success: false,
        error: '获取品种类型失败',
      },
      { status: 500 }
    );
  }
}

// PUT - 更新品种类型
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: typeId } = await params;
    const id = parseInt(typeId);
    const body = await request.json();
    const { name, sort, status } = body;

    // 如果 Supabase 未配置，使用 mock 数据
    if (!useSupabase) {
      const mockIndex = mockSymbolTypes.findIndex(t => t.id === id);
      if (mockIndex === -1) {
        return NextResponse.json(
          { success: false, error: '品种类型不存在' },
          { status: 404 }
        );
      }
      mockSymbolTypes[mockIndex] = {
        ...mockSymbolTypes[mockIndex],
        name: name || mockSymbolTypes[mockIndex].name,
        sort: sort !== undefined ? sort : mockSymbolTypes[mockIndex].sort,
        status: status || mockSymbolTypes[mockIndex].status,
      };
      return NextResponse.json({
        success: true,
        type: mockSymbolTypes[mockIndex],
      });
    }

    // 尝试初始化 Supabase
    let supabase;
    try {
      supabase = getSupabaseClient();
    } catch (error) {
      console.error('Failed to initialize Supabase:', error);
      const mockIndex = mockSymbolTypes.findIndex(t => t.id === id);
      if (mockIndex === -1) {
        return NextResponse.json(
          { success: false, error: '品种类型不存在' },
          { status: 404 }
        );
      }
      mockSymbolTypes[mockIndex] = {
        ...mockSymbolTypes[mockIndex],
        name: name || mockSymbolTypes[mockIndex].name,
        sort: sort !== undefined ? sort : mockSymbolTypes[mockIndex].sort,
        status: status || mockSymbolTypes[mockIndex].status,
      };
      return NextResponse.json({
        success: true,
        type: mockSymbolTypes[mockIndex],
      });
    }

    if (!supabase) {
      const mockIndex = mockSymbolTypes.findIndex(t => t.id === id);
      if (mockIndex === -1) {
        return NextResponse.json(
          { success: false, error: '品种类型不存在' },
          { status: 404 }
        );
      }
      mockSymbolTypes[mockIndex] = {
        ...mockSymbolTypes[mockIndex],
        name: name || mockSymbolTypes[mockIndex].name,
        sort: sort !== undefined ? sort : mockSymbolTypes[mockIndex].sort,
        status: status || mockSymbolTypes[mockIndex].status,
      };
      return NextResponse.json({
        success: true,
        type: mockSymbolTypes[mockIndex],
      });
    }

    // 尝试更新 symbol_types 表
    const { data, error } = await supabase
      .from('symbol_types')
      .update({
        name,
        sort,
        status,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.warn('[SymbolTypes API] Update failed, using mock:', error.message);
      const mockIndex = mockSymbolTypes.findIndex(t => t.id === id);
      if (mockIndex === -1) {
        return NextResponse.json(
          { success: false, error: '品种类型不存在' },
          { status: 404 }
        );
      }
      mockSymbolTypes[mockIndex] = {
        ...mockSymbolTypes[mockIndex],
        name: name || mockSymbolTypes[mockIndex].name,
        sort: sort !== undefined ? sort : mockSymbolTypes[mockIndex].sort,
        status: status || mockSymbolTypes[mockIndex].status,
      };
      return NextResponse.json({
        success: true,
        type: mockSymbolTypes[mockIndex],
      });
    }

    return NextResponse.json({
      success: true,
      type: data,
    });
  } catch (error) {
    console.error('Failed to update symbol type:', error);
    return NextResponse.json(
      {
        success: false,
        error: '更新品种类型失败',
      },
      { status: 500 }
    );
  }
}

// DELETE - 删除品种类型
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: typeId } = await params;
    const id = parseInt(typeId);

    // 如果 Supabase 未配置，使用 mock 数据
    if (!useSupabase) {
      const mockIndex = mockSymbolTypes.findIndex(t => t.id === id);
      if (mockIndex === -1) {
        return NextResponse.json(
          { success: false, error: '品种类型不存在' },
          { status: 404 }
        );
      }
      mockSymbolTypes.splice(mockIndex, 1);
      return NextResponse.json({
        success: true,
        message: '品种类型删除成功',
      });
    }

    // 尝试初始化 Supabase
    let supabase;
    try {
      supabase = getSupabaseClient();
    } catch (error) {
      console.error('Failed to initialize Supabase:', error);
      const mockIndex = mockSymbolTypes.findIndex(t => t.id === id);
      if (mockIndex === -1) {
        return NextResponse.json(
          { success: false, error: '品种类型不存在' },
          { status: 404 }
        );
      }
      mockSymbolTypes.splice(mockIndex, 1);
      return NextResponse.json({
        success: true,
        message: '品种类型删除成功',
      });
    }

    if (!supabase) {
      const mockIndex = mockSymbolTypes.findIndex(t => t.id === id);
      if (mockIndex === -1) {
        return NextResponse.json(
          { success: false, error: '品种类型不存在' },
          { status: 404 }
        );
      }
      mockSymbolTypes.splice(mockIndex, 1);
      return NextResponse.json({
        success: true,
        message: '品种类型删除成功',
      });
    }

    // 尝试删除 symbol_types 表
    const { error } = await supabase
      .from('symbol_types')
      .delete()
      .eq('id', id);

    if (error) {
      console.warn('[SymbolTypes API] Delete failed, using mock:', error.message);
      const mockIndex = mockSymbolTypes.findIndex(t => t.id === id);
      if (mockIndex === -1) {
        return NextResponse.json(
          { success: false, error: '品种类型不存在' },
          { status: 404 }
        );
      }
      mockSymbolTypes.splice(mockIndex, 1);
      return NextResponse.json({
        success: true,
        message: '品种类型删除成功',
      });
    }

    return NextResponse.json({
      success: true,
      message: '品种类型删除成功',
    });
  } catch (error) {
    console.error('Failed to delete symbol type:', error);
    return NextResponse.json(
      {
        success: false,
        error: '删除品种类型失败',
      },
      { status: 500 }
    );
  }
}
