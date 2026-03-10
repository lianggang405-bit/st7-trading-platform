#!/bin/bash
#
# 统一启动脚本
# 用途：启动 Redis 和 Market Service
#

# 获取脚本所在目录
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "🚀 Starting all services..."

# 启动 Redis
bash "$SCRIPT_DIR/start-redis.sh"

# 启动 Market Service
bash "$SCRIPT_DIR/start-market-service.sh"

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
