#!/bin/bash
#
# 健康检查脚本
# 用途：检查所有服务是否正常运行
#

echo "🏥 Health Check"
echo "================================"

REDIS_STATUS="❌ Down"
MARKET_STATUS="❌ Down"

# 检查 Redis
if redis-cli ping > /dev/null 2>&1; then
    REDIS_STATUS="✅ Running"
else
    REDIS_STATUS="❌ Down"
fi

# 检查 Market Service
if pgrep -f "tsx src/index.ts" > /dev/null; then
    MARKET_STATUS="✅ Running"
else
    MARKET_STATUS="❌ Down"
fi

# 检查端口
REDIS_PORT=$(ss -tuln | grep ":6379 " > /dev/null 2>&1 && echo "✅ Listening" || echo "❌ Not listening")
MARKET_HTTP=$(ss -tuln | grep ":3000 " > /dev/null 2>&1 && echo "✅ Listening" || echo "❌ Not listening")
MARKET_WS=$(ss -tuln | grep ":8081 " > /dev/null 2>&1 && echo "✅ Listening" || echo "❌ Not listening")

# 输出结果
echo ""
echo "📦 Services:"
echo "   Redis:          $REDIS_STATUS"
echo "   Market Service: $MARKET_STATUS"
echo ""
echo "🌐 Ports:"
echo "   Redis (6379):           $REDIS_PORT"
echo "   Market HTTP (3000):     $MARKET_HTTP"
echo "   Market WebSocket (8081): $MARKET_WS"
echo ""

# 判断整体状态
if [ "$REDIS_STATUS" == "✅ Running" ] && [ "$MARKET_STATUS" == "✅ Running" ]; then
    echo "✅ All services are healthy!"
    exit 0
else
    echo "⚠️ Some services are down!"
    exit 1
fi
