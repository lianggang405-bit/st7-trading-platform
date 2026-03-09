#!/bin/bash

# 启动服务并测试 TradingView API
echo "🚀 Starting Market Collector Service..."
echo ""

# 启动服务（后台运行）
# 注意：确保 SUPABASE_URL 和 SUPABASE_SERVICE_ROLE_KEY 环境变量已设置
# 或者通过 .env 文件配置
export SUPABASE_URL=${SUPABASE_URL:-"https://brfzboxaxknlypapwajy.supabase.co"}
export SUPABASE_SERVICE_ROLE_KEY=${SUPABASE_SERVICE_ROLE_KEY:-"your-service-role-key-here"}

npm run dev &
SERVER_PID=$!

echo "📡 Server started (PID: $SERVER_PID)"
echo "⏳ Waiting 8 seconds for server to initialize..."
sleep 8

echo ""
echo "🧪 Testing TradingView API..."
echo ""

# 测试 1: 配置接口
echo "Test 1: GET /tv/config"
curl -s http://localhost:3000/tv/config | jq '.'
echo ""

# 测试 2: 时间接口
echo "Test 2: GET /tv/time"
curl -s http://localhost:3000/tv/time
echo ""

# 测试 3: 符号信息接口
echo "Test 3: GET /tv/symbols?symbol=BTCUSDT"
curl -s http://localhost:3000/tv/symbols?symbol=BTCUSDT | jq '.'
echo ""

# 测试 4: 历史K线接口（获取过去24小时的数据）
echo "Test 4: GET /tv/history (last 24 hours)"
FROM_TIME=$(date -d '24 hours ago' +%s)
TO_TIME=$(date +%s)
echo "From: $FROM_TIME, To: $TO_TIME"
curl -s "http://localhost:3000/tv/history?symbol=BTCUSDT&resolution=1&from=$FROM_TIME&to=$TO_TIME" | jq '.'
echo ""

# 测试 5: 搜索接口
echo "Test 5: GET /tv/search?query=BTC"
curl -s "http://localhost:3000/tv/search?query=BTC" | jq '.'
echo ""

# 测试 6: 健康检查
echo "Test 6: GET /health"
curl -s http://localhost:3000/health | jq '.'
echo ""

# 清理
echo ""
echo "🧹 Cleaning up..."
kill $SERVER_PID 2>/dev/null
echo "✅ Done!"
