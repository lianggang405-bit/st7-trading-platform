#!/bin/bash

# 简单测试脚本：查询最近 1 分钟的 K 线数据

BASE_URL="http://localhost:3000/tv"

echo "🧪 Testing TradingView API - Last 1 minute..."
echo ""

# 获取服务器时间
TIME=$(curl -s "${BASE_URL}/time")
TO=$TIME
FROM=$((TIME - 60))  # 1分钟前

echo "Server time: $(date -d @$TIME)"
echo "Query range: $(date -d @$FROM) to $(date -d @$TO)"
echo ""

# 测试获取 BTCUSDT 最近 1 分钟的数据
echo "Test: GET /tv/history?symbol=BTCUSDT&resolution=1&from=${FROM}&to=${TO}"
echo "URL: ${BASE_URL}/history?symbol=BTCUSDT&resolution=1&from=${FROM}&to=${TO}"
echo ""

RESULT=$(curl -s "${BASE_URL}/history?symbol=BTCUSDT&resolution=1&from=${FROM}&to=${TO}")
echo "$RESULT" | jq '.' 2>/dev/null || echo "$RESULT"

# 检查是否有数据
if echo "$RESULT" | jq -e '.t' > /dev/null 2>&1; then
  COUNT=$(echo "$RESULT" | jq '.t | length')
  echo ""
  echo "✅ Found ${COUNT} K-line records"
else
  echo ""
  echo "⚠️ No data found (s=$(echo "$RESULT" | jq -r '.s'))"
fi
