#!/bin/bash
#
# Redis 监控脚本
# 用途：监控 Redis 状态和性能
#

echo "📊 Redis Monitor"
echo "================================"

# 检查连接
if ! redis-cli ping > /dev/null 2>&1; then
    echo "❌ Redis is not running!"
    exit 1
fi

# 基本信息
echo ""
echo "📈 Status:"
redis-cli ping
UPTIME=$(redis-cli info server | grep uptime_in_seconds | cut -d: -f2 | tr -d '\r')
echo "   Uptime: ${UPTIME} seconds"

# 内存使用
echo ""
echo "💾 Memory:"
MEMORY_USED=$(redis-cli info memory | grep used_memory_human | cut -d: -f2)
MEMORY_PEAK=$(redis-cli info memory | grep used_memory_peak_human | cut -d: -f2)
MEMORY_FRAG=$(redis-cli info memory | grep mem_fragmentation_ratio | cut -d: -f2)
echo "   Used: $MEMORY_USED"
echo "   Peak: $MEMORY_PEAK"
echo "   Fragmentation: $MEMORY_FRAG"

# 连接信息
echo ""
echo "🔌 Connections:"
CLIENTS=$(redis-cli info clients | grep connected_clients | cut -d: -f2)
echo "   Connected: $CLIENTS"

# 数据库信息
echo ""
echo "🗄️ Database:"
DB_SIZE=$(redis-cli dbsize)
echo "   Total Keys: $DB_SIZE"

# 缓存统计
echo ""
echo "⚡ Cache Stats:"
HITS=$(redis-cli info stats | grep keyspace_hits | cut -d: -f2 | tr -d '\r')
MISSES=$(redis-cli info stats | grep keyspace_misses | cut -d: -f2 | tr -d '\r')
if [ -n "$HITS" ] && [ "$HITS" != "0" ]; then
    TOTAL=$((HITS + MISSES))
    HIT_RATE=$(echo "scale=2; $HITS * 100 / $TOTAL" | bc)
    echo "   Hits: $HITS"
    echo "   Misses: $MISSES"
    echo "   Hit Rate: ${HIT_RATE}%"
else
    echo "   Not enough data yet"
fi

# K线缓存键
echo ""
echo "🕯️ K-line Cache Keys:"
KLINE_KEYS=$(redis-cli --scan --pattern "kline:*" | wc -l)
echo "   Total: $KLINE_KEYS"

# 慢查询
echo ""
echo "⏱️ Slow Queries:"
SLOWLOG_LEN=$(redis-cli slowlog len)
if [ "$SLOWLOG_LEN" -gt "0" ]; then
    echo "   Total: $SLOWLOG_LEN"
    redis-cli slowlog get 5
else
    echo "   No slow queries"
fi
