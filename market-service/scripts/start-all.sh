#!/bin/bash
#
# 统一启动脚本
# 用途：启动 Redis 和 Market Service
#

echo "🚀 Starting all services..."

# 启动 Redis
bash /workspace/projects/market-service/scripts/start-redis.sh

# 启动 Market Service
bash /workspace/projects/market-service/scripts/start-market-service.sh

echo ""
echo "✅ All services started successfully!"
echo ""
echo "📊 Service Status:"
echo "   Redis: $(redis-cli ping 2>/dev/null || echo '❌ Not running')"
echo "   Market Service: $(pgrep -f 'tsx src/index.ts' > /dev/null && echo '✅ Running' || echo '❌ Not running')"
echo ""
echo "📝 Logs:"
echo "   Redis: tail -f /tmp/redis.log"
echo "   Market Service: tail -f /tmp/market-service.log"
