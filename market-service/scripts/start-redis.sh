#!/bin/bash
#
# Redis 启动脚本
# 用途：启动 Redis 服务
#

echo "🚀 Starting Redis..."

# 检查 Redis 是否已经在运行
if redis-cli ping > /dev/null 2>&1; then
    echo "✅ Redis is already running"
    exit 0
fi

# 启动 Redis
redis-server /etc/redis/redis.conf \
    --daemonize yes \
    --port 6379 \
    --bind 127.0.0.1 \
    --logfile /tmp/redis.log \
    --dir /tmp

# 等待 Redis 启动
sleep 2

# 检查启动状态
if redis-cli ping > /dev/null 2>&1; then
    echo "✅ Redis started successfully"
    echo "   Port: 6379"
    echo "   Log: /tmp/redis.log"
    echo "   Data: /tmp/"
else
    echo "❌ Failed to start Redis"
    echo "   Check logs: tail -f /tmp/redis.log"
    exit 1
fi
