#!/bin/bash

# 启动 WebSocket 测试脚本
echo "🚀 Starting WebSocket Test..."
echo ""

# 启动服务（后台运行）
# 确保已设置环境变量：SUPABASE_URL 和 SUPABASE_SERVICE_ROLE_KEY
# 从 .env 文件读取

npm run dev &
SERVER_PID=$!

echo "📡 Server started (PID: $SERVER_PID)"
echo "⏳ Waiting 5 seconds for server to initialize..."
sleep 5

echo ""
echo "🧪 Starting WebSocket test client..."
echo ""

# 运行测试客户端
npx tsx test-websocket.ts

# 清理
echo ""
echo "🧹 Cleaning up..."
kill $SERVER_PID 2>/dev/null
echo "✅ Done!"
