import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

const supabase = getSupabaseClient();

// GET - 测试 crypto_addresses 表
export async function GET(request: NextRequest) {
  try {
    console.log('[Test Crypto Addresses] Starting test...');
    
    // 测试 1: 检查表是否存在
    console.log('[Test Crypto Addresses] Test 1: Checking if table exists...');
    const { data: testData, error: testError } = await supabase
      .from('crypto_addresses')
      .select('id')
      .limit(1);
    
    console.log('[Test Crypto Addresses] Test 1 result:', { data: testData, error: testError });
    
    if (testError) {
      console.error('[Test Crypto Addresses] Table does not exist or error:', testError);
      return NextResponse.json({
        success: false,
        test: 'table_exists',
        error: testError.message,
        code: testError.code
      });
    }
    
    console.log('[Test Crypto Addresses] Table exists!');
    
    // 测试 2: 尝试读取所有数据
    console.log('[Test Crypto Addresses] Test 2: Reading all data...');
    const { data: allData, error: readError } = await supabase
      .from('crypto_addresses')
      .select('*');
    
    console.log('[Test Crypto Addresses] Test 2 result:', { count: allData?.length, error: readError });
    
    if (readError) {
      console.error('[Test Crypto Addresses] Read error:', readError);
      return NextResponse.json({
        success: false,
        test: 'read_data',
        error: readError.message,
        code: readError.code
      });
    }
    
    // 测试 3: 尝试插入一条测试数据
    console.log('[Test Crypto Addresses] Test 3: Inserting test data...');
    const testAddress = {
      currency: 'TEST',
      protocol: 'TEST',
      network: 'TEST',
      address: 'test_address_' + Date.now(),
      usd_price: 1.00,
      status: 'active',
      created_by: 'test'
    };
    
    const { data: insertedData, error: insertError } = await supabase
      .from('crypto_addresses')
      .insert([testAddress])
      .select()
      .single();
    
    console.log('[Test Crypto Addresses] Test 3 result:', { data: insertedData, error: insertError });
    
    if (insertError) {
      console.error('[Test Crypto Addresses] Insert error:', insertError);
      return NextResponse.json({
        success: false,
        test: 'insert_data',
        error: insertError.message,
        code: insertError.code
      });
    }
    
    console.log('[Test Crypto Addresses] Test 3 successful! Inserted ID:', insertedData.id);
    
    // 测试 4: 尝试更新刚才插入的数据
    console.log('[Test Crypto Addresses] Test 4: Updating test data...');
    const { data: updatedData, error: updateError } = await supabase
      .from('crypto_addresses')
      .update({ usd_price: 2.00, updated_at: new Date().toISOString() })
      .eq('id', insertedData.id)
      .select()
      .single();
    
    console.log('[Test Crypto Addresses] Test 4 result:', { data: updatedData, error: updateError });
    
    if (updateError) {
      console.error('[Test Crypto Addresses] Update error:', updateError);
      return NextResponse.json({
        success: false,
        test: 'update_data',
        error: updateError.message,
        code: updateError.code
      });
    }
    
    console.log('[Test Crypto Addresses] Test 4 successful!');
    
    // 测试 5: 删除测试数据
    console.log('[Test Crypto Addresses] Test 5: Deleting test data...');
    const { error: deleteError } = await supabase
      .from('crypto_addresses')
      .delete()
      .eq('id', insertedData.id);
    
    console.log('[Test Crypto Addresses] Test 5 result:', { error: deleteError });
    
    if (deleteError) {
      console.error('[Test Crypto Addresses] Delete error:', deleteError);
      return NextResponse.json({
        success: false,
        test: 'delete_data',
        error: deleteError.message,
        code: deleteError.code
      });
    }
    
    console.log('[Test Crypto Addresses] All tests passed!');
    
    return NextResponse.json({
      success: true,
      message: 'All tests passed!',
      tests: {
        table_exists: 'passed',
        read_data: 'passed',
        insert_data: 'passed',
        update_data: 'passed',
        delete_data: 'passed'
      },
      existingDataCount: allData?.length || 0,
      existingData: allData
    });
  } catch (error) {
    console.error('[Test Crypto Addresses] Unexpected error:', error);
    return NextResponse.json({
      success: false,
      test: 'unexpected_error',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
