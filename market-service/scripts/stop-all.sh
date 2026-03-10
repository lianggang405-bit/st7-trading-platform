#!/bin/bash
#
# 停止服务脚本
# 用途：停止 Redis 和 Market Service
#

echo "🛑 Stopping all services..."

# 停止 Market Service
if pgrep -f "tsx src/index.ts" > /dev/null; then
    echo "Stopping Market Service..."
    pkill -f "tsx src/index.ts"
    rm -f /tmp/market-service.pid
    echo "✅ Market Service stopped"
else
    echo "ℹ️ Market Service is not running"
fi

# 停止 Redis
if redis-cli ping > /dev/null 2>&1; then
    echo "Stopping Redis..."
    redis-cli shutdown
    sleep 2
    echo "✅ Redis stopped"
else
    echo "ℹ️ Redis is not running"
fi

echo ""
echo "✅ All services stopped"
