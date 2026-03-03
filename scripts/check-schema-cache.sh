#!/bin/bash

# 验证 Supabase Schema 缓存是否已刷新

SUPABASE_URL="${NEXT_PUBLIC_SUPABASE_URL:-https://brfzboxaxknlypapwajy.supabase.co}"
SUPABASE_KEY="${SUPABASE_SERVICE_ROLE_KEY:-}"

if [ -z "$SUPABASE_KEY" ]; then
    echo "错误：请设置 SUPABASE_SERVICE_ROLE_KEY 环境变量"
    echo "使用方法："
    echo "  SUPABASE_SERVICE_ROLE_KEY=your_key bash scripts/check-schema-cache.sh"
    echo ""
    exit 1
fi

TEST_IMAGE="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="

echo "================================"
echo "验证 Supabase Schema 缓存状态"
echo "================================"
echo ""

echo "测试 1: 尝试使用新字段 id_card_front_url 和 id_card_back_url..."
echo ""

RESPONSE=$(curl -s -X POST "${SUPABASE_URL}/rest/v1/applications" \
  -H "Content-Type: application/json" \
  -H "apikey: ${SUPABASE_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_KEY}" \
  -H "Prefer: return=minimal" \
  -d "{
    \"user_id\": 9999,
    \"type\": \"verification\",
    \"status\": \"pending\",
    \"real_name\": \"Schema 缓存测试\",
    \"id_card\": \"999999999999999999\",
    \"id_card_front_url\": \"${TEST_IMAGE}\",
    \"id_card_back_url\": \"${TEST_IMAGE}\"
  }")

if echo "$RESPONSE" | grep -q "PGRST204"; then
    echo "❌ Schema 缓存未刷新"
    echo "   错误信息: PostGREST 无法识别新字段"
    echo ""
    echo "解决方案："
    echo "1. 登录 Supabase 控制台"
    echo "2. 进入 Database -> Extensions -> API -> PostgREST"
    echo "3. 点击 Disable，等待几秒后，再点击 Enable"
    echo "4. 等待服务重启完成（约 10-30 秒）"
    echo ""
    echo "或者等待 Supabase 自动刷新（可能需要几小时到几天）"
    echo ""
    echo "当前状态：使用临时存储方案（图片数据存储在 reject_reason 字段中）"
else
    echo "✅ Schema 缓存已刷新！"
    echo "   新字段 id_card_front_url 和 id_card_back_url 可用"
    echo ""
    echo "接下来需要执行数据迁移："
    echo "1. 检查 VERIFICATION_FIX.md 中的迁移脚本"
    echo "2. 在 Supabase SQL Editor 中执行迁移 SQL"
    echo "3. 将临时存储的图片数据迁移到正确的字段"
fi

echo ""
echo "================================"
echo "验证完成"
echo "================================"
