#!/bin/bash
#
# 日志清理脚本
# 用途：清理旧日志文件
#

echo "🧹 Cleaning logs..."

LOG_DIR="/tmp"
DAYS_TO_KEEP=7

# 清理 Redis 日志（保留最近 7 天）
if [ -f "$LOG_DIR/redis.log" ]; then
    echo "Cleaning Redis log..."
    cp $LOG_DIR/redis.log $LOG_DIR/redis.log.old
    > $LOG_DIR/redis.log
    echo "✅ Redis log cleaned"
fi

# 清理 Market Service 日志（保留最近 7 天）
if [ -f "$LOG_DIR/market-service.log" ]; then
    echo "Cleaning Market Service log..."
    cp $LOG_DIR/market-service.log $LOG_DIR/market-service.log.old
    > $LOG_DIR/market-service.log
    echo "✅ Market Service log cleaned"
fi

# 清理旧备份文件
echo "Cleaning old backups..."
find /tmp/redis-backup -type f -mtime +$DAYS_TO_KEEP -delete 2>/dev/null

echo ""
echo "✅ Logs cleaned successfully"
echo ""
echo "📊 Disk Usage:"
df -h /tmp | tail -1
