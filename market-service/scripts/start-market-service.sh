#!/bin/bash
#
# Market Service 启动脚本
# 用途：启动 Market Collector Service
#

echo "🚀 Starting Market Service..."

# 进入项目目录
cd /workspace/projects/market-service

# 检查是否已经在运行
if pgrep -f "tsx src/index.ts" > /dev/null; then
    echo "✅ Market Service is already running"
    echo "   PID: $(pgrep -f 'tsx src/index.ts')"
    exit 0
fi

# 启动服务
nohup npx tsx src/index.ts > /tmp/market-service.log 2>&1 &

# 保存 PID
echo $! > /tmp/market-service.pid

# 等待启动
sleep 5

# 检查启动状态
if pgrep -f "tsx src/index.ts" > /dev/null; then
    echo "✅ Market Service started successfully"
    echo "   PID: $(cat /tmp/market-service.pid)"
    echo "   Log: /tmp/market-service.log"
    echo "   WebSocket: ws://localhost:8081"
    echo "   HTTP: http://localhost:3000"
else
    echo "❌ Failed to start Market Service"
    echo "   Check logs: tail -f /tmp/market-service.log"
    exit 1
fi
